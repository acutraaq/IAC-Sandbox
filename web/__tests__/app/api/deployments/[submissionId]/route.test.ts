import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/deployments/[submissionId]/route";

const mockDeploymentsGet = vi.fn();

vi.mock("@/lib/arm", () => ({
  getArmClient: () => ({
    deployments: { get: mockDeploymentsGet },
  }),
}));

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
    const res = await GET(makeRequest("abc"), makeParams("abc"));
    expect(res.status).toBe(400);
  });

  it("returns accepted when ARM returns 404 (deployment not yet created)", async () => {
    mockDeploymentsGet.mockRejectedValueOnce({ statusCode: 404 });
    const res = await GET(makeRequest("sub-id", "my-rg"), makeParams("sub-id"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("accepted");
  });

  it("maps ARM Succeeded to succeeded", async () => {
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: { provisioningState: "Succeeded" },
    });
    const res = await GET(makeRequest("sub-id", "my-rg"), makeParams("sub-id"));
    const body = await res.json();
    expect(body.status).toBe("succeeded");
  });

  it("maps ARM Running to running", async () => {
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: { provisioningState: "Running" },
    });
    const res = await GET(makeRequest("sub-id", "my-rg"), makeParams("sub-id"));
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
    const res = await GET(makeRequest("sub-id", "my-rg"), makeParams("sub-id"));
    const body = await res.json();
    expect(body.status).toBe("failed");
    expect(body.errorMessage).toContain("ResourceNotFound");
  });

  it("returns 500 when ARM throws a non-404 error", async () => {
    mockDeploymentsGet.mockRejectedValueOnce(new Error("ARM unavailable"));
    const res = await GET(makeRequest("sub-id", "my-rg"), makeParams("sub-id"));
    expect(res.status).toBe(500);
  });
});
