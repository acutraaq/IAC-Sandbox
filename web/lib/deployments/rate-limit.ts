import { BlobServiceClient } from "@azure/storage-blob";
import { serverEnv } from "@/lib/server-env";

const CONTAINER_NAME = "deployment-rate-limit";
const BLOB_NAME = "submission-window.json";
const WINDOW_MS = 60 * 60 * 1000; // 1 hour rolling window
const MAX_SUBMISSIONS_PER_WINDOW = 20;
const MAX_RETRIES = 5;

interface RateLimitState {
  windowStart: string;
  count: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

function getContainerClient() {
  return BlobServiceClient.fromConnectionString(
    serverEnv.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient(CONTAINER_NAME);
}

function statusCodeOf(err: unknown): number | undefined {
  return typeof err === "object" && err !== null && "statusCode" in err
    ? (err as { statusCode?: number }).statusCode
    : undefined;
}

async function streamToString(
  stream: NodeJS.ReadableStream | undefined
): Promise<string> {
  if (!stream) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function freshWindow(now: number): RateLimitState {
  return { windowStart: new Date(now).toISOString(), count: 0 };
}

/**
 * Enforces a rolling-window global submission cap using a single blob with
 * ETag-based optimistic concurrency (no per-user identity to key on yet —
 * auth is a shared placeholder until SSO activates). Fails open on any
 * storage error: a rate limiter must never be the reason legitimate
 * deployments can't go through.
 */
export async function checkAndRecordSubmission(
  now: number = Date.now()
): Promise<RateLimitResult> {
  const container = getContainerClient();
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(BLOB_NAME);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let state: RateLimitState;
    let etag: string | undefined;

    try {
      const download = await blob.download(0);
      etag = download.etag;
      const text = await streamToString(download.readableStreamBody);
      const parsed = JSON.parse(text) as Partial<RateLimitState>;
      state =
        typeof parsed.windowStart === "string" && typeof parsed.count === "number"
          ? (parsed as RateLimitState)
          : freshWindow(now);
    } catch (err) {
      if (statusCodeOf(err) === 404) {
        state = freshWindow(now);
        etag = undefined;
      } else {
        return { allowed: true };
      }
    }

    const windowStartMs = new Date(state.windowStart).getTime();
    const windowAgeMs = now - windowStartMs;
    if (!Number.isFinite(windowStartMs) || windowAgeMs < 0 || windowAgeMs >= WINDOW_MS) {
      state = freshWindow(now);
    }

    if (state.count >= MAX_SUBMISSIONS_PER_WINDOW) {
      const elapsedMs = now - new Date(state.windowStart).getTime();
      const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - elapsedMs) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    const next: RateLimitState = { windowStart: state.windowStart, count: state.count + 1 };
    const content = JSON.stringify(next);

    try {
      await blob.upload(content, content.length, {
        conditions: etag ? { ifMatch: etag } : { ifNoneMatch: "*" },
      });
      return { allowed: true };
    } catch (err) {
      if (statusCodeOf(err) === 412) {
        continue; // someone else wrote first — re-read and retry
      }
      return { allowed: true };
    }
  }

  // Exhausted retries under heavy contention — never block legitimate
  // traffic because of a storage race.
  return { allowed: true };
}
