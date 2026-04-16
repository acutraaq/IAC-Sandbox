import { describe, it, expect } from "vitest";
import { deriveResourceGroupName, deriveLocation } from "./rg-name.js";

describe("deriveResourceGroupName", () => {
  it("uses appName for web-application template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "web-application", formValues: { appName: "my-app" } },
      })
    ).toBe("my-app-rg");
  });

  it("uses vmName for virtual-machine template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "virtual-machine", formValues: { vmName: "my-vm" } },
      })
    ).toBe("my-vm-rg");
  });

  it("uses dbName for database template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "database", formValues: { dbName: "my-db" } },
      })
    ).toBe("my-db-rg");
  });

  it("uses storageName for storage-account template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "storage-account", formValues: { storageName: "myfiles" } },
      })
    ).toBe("myfiles-rg");
  });

  it("uses vnetName for virtual-network template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "virtual-network", formValues: { vnetName: "my-network" } },
      })
    ).toBe("my-network-rg");
  });

  it("uses vaultName for key-vault template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "key-vault", formValues: { vaultName: "my-secrets" } },
      })
    ).toBe("my-secrets-rg");
  });

  it("uses appName for container-app template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "container-app", formValues: { appName: "my-container" } },
      })
    ).toBe("my-container-rg");
  });

  it("uses projectName for landing-zone template", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "landing-zone", formValues: { projectName: "my-project" } },
      })
    ).toBe("my-project-rg");
  });

  it("falls back to slug when primary name field is missing", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "web-application", formValues: {} },
      })
    ).toBe("web-application-rg");
  });

  it("uses first resource name in custom mode", () => {
    expect(
      deriveResourceGroupName({
        mode: "custom",
        resources: [
          { type: "Microsoft.Storage/storageAccounts", name: "my-storage", icon: "HardDrive", config: {} },
        ],
      })
    ).toBe("my-storage-rg");
  });

  it("lowercases the name", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "web-application", formValues: { appName: "MyApp" } },
      })
    ).toBe("myapp-rg");
  });

  it("replaces spaces with hyphens", () => {
    expect(
      deriveResourceGroupName({
        mode: "template",
        template: { slug: "web-application", formValues: { appName: "my app name" } },
      })
    ).toBe("my-app-name-rg");
  });

  it("falls back to sandbox-rg in custom mode with no resources", () => {
    expect(
      deriveResourceGroupName({ mode: "custom", resources: [] })
    ).toBe("sandbox-rg");
  });
});

describe("deriveLocation", () => {
  it("returns region from template formValues", () => {
    expect(
      deriveLocation({
        mode: "template",
        template: { slug: "web-application", formValues: { region: "southeastasia" } },
      })
    ).toBe("southeastasia");
  });

  it("returns region from first custom resource config", () => {
    expect(
      deriveLocation({
        mode: "custom",
        resources: [
          { type: "Microsoft.Storage/storageAccounts", name: "x", icon: "HardDrive", config: { region: "eastasia" } },
        ],
      })
    ).toBe("eastasia");
  });

  it("falls back to southeastasia when region is missing", () => {
    expect(
      deriveLocation({
        mode: "template",
        template: { slug: "web-application", formValues: {} },
      })
    ).toBe("southeastasia");
  });
});
