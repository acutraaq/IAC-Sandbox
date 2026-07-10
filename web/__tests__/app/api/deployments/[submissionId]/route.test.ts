import { describe, it, expect, vi, beforeEach } from "vitest";

const SUBMISSION_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const mockDeploymentsGet = vi.fn();
const mockResourceGroupsGet = vi.fn();
const mockGetFailureRecord = vi.fn();

vi.mock("@/lib/arm", () => ({
  getArmClient: () => ({
    deployments: { get: mockDeploymentsGet },
    resourceGroups: { get: mockResourceGroupsGet },
  }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ upn: "demo@sandbox.local", displayName: "Demo User" }),
}));

vi.mock("@/lib/deployments/failure-lookup", () => ({
  getFailureRecord: mockGetFailureRecord,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockResourceGroupsGet.mockResolvedValue({
    name: "my-rg",
    location: "southeastasia",
    tags: { deployedBy: "demo@sandbox.local", "iac-submissionId": SUBMISSION_ID },
  });
});

function makeRequest(submissionId: string, rg?: string) {
  const url = rg
    ? `http://localhost/api/deployments/${submissionId}?rg=${rg}`
    : `http://localhost/api/deployments/${submissionId}`;
  return new Request(url);
}

function makeParams(submissionId: string) {
  return { params: Promise.resolve({ submissionId }) };
}

describe("GET /api/deployments/[submissionId]", () => {
  it("returns 400 when rg query param is missing", async () => {
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest("abc"), makeParams("abc"));
    expect(res.status).toBe(400);
  });

  it("returns accepted when the RG doesn't exist yet and no failure record exists", async () => {
    mockResourceGroupsGet.mockRejectedValueOnce({ statusCode: 404 });
    mockGetFailureRecord.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
  });

  it("returns failed when the RG doesn't exist yet but an owned failure record exists (e.g. malformed queue message)", async () => {
    mockResourceGroupsGet.mockRejectedValueOnce({ statusCode: 404 });
    mockGetFailureRecord.mockResolvedValueOnce({
      submissionId: SUBMISSION_ID,
      resourceGroupName: "my-rg",
      error: "Invalid queue message: tags.Cost Center: Required",
      deployedBy: "demo@sandbox.local",
      failedAt: "2026-07-01T00:00:00.000Z",
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toContain("Invalid queue message");
  });

  it("does not leak another user's failure record when the RG doesn't exist yet", async () => {
    mockResourceGroupsGet.mockRejectedValueOnce({ statusCode: 404 });
    mockGetFailureRecord.mockResolvedValueOnce({
      submissionId: SUBMISSION_ID,
      resourceGroupName: "my-rg",
      error: "Invalid queue message: tags.Cost Center: Required",
      deployedBy: "someone-else@sandbox.local",
      failedAt: "2026-07-01T00:00:00.000Z",
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
  });

  it("returns accepted when ARM returns 404 and no failure record exists", async () => {
    mockDeploymentsGet.mockRejectedValueOnce({ statusCode: 404 });
    mockGetFailureRecord.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
  });

  it("returns failed when ARM returns 404 and a failure record exists (poisoned)", async () => {
    mockDeploymentsGet.mockRejectedValueOnce({ statusCode: 404 });
    mockGetFailureRecord.mockResolvedValueOnce({
      submissionId: SUBMISSION_ID,
      resourceGroupName: "my-rg",
      error: "ARM deployment state: Failed — exhausted retries",
      deployedBy: "user@test.com",
      failedAt: "2026-04-30T00:00:00.000Z",
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toContain("exhausted retries");
  });

  it("maps ARM Succeeded to succeeded", async () => {
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: { provisioningState: "Succeeded" },
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    const body = await res.json();
    expect(body.status).toBe("succeeded");
  });

  it("maps ARM Running to running", async () => {
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: { provisioningState: "Running" },
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    const body = await res.json();
    expect(body.status).toBe("running");
  });

  it("maps ARM Failed to failed and includes error message", async () => {
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: {
        provisioningState: "Failed",
        error: { code: "ResourceNotFound", message: "Resource missing" },
      },
    });
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toContain("ResourceNotFound");
  });

  it("returns 500 when ARM throws a non-404 error", async () => {
    mockDeploymentsGet.mockRejectedValueOnce(new Error("ARM unavailable"));
    const { GET } = await import("@/app/api/deployments/[submissionId]/route");
    const res = await GET(makeRequest(SUBMISSION_ID, "my-rg"), makeParams(SUBMISSION_ID));
    expect(res.status).toBe(500);
  });
});
