import { BlobServiceClient } from "@azure/storage-blob";
import { serverEnv } from "@/lib/server-env";
import { z } from "zod";

const CONTAINER_NAME = "deployment-failures";

function getBlobContainerClient() {
  return BlobServiceClient.fromConnectionString(
    serverEnv.AZURE_STORAGE_CONNECTION_STRING
  ).getContainerClient(CONTAINER_NAME);
}

export interface FailureRecord {
  submissionId: string;
  resourceGroupName: string;
  error: string;
  deployedBy: string;
  failedAt: string;
}

const failureRecordSchema = z.object({
  submissionId: z.string(),
  resourceGroupName: z.string(),
  error: z.string(),
  deployedBy: z.string(),
  failedAt: z.string(),
});

export async function getFailureRecord(submissionId: string): Promise<FailureRecord | null> {
  try {
    const blob = getBlobContainerClient().getBlockBlobClient(`${submissionId}.json`);
    const download = await blob.download(0);
    const text = await streamToString(download.readableStreamBody);
    const parsed = failureRecordSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
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
