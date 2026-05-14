import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../lib/env.js";

export async function healthz(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken(
      "https://management.azure.com/.default"
    );

    if (!tokenResponse?.token) {
      context.log("Healthz: token acquisition returned empty token");
      return {
        status: 503,
        jsonBody: { status: "error", detail: "Token acquisition returned empty token" },
      };
    }

    // Quick ARM reachability probe — list first resource group
    const url =
      `https://management.azure.com/subscriptions/${env.AZURE_SUBSCRIPTION_ID}` +
      `/resourcegroups?api-version=2021-04-01&$top=1`;

    const armRes = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenResponse.token}` },
    });

    if (!armRes.ok) {
      const body = await armRes.text();
      context.log(`Healthz: ARM probe failed: ${armRes.status} ${body}`);
      return {
        status: 503,
        jsonBody: { status: "error", detail: `ARM probe failed: ${armRes.status} ${body}` },
      };
    }

    context.log("Healthz: managed identity healthy, ARM reachable");
    return {
      status: 200,
      jsonBody: { status: "ok", mi: true },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    context.log(`Healthz: error — ${msg}`);
    return {
      status: 503,
      jsonBody: { status: "error", detail: msg },
    };
  }
}

app.http("healthz", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "healthz",
  handler: healthz,
});
