import { NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { serverEnv } from "@/lib/server-env";

export async function GET() {
  try {
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken(
      "https://management.azure.com/.default"
    );
    if (!tokenResponse?.token) {
      return NextResponse.json(
        { status: "error", detail: "credential chain returned no token" },
        { status: 503 }
      );
    }

    const url =
      `https://management.azure.com/subscriptions/${serverEnv.AZURE_SUBSCRIPTION_ID}` +
      `/resourcegroups?api-version=2021-04-01&$top=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenResponse.token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { status: "error", detail: `ARM ${res.status}: ${body}` },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    return NextResponse.json(
      { status: "error", detail: String(e) },
      { status: 503 }
    );
  }
}
