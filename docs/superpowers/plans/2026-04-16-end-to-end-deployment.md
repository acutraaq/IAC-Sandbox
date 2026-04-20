# End-to-End Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the frontend submission flow to the real Fastify backend and deploy actual Azure resources per the user's selection, with each submission creating its own resource group.

**Architecture:** The backend gains two new modules — `rg-name.ts` (pure function to derive the Azure resource group name from the payload) and `arm-template-builder.ts` (pure function to build real ARM JSON per resource type). `bicep-executor.ts` is updated to create the resource group then deploy the ARM template. The frontend's MSW mock is disabled so submissions reach the real backend. The proof report is updated to show the derived resource group name.

**Tech Stack:** Fastify + TypeScript (backend), `@azure/arm-resources` + `@azure/identity` (`DefaultAzureCredential` — picks up `Connect-AzAccount` PowerShell session), Vitest (both frontend and backend tests), Next.js 16 App Router (frontend)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/src/modules/deployments/rg-name.ts` | Create | Derive resource group name + Azure location from payload |
| `backend/src/modules/deployments/rg-name.test.ts` | Create | Unit tests for rg-name |
| `backend/src/modules/deployments/arm-template-builder.ts` | Create | Build ARM JSON for all 8 resource types and 8 templates |
| `backend/src/modules/deployments/arm-template-builder.test.ts` | Create | Unit tests for ARM builder |
| `backend/src/modules/deployments/bicep-executor.ts` | Modify | Add RG creation step; use ARM builder instead of empty template |
| `backend/src/modules/deployments/deployment.service.ts` | Modify | Pass derived RG name + location to executor and repo |
| `backend/src/lib/env.ts` | Modify | Add `AZURE_TENANT_ID` to schema |
| `backend/.env` | Modify | Set `AZURE_SUBSCRIPTION_ID` and `AZURE_TENANT_ID` real values |
| `frontend/components/MockProvider.tsx` | Modify | Disable MSW worker startup |
| `frontend/lib/report.ts` | Modify | Replace `(pending)` fields with real subscription name and derived RG name |

---

## Task 1: Add AZURE_TENANT_ID to env.ts and update .env

**Files:**
- Modify: `backend/src/lib/env.ts`
- Modify: `backend/.env`

- [ ] **Step 1: Add AZURE_TENANT_ID to the Zod schema in env.ts**

Replace the existing `AZURE_SUBSCRIPTION_ID` line with both Azure vars:

```typescript
// backend/src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ENTRA_TENANT_ID: z.string().min(1, "ENTRA_TENANT_ID is required"),
  ENTRA_CLIENT_ID: z.string().min(1, "ENTRA_CLIENT_ID is required"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  BODY_LIMIT_BYTES: z.string().default("1048576"),
  ENABLE_GET_DEPLOYMENT: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() === "true"),
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

const env = parsed.data;

export default env;
```

- [ ] **Step 2: Update backend/.env with real values**

```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://sandboxadmin:EPF@12345@iac-sandbox-db.postgres.database.azure.com:5432/sandbox?sslmode=require
ENTRA_TENANT_ID=your-tenant-id
ENTRA_CLIENT_ID=your-client-id
CORS_ORIGINS=http://localhost:3000
ENABLE_GET_DEPLOYMENT=true
AZURE_SUBSCRIPTION_ID=bcef681c-2e70-4357-8fa3-c36b558d61da
AZURE_TENANT_ID=3335e1a2-2058-4baf-b03b-031abf0fc821
```

- [ ] **Step 3: Verify backend starts with new env var**

Run from `backend/`:
```sh
$env:NODE_OPTIONS="--use-system-ca"; npm run dev
```

Expected: server starts, logs `{"level":"info","msg":"Server listening at http://0.0.0.0:3001"}`. No `Invalid environment variables` error.

Stop the server (Ctrl+C).

- [ ] **Step 4: Commit**

```sh
git add backend/src/lib/env.ts backend/.env
git commit -m "chore: add AZURE_TENANT_ID to env validation"
```

---

## Task 2: Create rg-name.ts with tests

**Files:**
- Create: `backend/src/modules/deployments/rg-name.ts`
- Create: `backend/src/modules/deployments/rg-name.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `backend/src/modules/deployments/rg-name.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run from `backend/`:
```sh
npx vitest run src/modules/deployments/rg-name.test.ts
```

Expected: `FAIL` — `Cannot find module './rg-name.js'`

- [ ] **Step 3: Create rg-name.ts**

Create `backend/src/modules/deployments/rg-name.ts`:

```typescript
import type { DeploymentPayload } from "./deployment.schema.js";

const SLUG_PRIMARY_FIELD: Record<string, string> = {
  "web-application": "appName",
  "virtual-machine": "vmName",
  "database": "dbName",
  "storage-account": "storageName",
  "virtual-network": "vnetName",
  "key-vault": "vaultName",
  "container-app": "appName",
  "landing-zone": "projectName",
};

export function deriveResourceGroupName(payload: DeploymentPayload): string {
  let base: string;

  if (payload.mode === "template") {
    const field = SLUG_PRIMARY_FIELD[payload.template.slug] ?? "sandbox";
    const value = payload.template.formValues[field];
    base =
      typeof value === "string" && value.length > 0
        ? value
        : payload.template.slug;
  } else {
    base = payload.resources[0]?.name ?? "sandbox";
  }

  return sanitise(base) + "-rg";
}

export function deriveLocation(payload: DeploymentPayload): string {
  if (payload.mode === "template") {
    const region = payload.template.formValues["region"];
    return typeof region === "string" ? region : "southeastasia";
  }
  const region = payload.resources[0]?.config["region"];
  return typeof region === "string" ? region : "southeastasia";
}

function sanitise(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.()]/g, "")
      .replace(/\.+$/, "")
      .slice(0, 87) || "sandbox"
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```sh
npx vitest run src/modules/deployments/rg-name.test.ts
```

Expected: all 12 tests PASS.

- [ ] **Step 5: Commit**

```sh
git add backend/src/modules/deployments/rg-name.ts backend/src/modules/deployments/rg-name.test.ts
git commit -m "feat: add resource group name and location derivation"
```

---

## Task 3: Create arm-template-builder.ts — single-resource types

**Files:**
- Create: `backend/src/modules/deployments/arm-template-builder.ts`
- Create: `backend/src/modules/deployments/arm-template-builder.test.ts`

- [ ] **Step 1: Write failing tests for single-resource builders**

Create `backend/src/modules/deployments/arm-template-builder.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildArmTemplate } from "./arm-template-builder.js";

const TENANT_ID = "test-tenant-id";
const opts = { tenantId: TENANT_ID };

function resourceTypes(payload: Parameters<typeof buildArmTemplate>[0]): string[] {
  return buildArmTemplate(payload, opts).resources.map((r) => r.type as string);
}

describe("buildArmTemplate — schema", () => {
  it("returns valid ARM schema envelope", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } },
      opts
    );
    expect(result.$schema).toBe(
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#"
    );
    expect(result.contentVersion).toBe("1.0.0.0");
    expect(result.parameters).toEqual({});
    expect(Array.isArray(result.resources)).toBe(true);
  });
});

describe("buildArmTemplate — storage-account template", () => {
  it("creates a storage account resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } })
    ).toEqual(["Microsoft.Storage/storageAccounts"]);
  });

  it("uses the storageName as the resource name (lowercase alphanumeric)", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "MyFiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } },
      opts
    );
    expect((result.resources[0].name as string)).toBe("myfiles");
  });

  it("sets the SKU from redundancy field", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "GRS", accessTier: "Hot" } } },
      opts
    );
    expect((result.resources[0] as { sku: { name: string } }).sku.name).toBe("GRS");
  });
});

describe("buildArmTemplate — virtual-network template", () => {
  it("creates a virtual network resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "virtual-network", formValues: { vnetName: "my-vnet", region: "southeastasia", addressSpace: "10.0.0.0/16", subnetName: "default", subnetRange: "10.0.1.0/24" } } })
    ).toEqual(["Microsoft.Network/virtualNetworks"]);
  });

  it("sets addressSpace from formValues", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "virtual-network", formValues: { vnetName: "my-vnet", region: "southeastasia", addressSpace: "192.168.0.0/16", subnetName: "default", subnetRange: "192.168.1.0/24" } } },
      opts
    );
    const props = (result.resources[0] as { properties: { addressSpace: { addressPrefixes: string[] } } }).properties;
    expect(props.addressSpace.addressPrefixes).toEqual(["192.168.0.0/16"]);
  });
});

describe("buildArmTemplate — key-vault template", () => {
  it("creates a key vault resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "key-vault", formValues: { vaultName: "my-secrets", region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } } })
    ).toEqual(["Microsoft.KeyVault/vaults"]);
  });

  it("sets tenantId from opts", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "key-vault", formValues: { vaultName: "my-secrets", region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } } },
      opts
    );
    expect((result.resources[0] as { properties: { tenantId: string } }).properties.tenantId).toBe(TENANT_ID);
  });
});

describe("buildArmTemplate — database template", () => {
  it("creates a PostgreSQL flexible server", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "database", formValues: { dbName: "my-db", region: "southeastasia", engineVersion: "16", storageGB: 32, enableBackup: true, enableFirewall: false } } })
    ).toEqual(["Microsoft.DBforPostgreSQL/flexibleServers"]);
  });

  it("sets the PostgreSQL version from formValues", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "database", formValues: { dbName: "my-db", region: "southeastasia", engineVersion: "15", storageGB: 32, enableBackup: true, enableFirewall: false } } },
      opts
    );
    expect((result.resources[0] as { properties: { version: string } }).properties.version).toBe("15");
  });
});

describe("buildArmTemplate — custom mode", () => {
  it("maps Microsoft.Storage/storageAccounts to a storage account resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Storage/storageAccounts", name: "mystore", icon: "HardDrive", config: { region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } }],
      })
    ).toEqual(["Microsoft.Storage/storageAccounts"]);
  });

  it("maps Microsoft.KeyVault/vaults to a key vault resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.KeyVault/vaults", name: "my-vault", icon: "KeyRound", config: { region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } }],
      })
    ).toEqual(["Microsoft.KeyVault/vaults"]);
  });

  it("maps Microsoft.Network/virtualNetworks to a VNet resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Network/virtualNetworks", name: "my-net", icon: "Network", config: { region: "southeastasia", addressSpace: "10.0.0.0/16" } }],
      })
    ).toEqual(["Microsoft.Network/virtualNetworks"]);
  });

  it("maps Microsoft.Network/networkSecurityGroups to an NSG resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Network/networkSecurityGroups", name: "my-nsg", icon: "Shield", config: { region: "southeastasia", allowHTTPS: true } }],
      })
    ).toEqual(["Microsoft.Network/networkSecurityGroups"]);
  });

  it("combines multiple resource types into one resources array", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [
        { type: "Microsoft.Storage/storageAccounts", name: "mystore", icon: "HardDrive", config: { region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } },
        { type: "Microsoft.KeyVault/vaults", name: "my-vault", icon: "KeyRound", config: { region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } },
      ],
    });
    expect(types).toContain("Microsoft.Storage/storageAccounts");
    expect(types).toContain("Microsoft.KeyVault/vaults");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```sh
npx vitest run src/modules/deployments/arm-template-builder.test.ts
```

Expected: `FAIL` — `Cannot find module './arm-template-builder.js'`

- [ ] **Step 3: Create arm-template-builder.ts with single-resource builders**

Create `backend/src/modules/deployments/arm-template-builder.ts`:

```typescript
import type { DeploymentPayload } from "./deployment.schema.js";

export interface ArmResource {
  type: string;
  apiVersion: string;
  name: string;
  location: string;
  [key: string]: unknown;
}

export interface ArmTemplate {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  resources: ArmResource[];
  outputs: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Single-resource builders
// ---------------------------------------------------------------------------

function buildStorageAccount(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  // Storage account names: 3-24 chars, lowercase letters and numbers only
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24) || "sandboxstorage";

  return {
    type: "Microsoft.Storage/storageAccounts",
    apiVersion: "2023-01-01",
    name: safeName,
    location,
    sku: { name: typeof config.redundancy === "string" ? config.redundancy : "LRS" },
    kind: "StorageV2",
    properties: {
      accessTier: typeof config.accessTier === "string" ? config.accessTier : "Hot",
      allowBlobPublicAccess: config.publicAccess === true,
    },
  };
}

function buildVirtualNetwork(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const addressSpace =
    typeof config.addressSpace === "string" ? config.addressSpace : "10.0.0.0/16";
  const subnetName =
    typeof config.subnetName === "string" ? config.subnetName : "default";
  const subnetRange =
    typeof config.subnetRange === "string" ? config.subnetRange : "10.0.1.0/24";

  return {
    type: "Microsoft.Network/virtualNetworks",
    apiVersion: "2023-09-01",
    name,
    location,
    properties: {
      addressSpace: { addressPrefixes: [addressSpace] },
      subnets: [{ name: subnetName, properties: { addressPrefix: subnetRange } }],
    },
  };
}

function buildNetworkSecurityGroup(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const securityRules =
    config.allowHTTPS !== false
      ? [
          {
            name: "AllowHTTPS",
            properties: {
              priority: 100,
              protocol: "Tcp",
              access: "Allow",
              direction: "Inbound",
              sourceAddressPrefix: "*",
              sourcePortRange: "*",
              destinationAddressPrefix: "*",
              destinationPortRange: "443",
            },
          },
        ]
      : [];

  return {
    type: "Microsoft.Network/networkSecurityGroups",
    apiVersion: "2023-09-01",
    name,
    location,
    properties: { securityRules },
  };
}

function buildKeyVault(
  name: string,
  location: string,
  config: Record<string, unknown>,
  tenantId: string
): ArmResource {
  // Key Vault names: 3-24 chars, alphanumeric and hyphens
  const safeName = name.slice(0, 24);

  return {
    type: "Microsoft.KeyVault/vaults",
    apiVersion: "2023-07-01",
    name: safeName,
    location,
    properties: {
      sku: { family: "A", name: "standard" },
      tenantId,
      enableSoftDelete: config.softDelete !== false,
      enablePurgeProtection: config.purgeProtection === true,
      enableRbacAuthorization: config.accessModel === "rbac",
      accessPolicies: [],
    },
  };
}

function buildPostgresServer(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  // PostgreSQL server names: 3-63 chars, lowercase letters, digits, hyphens
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63) || "sandbox-db";

  const storageSizeGB =
    typeof config.storageGB === "number" ? config.storageGB : 32;

  return {
    type: "Microsoft.DBforPostgreSQL/flexibleServers",
    apiVersion: "2023-12-01",
    name: safeName,
    location,
    sku: { name: "Standard_B1ms", tier: "Burstable" },
    properties: {
      version: typeof config.engineVersion === "string" ? config.engineVersion : "16",
      storage: { storageSizeGB },
      backup: {
        backupRetentionDays: config.enableBackup !== false ? 7 : 1,
        geoRedundantBackup: "Disabled",
      },
      // Default credentials for sandbox deployments — change after provisioning
      administratorLogin: "sandboxadmin",
      administratorLoginPassword: "Sandbox@Azure#1234!",
      highAvailability: { mode: "Disabled" },
    },
  };
}

// ---------------------------------------------------------------------------
// Multi-resource builders
// ---------------------------------------------------------------------------

function buildWebApplication(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const planSize = typeof config.planSize === "string" ? config.planSize : "B1";
  const planName = `${name}-plan`;

  return [
    {
      type: "Microsoft.Web/serverfarms",
      apiVersion: "2023-01-01",
      name: planName,
      location,
      sku: { name: planSize },
      kind: "app",
      properties: {},
    },
    {
      type: "Microsoft.Web/sites",
      apiVersion: "2023-01-01",
      name,
      location,
      dependsOn: [`[resourceId('Microsoft.Web/serverfarms', '${planName}')]`],
      properties: {
        serverFarmId: `[resourceId('Microsoft.Web/serverfarms', '${planName}')]`,
        httpsOnly: config.httpsOnly !== false,
      },
    },
  ];
}

function buildContainerApp(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const envName = `${name}-env`;

  return [
    {
      type: "Microsoft.App/managedEnvironments",
      apiVersion: "2024-03-01",
      name: envName,
      location,
      properties: { zoneRedundant: false },
    },
    {
      type: "Microsoft.App/containerApps",
      apiVersion: "2024-03-01",
      name,
      location,
      dependsOn: [
        `[resourceId('Microsoft.App/managedEnvironments', '${envName}')]`,
      ],
      properties: {
        managedEnvironmentId: `[resourceId('Microsoft.App/managedEnvironments', '${envName}')]`,
        configuration: {
          ingress: config.externalAccess === true
            ? { external: true, targetPort: 80 }
            : { external: false, targetPort: 80 },
        },
        template: {
          containers: [
            {
              name,
              image:
                typeof config.containerImage === "string"
                  ? config.containerImage
                  : "nginx:latest",
              resources: { cpu: 0.5, memory: "1Gi" },
            },
          ],
          scale: {
            minReplicas:
              typeof config.minReplicas === "number" ? config.minReplicas : 1,
            maxReplicas:
              typeof config.maxReplicas === "number" ? config.maxReplicas : 3,
          },
        },
      },
    },
  ];
}

function buildVirtualMachine(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const vmSize =
    typeof config.vmSize === "string" ? config.vmSize : "Standard_B2s";
  const osType =
    typeof config.osType === "string" ? config.osType : "Ubuntu2204";
  const adminUsername =
    typeof config.adminUsername === "string"
      ? config.adminUsername
      : "azureuser";

  const imageReference =
    osType === "WindowsServer2022"
      ? { publisher: "MicrosoftWindowsServer", offer: "WindowsServer", sku: "2022-Datacenter", version: "latest" }
      : osType === "Ubuntu2004"
      ? { publisher: "Canonical", offer: "0001-com-ubuntu-server-focal", sku: "20_04-lts", version: "latest" }
      : { publisher: "Canonical", offer: "0001-com-ubuntu-server-jammy", sku: "22_04-lts", version: "latest" };

  const isWindows = osType === "WindowsServer2022";
  const ipName = `${name}-ip`;
  const vnetName = `${name}-vnet`;
  const nicName = `${name}-nic`;
  // Windows computerName max 15 chars
  const computerName = name.slice(0, 15);

  return [
    {
      type: "Microsoft.Network/publicIPAddresses",
      apiVersion: "2023-09-01",
      name: ipName,
      location,
      sku: { name: "Basic" },
      properties: { publicIPAllocationMethod: "Dynamic" },
    },
    {
      type: "Microsoft.Network/virtualNetworks",
      apiVersion: "2023-09-01",
      name: vnetName,
      location,
      properties: {
        addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
        subnets: [
          { name: "default", properties: { addressPrefix: "10.0.1.0/24" } },
        ],
      },
    },
    {
      type: "Microsoft.Network/networkInterfaces",
      apiVersion: "2023-09-01",
      name: nicName,
      location,
      dependsOn: [
        `[resourceId('Microsoft.Network/virtualNetworks', '${vnetName}')]`,
        `[resourceId('Microsoft.Network/publicIPAddresses', '${ipName}')]`,
      ],
      properties: {
        ipConfigurations: [
          {
            name: "ipconfig1",
            properties: {
              privateIPAllocationMethod: "Dynamic",
              subnet: {
                id: `[resourceId('Microsoft.Network/virtualNetworks/subnets', '${vnetName}', 'default')]`,
              },
              publicIPAddress: {
                id: `[resourceId('Microsoft.Network/publicIPAddresses', '${ipName}')]`,
              },
            },
          },
        ],
      },
    },
    {
      type: "Microsoft.Compute/virtualMachines",
      apiVersion: "2024-03-01",
      name,
      location,
      dependsOn: [
        `[resourceId('Microsoft.Network/networkInterfaces', '${nicName}')]`,
      ],
      properties: {
        hardwareProfile: { vmSize },
        storageProfile: {
          imageReference,
          osDisk: {
            createOption: "FromImage",
            managedDisk: { storageAccountType: "Standard_LRS" },
          },
        },
        osProfile: {
          computerName,
          adminUsername,
          // Default password for sandbox deployments — change after provisioning
          adminPassword: "Sandbox@Azure#1234!",
          ...(isWindows
            ? { windowsConfiguration: { enableAutomaticUpdates: true } }
            : { linuxConfiguration: { disablePasswordAuthentication: false } }),
        },
        networkProfile: {
          networkInterfaces: [
            {
              id: `[resourceId('Microsoft.Network/networkInterfaces', '${nicName}')]`,
            },
          ],
        },
      },
    },
  ];
}

function buildLandingZone(
  config: Record<string, unknown>,
  location: string,
  tenantId: string
): ArmResource[] {
  const prefix =
    typeof config.namingPrefix === "string" ? config.namingPrefix : "proj";
  const resources: ArmResource[] = [];

  // NSG — always included
  resources.push(
    buildNetworkSecurityGroup(`${prefix}-nsg`, location, { allowHTTPS: true })
  );

  if (config.includeNetwork !== false) {
    resources.push(
      buildVirtualNetwork(`${prefix}-vnet`, location, {
        addressSpace: "10.0.0.0/16",
        subnetName: "default",
        subnetRange: "10.0.1.0/24",
      })
    );
  }

  if (config.includeSecurity !== false) {
    resources.push(
      buildKeyVault(`${prefix}-kv`, location, { softDelete: true, purgeProtection: false, accessModel: "rbac" }, tenantId)
    );
  }

  if (config.includeMonitoring !== false) {
    resources.push({
      type: "Microsoft.OperationalInsights/workspaces",
      apiVersion: "2023-09-01",
      name: `${prefix}-law`,
      location,
      properties: {
        retentionInDays: 30,
        sku: { name: "PerGB2018" },
      },
    });
  }

  return resources;
}

// ---------------------------------------------------------------------------
// Template-mode dispatcher
// ---------------------------------------------------------------------------

function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  tenantId: string
): ArmResource[] {
  const { slug, formValues } = template;
  const location =
    typeof formValues.region === "string" ? formValues.region : "southeastasia";

  switch (slug) {
    case "web-application":
      return buildWebApplication(
        typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
        location,
        formValues
      );
    case "virtual-machine":
      return buildVirtualMachine(
        typeof formValues.vmName === "string" ? formValues.vmName : "sandbox-vm",
        location,
        formValues
      );
    case "database":
      return [
        buildPostgresServer(
          typeof formValues.dbName === "string" ? formValues.dbName : "sandbox-db",
          location,
          formValues
        ),
      ];
    case "storage-account":
      return [
        buildStorageAccount(
          typeof formValues.storageName === "string" ? formValues.storageName : "sandboxstorage",
          location,
          formValues
        ),
      ];
    case "virtual-network":
      return [
        buildVirtualNetwork(
          typeof formValues.vnetName === "string" ? formValues.vnetName : "sandbox-vnet",
          location,
          formValues
        ),
      ];
    case "key-vault":
      return [
        buildKeyVault(
          typeof formValues.vaultName === "string" ? formValues.vaultName : "sandbox-kv",
          location,
          formValues,
          tenantId
        ),
      ];
    case "container-app":
      return buildContainerApp(
        typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
        location,
        formValues
      );
    case "landing-zone":
      return buildLandingZone(formValues, location, tenantId);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Custom-mode dispatcher
// ---------------------------------------------------------------------------

function buildCustomResources(
  resources: Array<{
    type: string;
    name: string;
    icon: string;
    config: Record<string, unknown>;
  }>,
  tenantId: string
): ArmResource[] {
  const armResources: ArmResource[] = [];

  for (const resource of resources) {
    const location =
      typeof resource.config.region === "string"
        ? resource.config.region
        : "southeastasia";

    switch (resource.type) {
      case "Microsoft.Web/sites":
        armResources.push(...buildWebApplication(resource.name, location, resource.config));
        break;
      case "Microsoft.Compute/virtualMachines":
        armResources.push(...buildVirtualMachine(resource.name, location, resource.config));
        break;
      case "Microsoft.DBforPostgreSQL/flexibleServers":
        armResources.push(buildPostgresServer(resource.name, location, resource.config));
        break;
      case "Microsoft.Storage/storageAccounts":
        armResources.push(buildStorageAccount(resource.name, location, resource.config));
        break;
      case "Microsoft.Network/virtualNetworks":
        armResources.push(buildVirtualNetwork(resource.name, location, resource.config));
        break;
      case "Microsoft.KeyVault/vaults":
        armResources.push(buildKeyVault(resource.name, location, resource.config, tenantId));
        break;
      case "Microsoft.App/containerApps":
        armResources.push(...buildContainerApp(resource.name, location, resource.config));
        break;
      case "Microsoft.Network/networkSecurityGroups":
        armResources.push(buildNetworkSecurityGroup(resource.name, location, resource.config));
        break;
    }
  }

  return armResources;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: { tenantId: string }
): ArmTemplate {
  const resources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, opts.tenantId)
      : buildCustomResources(payload.resources, opts.tenantId);

  return {
    $schema:
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters: {},
    resources,
    outputs: {},
  };
}
```

- [ ] **Step 4: Add multi-resource tests to arm-template-builder.test.ts**

Append to `backend/src/modules/deployments/arm-template-builder.test.ts`:

```typescript
describe("buildArmTemplate — web-application template", () => {
  it("creates App Service Plan and Web App", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "web-application", formValues: { appName: "my-app", region: "southeastasia", planSize: "B1", httpsOnly: true } },
    });
    expect(types).toContain("Microsoft.Web/serverfarms");
    expect(types).toContain("Microsoft.Web/sites");
  });
});

describe("buildArmTemplate — container-app template", () => {
  it("creates Managed Environment and Container App", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "container-app", formValues: { appName: "my-app", region: "southeastasia", containerImage: "nginx:latest", minReplicas: 1, maxReplicas: 3, externalAccess: true } },
    });
    expect(types).toContain("Microsoft.App/managedEnvironments");
    expect(types).toContain("Microsoft.App/containerApps");
  });
});

describe("buildArmTemplate — virtual-machine template", () => {
  it("creates Public IP, VNet, NIC, and VM", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "virtual-machine", formValues: { vmName: "my-vm", region: "southeastasia", osType: "Ubuntu2204", vmSize: "Standard_B2s", adminUsername: "azureuser", enableSSH: true } },
    });
    expect(types).toContain("Microsoft.Network/publicIPAddresses");
    expect(types).toContain("Microsoft.Network/virtualNetworks");
    expect(types).toContain("Microsoft.Network/networkInterfaces");
    expect(types).toContain("Microsoft.Compute/virtualMachines");
  });
});

describe("buildArmTemplate — landing-zone template", () => {
  it("always includes NSG", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: false, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.Network/networkSecurityGroups");
  });

  it("includes VNet when includeNetwork is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: true, includeMonitoring: false, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.Network/virtualNetworks");
  });

  it("includes Key Vault when includeSecurity is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: false, includeSecurity: true } },
    });
    expect(types).toContain("Microsoft.KeyVault/vaults");
  });

  it("includes Log Analytics when includeMonitoring is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: true, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.OperationalInsights/workspaces");
  });
});

describe("buildArmTemplate — custom mode multi-resource", () => {
  it("maps Microsoft.Web/sites to App Service Plan + Web App", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.Web/sites", name: "my-app", icon: "Globe", config: { region: "southeastasia", planSize: "B1" } }],
    });
    expect(types).toContain("Microsoft.Web/serverfarms");
    expect(types).toContain("Microsoft.Web/sites");
  });

  it("maps Microsoft.Compute/virtualMachines to 4 VM resources", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.Compute/virtualMachines", name: "my-vm", icon: "Monitor", config: { region: "southeastasia", vmSize: "Standard_B2s", osType: "Ubuntu2204", adminUsername: "azureuser" } }],
    });
    expect(types).toContain("Microsoft.Network/publicIPAddresses");
    expect(types).toContain("Microsoft.Compute/virtualMachines");
  });

  it("maps Microsoft.App/containerApps to environment + app", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.App/containerApps", name: "my-app", icon: "Box", config: { region: "southeastasia", containerImage: "nginx:latest" } }],
    });
    expect(types).toContain("Microsoft.App/managedEnvironments");
    expect(types).toContain("Microsoft.App/containerApps");
  });
});
```

- [ ] **Step 5: Run all ARM builder tests**

```sh
npx vitest run src/modules/deployments/arm-template-builder.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```sh
git add backend/src/modules/deployments/arm-template-builder.ts backend/src/modules/deployments/arm-template-builder.test.ts
git commit -m "feat: add ARM template builder for all 8 resource types and templates"
```

---

## Task 4: Update bicep-executor.ts — real RG creation + ARM deployment

**Files:**
- Modify: `backend/src/modules/deployments/bicep-executor.ts`

- [ ] **Step 1: Replace bicep-executor.ts**

Overwrite `backend/src/modules/deployments/bicep-executor.ts` with:

```typescript
import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import { buildArmTemplate } from "./arm-template-builder.js";

export interface BicepExecutorOptions {
  subscriptionId: string;
  resourceGroupName: string;
  deploymentName: string;
  payload: DeploymentPayload;
  location: string;
}

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

  // Step 1: create the resource group (idempotent — safe to call if it already exists)
  await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
    location: opts.location,
  });

  // Step 2: deploy ARM template into the resource group
  const template = buildArmTemplate(opts.payload, { tenantId: env.AZURE_TENANT_ID });

  const result = await client.deployments.beginCreateOrUpdateAndWait(
    opts.resourceGroupName,
    opts.deploymentName,
    {
      properties: {
        mode: "Incremental",
        template,
        parameters: {},
      },
    }
  );

  return JSON.stringify(result.properties?.outputs ?? {});
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `backend/`:
```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```sh
git add backend/src/modules/deployments/bicep-executor.ts
git commit -m "feat: update bicep executor to create resource group and deploy real ARM template"
```

---

## Task 5: Wire derived RG name into deployment.service.ts

**Files:**
- Modify: `backend/src/modules/deployments/deployment.service.ts`

- [ ] **Step 1: Update deployment.service.ts**

Overwrite `backend/src/modules/deployments/deployment.service.ts` with:

```typescript
import { type Deployment, DeploymentStatus } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import {
  createDeployment,
  updateDeploymentStatus,
  findDeployment,
} from "./deployment.repo.js";
import { executeBicepDeployment } from "./bicep-executor.js";
import { deriveResourceGroupName, deriveLocation } from "./rg-name.js";

export async function submitDeployment(
  payload: DeploymentPayload
): Promise<{ submissionId: string }> {
  const resourceGroupName = deriveResourceGroupName(payload);
  const location = deriveLocation(payload);

  const deployment = await createDeployment({
    mode: payload.mode,
    submittedBy: "demo@sandbox.local",
    tenantId: env.AZURE_TENANT_ID,
    subscriptionId: env.AZURE_SUBSCRIPTION_ID,
    resourceGroup: resourceGroupName,
    payload,
  });

  const submissionId = deployment.id;

  void (async () => {
    try {
      await updateDeploymentStatus(submissionId, DeploymentStatus.running);

      const bicepOutput = await executeBicepDeployment({
        subscriptionId: env.AZURE_SUBSCRIPTION_ID,
        resourceGroupName,
        deploymentName: submissionId,
        payload,
        location,
      });

      await updateDeploymentStatus(submissionId, DeploymentStatus.succeeded, {
        bicepOutput,
      });

      logger.info({ submissionId, resourceGroupName }, "Deployment completed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      logger.error({ submissionId, err }, "Deployment failed");

      await updateDeploymentStatus(submissionId, DeploymentStatus.failed, {
        errorMessage,
      }).catch((updateErr) => {
        logger.error({ submissionId, err: updateErr }, "Failed to update deployment status to failed");
      });
    }
  })();

  return { submissionId };
}

export async function getDeployment(submissionId: string): Promise<Deployment> {
  const deployment = await findDeployment(submissionId);

  if (deployment === null) {
    throw AppError.notFound(`Deployment '${submissionId}' not found`);
  }

  return deployment;
}
```

Note: `submitDeployment` signature changed — `user` parameter removed (subscription/tenant now come from env). Update `deployments.ts` route accordingly in the next step.

- [ ] **Step 2: Update the route to match the new signature**

In `backend/src/routes/deployments.ts`, the route currently calls `submitDeployment(payload, user)`. Replace the POST handler with:

```typescript
const deploymentsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/", async (req, reply) => {
    const parseResult = deploymentPayloadSchema.safeParse(req.body);

    if (!parseResult.success) {
      throw AppError.validation(
        "Request validation failed",
        parseResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    const result = await submitDeployment(parseResult.data);

    return reply.status(201).send(result);
  });

  // GET /deployments/:submissionId (feature-flagged)
  fastify.get<{ Params: { submissionId: string } }>(
    "/:submissionId",
    async (req, reply) => {
      if (!env.ENABLE_GET_DEPLOYMENT) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Not found" },
          requestId: req.id,
        });
      }

      const deployment = await getDeployment(req.params.submissionId);

      return reply.status(200).send({
        submissionId: deployment.id,
        mode: deployment.mode,
        status: deployment.status,
        payload: deployment.payload,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      });
    }
  );
};

export default deploymentsRoutes;
```

(The full import block at the top of `deployments.ts` remains the same, just remove the `SubmitDeploymentUser` import if it was there.)

- [ ] **Step 3: Verify TypeScript compiles**

```sh
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all backend tests**

```sh
npm test
```

Expected: all tests PASS (rg-name + arm-template-builder).

- [ ] **Step 5: Commit**

```sh
git add backend/src/modules/deployments/deployment.service.ts backend/src/routes/deployments.ts
git commit -m "feat: wire derived resource group name into deployment service"
```

---

## Task 6: Disable MSW mock in frontend

**Files:**
- Modify: `frontend/components/MockProvider.tsx`

- [ ] **Step 1: Disable MSW worker startup**

Replace the entire contents of `frontend/components/MockProvider.tsx` with:

```typescript
"use client";

export function MockProvider({ children }: { children: React.ReactNode }) {
  // MSW mock disabled — real API calls go to http://localhost:3001
  return <>{children}</>;
}
```

- [ ] **Step 2: Verify frontend builds**

Run from `frontend/`:
```sh
npm run build
```

Expected: build succeeds, `/out` directory produced.

- [ ] **Step 3: Commit**

```sh
git add frontend/components/MockProvider.tsx
git commit -m "feat: disable MSW mock — route submissions to real backend"
```

---

## Task 7: Update proof report with real subscription name and RG name

**Files:**
- Modify: `frontend/lib/report.ts`

- [ ] **Step 1: Write the failing test**

Add to (or create) `frontend/lib/__tests__/report.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateReport } from "../report";

describe("generateReport — resource group name", () => {
  it("derives RG name from template appName", () => {
    const report = generateReport("SUB-001", {
      mode: "template",
      selectedTemplate: {
        slug: "web-application",
        name: "Web Application",
        steps: [],
      },
      wizardState: {
        currentStep: 0,
        completedSteps: [],
        formValues: { appName: "my-app", region: "southeastasia" },
      },
      selectedResources: [],
    });
    expect(report).toContain("Target RG     : my-app-rg");
  });

  it("shows real subscription name", () => {
    const report = generateReport("SUB-001", {
      mode: "template",
      selectedTemplate: { slug: "web-application", name: "Web Application", steps: [] },
      wizardState: { currentStep: 0, completedSteps: [], formValues: { appName: "my-app" } },
      selectedResources: [],
    });
    expect(report).toContain("Target Sub    : sub-epf-sandbox-cloud");
  });

  it("derives RG name from first custom resource name", () => {
    const report = generateReport("SUB-002", {
      mode: "custom",
      selectedTemplate: null,
      wizardState: { currentStep: 0, completedSteps: [], formValues: {} },
      selectedResources: [
        { type: "Microsoft.Storage/storageAccounts", name: "my-storage", icon: "HardDrive", config: {} },
      ],
    });
    expect(report).toContain("Target RG     : my-storage-rg");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run from `frontend/`:
```sh
npx vitest run lib/__tests__/report.test.ts
```

Expected: FAIL — `Target RG     : (pending — configured at submission)` does not match.

- [ ] **Step 3: Update report.ts**

Replace `frontend/lib/report.ts` with:

```typescript
import type { DeploymentState } from "@/types";

const SLUG_PRIMARY_FIELD: Record<string, string> = {
  "web-application": "appName",
  "virtual-machine": "vmName",
  "database": "dbName",
  "storage-account": "storageName",
  "virtual-network": "vnetName",
  "key-vault": "vaultName",
  "container-app": "appName",
  "landing-zone": "projectName",
};

function deriveRgName(
  state: Pick<
    DeploymentState,
    "mode" | "selectedTemplate" | "wizardState" | "selectedResources"
  >
): string {
  let base: string;

  if (state.mode === "template" && state.selectedTemplate) {
    const field = SLUG_PRIMARY_FIELD[state.selectedTemplate.slug] ?? "sandbox";
    const value = state.wizardState.formValues[field];
    base =
      typeof value === "string" && value.length > 0
        ? value
        : state.selectedTemplate.slug;
  } else if (state.mode === "custom" && state.selectedResources.length > 0) {
    base = state.selectedResources[0].name;
  } else {
    base = "sandbox";
  }

  const sanitised =
    base
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-_.()]/g, "")
      .replace(/\.+$/, "")
      .slice(0, 87) || "sandbox";

  return sanitised + "-rg";
}

export function generateReport(
  submissionId: string,
  state: Pick<
    DeploymentState,
    "mode" | "selectedTemplate" | "wizardState" | "selectedResources"
  >,
): string {
  const now = new Date().toLocaleString("en-MY", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const lines: string[] = [
    "SANDBOX DEPLOYMENT PROOF",
    "========================",
    `Submission ID : ${submissionId}`,
    `Submitted By  : Demo User (demo@contoso.com)`,
    `Tenant        : contoso.onmicrosoft.com`,
    `Date/Time     : ${now}`,
    `Mode          : ${state.mode === "template" ? "Template" : "Custom"}`,
    `Target Sub    : sub-epf-sandbox-cloud`,
    `Target RG     : ${deriveRgName(state)}`,
    `Status        : accepted`,
    "",
    "Selection:",
  ];

  if (state.mode === "template" && state.selectedTemplate) {
    lines.push(`- Template: ${state.selectedTemplate.name}`);
    lines.push(`  Form Values:`);

    const values = state.wizardState.formValues;
    const steps = state.selectedTemplate.steps;

    for (const step of steps) {
      for (const field of step.fields) {
        const value = values[field.name];
        if (value !== undefined && value !== null && value !== "") {
          const displayValue =
            field.type === "toggle" ? (value ? "Yes" : "No") : String(value);
          lines.push(`    ${field.label}: ${displayValue}`);
        }
      }
    }
  } else if (state.mode === "custom") {
    for (let i = 0; i < state.selectedResources.length; i++) {
      const resource = state.selectedResources[i];
      lines.push(`- Resource ${i + 1}: ${resource.name}`);
      lines.push(`  Config:`);
      for (const [key, value] of Object.entries(resource.config)) {
        if (value !== undefined && value !== null && value !== "") {
          lines.push(`    ${key}: ${String(value)}`);
        }
      }
    }
  }

  lines.push("");
  lines.push("Note: Manual HOD approval is required outside this system.");

  return lines.join("\n");
}
```

- [ ] **Step 4: Run report tests**

```sh
npx vitest run lib/__tests__/report.test.ts
```

Expected: all 3 new tests PASS.

- [ ] **Step 5: Run full frontend test suite**

```sh
npm run test:run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```sh
git add frontend/lib/report.ts frontend/lib/__tests__/report.test.ts
git commit -m "feat: show real subscription name and derived resource group in proof report"
```

---

## Task 8: End-to-end smoke test

**Pre-condition:** Azure PowerShell session active (`Connect-AzAccount -Subscription "sub-epf-sandbox-cloud"` already run).

- [ ] **Step 1: Start the backend**

In a terminal, run from `backend/`:
```sh
$env:NODE_OPTIONS="--use-system-ca"; npm run dev
```

Expected output includes:
```
{"level":"info","msg":"Server listening at http://0.0.0.0:3001"}
```

- [ ] **Step 2: Verify backend health**

In another terminal:
```sh
curl http://localhost:3001/healthz
```

Expected: `{"status":"ok"}`

- [ ] **Step 3: Start the frontend**

In another terminal, run from `frontend/`:
```sh
npm run dev
```

Expected: `✓ Ready in ...ms` at http://localhost:3000

- [ ] **Step 4: Submit a File Storage deployment (simplest resource)**

1. Open http://localhost:3000 in a browser
2. Click **Browse Templates** → select **File Storage**
3. Fill in:
   - Storage name: `smoketest` (lowercase letters/numbers only — Azure requirement)
   - Region: Southeast Asia
   - Redundancy: 3 copies (LRS)
   - Access tier: Frequently (Hot)
   - Public access: off
4. Click through to Review and click **Submit for Deployment**

Expected:
- Success toast appears: "Deployment submitted successfully!"
- Confirmation modal opens showing proof report
- `Target RG : smoketest-rg` is visible in the report

- [ ] **Step 5: Verify in backend logs**

In the backend terminal, you should see:
```
{"level":"info","submissionId":"...","msg":"Server received POST /deployments"}
{"level":"info","submissionId":"...","resourceGroupName":"smoketest-rg","msg":"Deployment completed successfully"}
```

If you see `"msg":"Deployment failed"`, check the error — most likely the Azure PowerShell session expired. Re-run `Connect-AzAccount` and try again.

- [ ] **Step 6: Verify in Azure Portal**

1. Go to portal.azure.com
2. Search "Resource groups"
3. Look for `smoketest-rg` — it should appear with a storage account inside it

- [ ] **Step 7: Final commit**

```sh
git add -A
git commit -m "feat: end-to-end deployment wired — frontend to real Azure resource provisioning"
```
