import { BlobServiceClient } from "@azure/storage-blob";

const CONTAINER_NAME = "deployment-failures";

export interface FailureRecord {
  submissionId: string;
  resourceGroupName: string;
  error: string;
  deployedBy: string;
  failedAt: string;
}

export async function createFailureRecord(
  connectionString: string,
  record: FailureRecord
): Promise<void> {
  const client = BlobServiceClient.fromConnectionString(connectionString);
  const container = client.getContainerClient(CONTAINER_NAME);
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(`${record.submissionId}.json`);
  const content = JSON.stringify(record);
  await blob.upload(content, content.length);
}
