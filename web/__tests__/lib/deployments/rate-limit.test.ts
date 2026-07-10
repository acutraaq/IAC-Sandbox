import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateIfNotExists = vi.fn();
const mockDownload = vi.fn();
const mockUpload = vi.fn();
const mockGetBlockBlobClient = vi.fn(() => ({
  download: mockDownload,
  upload: mockUpload,
}));
const mockGetContainerClient = vi.fn(() => ({
  createIfNotExists: mockCreateIfNotExists,
  getBlockBlobClient: mockGetBlockBlobClient,
}));

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: {
    fromConnectionString: vi.fn(() => ({
      getContainerClient: mockGetContainerClient,
    })),
  },
}));

vi.mock("@/lib/server-env", () => ({
  serverEnv: { AZURE_STORAGE_CONNECTION_STRING: "test-connection-string" },
}));

const { checkAndRecordSubmission } = await import("@/lib/deployments/rate-limit");

function makeStream(text: string) {
  return {
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(text);
    },
  };
}

function notFoundError() {
  return Object.assign(new Error("BlobNotFound"), { statusCode: 404 });
}

function preconditionFailedError() {
  return Object.assign(new Error("ConditionNotMet"), { statusCode: 412 });
}

const NOW = new Date("2026-07-08T12:00:00.000Z").getTime();

describe("checkAndRecordSubmission", () => {
  beforeEach(() => {
    mockCreateIfNotExists.mockReset().mockResolvedValue(undefined);
    mockDownload.mockReset();
    mockUpload.mockReset().mockResolvedValue(undefined);
  });

  it("allows and creates a fresh window when no blob exists yet", async () => {
    mockDownload.mockRejectedValueOnce(notFoundError());

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
    expect(mockUpload).toHaveBeenCalledOnce();
    const [content, , options] = mockUpload.mock.calls[0];
    expect(JSON.parse(content as string)).toEqual({
      windowStart: new Date(NOW).toISOString(),
      count: 1,
    });
    expect(options).toEqual({ conditions: { ifNoneMatch: "*" } });
  });

  it("allows and increments count when under the cap within the window", async () => {
    const windowStart = new Date(NOW - 10 * 60 * 1000).toISOString(); // 10 min ago
    mockDownload.mockResolvedValueOnce({
      etag: "etag-1",
      readableStreamBody: makeStream(JSON.stringify({ windowStart, count: 5 })),
    });

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
    const [content, , options] = mockUpload.mock.calls[0];
    expect(JSON.parse(content as string)).toEqual({ windowStart, count: 6 });
    expect(options).toEqual({ conditions: { ifMatch: "etag-1" } });
  });

  it("blocks and does not upload once the window is at the cap", async () => {
    const windowStart = new Date(NOW - 10 * 60 * 1000).toISOString();
    mockDownload.mockResolvedValueOnce({
      etag: "etag-1",
      readableStreamBody: makeStream(JSON.stringify({ windowStart, count: 20 })),
    });

    const result = await checkAndRecordSubmission(NOW);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("resets the window once the previous one has expired", async () => {
    const windowStart = new Date(NOW - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
    mockDownload.mockResolvedValueOnce({
      etag: "etag-1",
      readableStreamBody: makeStream(JSON.stringify({ windowStart, count: 20 })),
    });

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
    const [content] = mockUpload.mock.calls[0];
    expect(JSON.parse(content as string)).toEqual({
      windowStart: new Date(NOW).toISOString(),
      count: 1,
    });
  });

  it("retries on a concurrent write (412) and succeeds on the next attempt", async () => {
    const windowStart = new Date(NOW - 10 * 60 * 1000).toISOString();
    mockDownload
      .mockResolvedValueOnce({
        etag: "etag-1",
        readableStreamBody: makeStream(JSON.stringify({ windowStart, count: 5 })),
      })
      .mockResolvedValueOnce({
        etag: "etag-2",
        readableStreamBody: makeStream(JSON.stringify({ windowStart, count: 6 })),
      });
    mockUpload
      .mockRejectedValueOnce(preconditionFailedError())
      .mockResolvedValueOnce(undefined);

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
    expect(mockDownload).toHaveBeenCalledTimes(2);
    expect(mockUpload).toHaveBeenCalledTimes(2);
  });

  it("fails open when the blob download errors unexpectedly", async () => {
    mockDownload.mockRejectedValueOnce(new Error("storage is down"));

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("fails open when the blob upload errors unexpectedly", async () => {
    mockDownload.mockRejectedValueOnce(notFoundError());
    mockUpload.mockRejectedValueOnce(new Error("storage is down"));

    const result = await checkAndRecordSubmission(NOW);

    expect(result).toEqual({ allowed: true });
  });
});
