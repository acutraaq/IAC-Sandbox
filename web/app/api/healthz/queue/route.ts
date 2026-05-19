import { NextResponse } from "next/server";
import { QueueServiceClient } from "@azure/storage-queue";
import { serverEnv } from "@/lib/server-env";

const MAIN_QUEUE = "deployment-jobs";
const POISON_QUEUE = "deployment-jobs-poison";

async function probeQueue(client: QueueServiceClient, name: string) {
  try {
    const props = await client.getQueueClient(name).getProperties();
    return { exists: true, approximateMessagesCount: props.approximateMessagesCount ?? 0 };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404) return { exists: false, approximateMessagesCount: 0 };
    throw err;
  }
}

export async function GET() {
  try {
    const client = QueueServiceClient.fromConnectionString(
      serverEnv.AZURE_STORAGE_CONNECTION_STRING
    );

    const [main, poison] = await Promise.all([
      probeQueue(client, MAIN_QUEUE),
      probeQueue(client, POISON_QUEUE),
    ]);

    const stuck = main.approximateMessagesCount > 0;
    const poisoned = poison.approximateMessagesCount > 0;

    return NextResponse.json({
      status: "ok",
      queues: {
        [MAIN_QUEUE]: main,
        [POISON_QUEUE]: poison,
      },
      diagnosis: stuck
        ? "Messages in deployment-jobs are NOT being consumed — Function App trigger not firing. Check DEPLOYMENT_QUEUE and AzureWebJobsStorage env vars in epf-sandbox-functions."
        : poisoned
        ? "Messages in deployment-jobs-poison — Function App is running but threw on every retry. Check Application Insights for the error."
        : "Queues look healthy.",
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", detail: String(err) },
      { status: 503 }
    );
  }
}
