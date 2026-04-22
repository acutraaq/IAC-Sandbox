import { describe, it, expect } from "vitest";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";

describe("mapArmProvisioningState", () => {
  it("returns accepted for undefined state", () => {
    expect(mapArmProvisioningState(undefined)).toBe("accepted");
  });

  it("returns accepted for empty string", () => {
    expect(mapArmProvisioningState("")).toBe("accepted");
  });

  it("returns succeeded for Succeeded", () => {
    expect(mapArmProvisioningState("Succeeded")).toBe("succeeded");
  });

  it("returns failed for Failed", () => {
    expect(mapArmProvisioningState("Failed")).toBe("failed");
  });

  it("returns failed for Canceled", () => {
    expect(mapArmProvisioningState("Canceled")).toBe("failed");
  });

  it("returns running for Running", () => {
    expect(mapArmProvisioningState("Running")).toBe("running");
  });

  it("returns running for Accepted (ARM queued state)", () => {
    expect(mapArmProvisioningState("Accepted")).toBe("running");
  });

  it("returns running for any other unrecognised state", () => {
    expect(mapArmProvisioningState("Deleting")).toBe("running");
  });
});
