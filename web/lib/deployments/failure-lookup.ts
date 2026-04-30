import { BlobServiceClient } from "@azure/storage-blob";
import { serverEnv } from "@/lib/server-env";

const CONTAINER_NAME = "deployment-failures";

export interface FailureRecord {
  submissionId: string;
  resourceGroupName: string;
  error: string;
  deployedBy: string;
  failedAt: string;
}

export async function getFailureRecord(submissionId: string): Promise<FailureRecord | null> {
  try {
    const client = BlobServiceClient.fromConnectionString(
      serverEnv.AZURE_STORAGE_CONNECTION_STRING
    );
    const container = client.getContainerClient(CONTAINER_NAME);
    const blob = container.getBlockBlobClient(`${submissionId}.json`);
    const download = await blob.download(0);
    const text = await streamToString(download.readableStreamBody);
    return JSON.parse(text) as FailureRecord;
  } catch {
    return null;
  }
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
