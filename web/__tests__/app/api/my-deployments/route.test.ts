import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/my-deployments/route";

const mockRgList = vi.fn();
const mockDeploymentsGet = vi.fn();

vi.mock("@/lib/arm", () => ({
  getArmClient: () => ({
    resourceGroups: { list: mockRgList },
    deployments: { get: mockDeploymentsGet },
  }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ upn: "demo@sandbox.local", displayName: "Demo User" }),
}));

import * as authModule from "@/lib/auth";
const mockGetCurrentUser = vi.mocked(authModule.getCurrentUser);

async function* makeRgIterator(items: unknown[]) {
  for (const item of items) yield item;
}

describe("GET /api/my-deployments", () => {
  it("returns an empty array when no tagged resource groups exist", async () => {
    mockRgList.mockReturnValueOnce(makeRgIterator([]));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns resource groups with status from ARM deployments", async () => {
    mockRgList.mockReturnValueOnce(makeRgIterator([
      {
        name: "my-rg",
        location: "southeastasia",
        tags: {
          deployedBy: "demo@sandbox.local",
          "iac-submissionId": "sub-123",
        },
      },
    ]));
    mockDeploymentsGet.mockResolvedValueOnce({
      properties: {
        provisioningState: "Succeeded",
        timestamp: new Date("2026-04-25T10:00:00Z"),
      },
    });

    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].resourceGroup).toBe("my-rg");
    expect(body[0].status).toBe("succeeded");
    expect(body[0].submissionId).toBe("sub-123");
  });

  it("leaves status as accepted when no submissionId tag present", async () => {
    mockRgList.mockReturnValueOnce(makeRgIterator([
      { name: "my-rg", location: "southeastasia", tags: { deployedBy: "demo@sandbox.local" } },
    ]));

    const res = await GET();
    const body = await res.json();
    expect(body[0].status).toBe("accepted");
    expect(body[0].submissionId).toBeNull();
  });

  it("returns 500 when ARM throws", async () => {
    mockRgList.mockImplementationOnce(() => { throw new Error("ARM error"); });
    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("returns 401 when getCurrentUser returns null", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
