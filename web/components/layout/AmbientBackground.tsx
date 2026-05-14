"use client";

const CODE_FRAGMENTS = [
  '{ "type": "Microsoft.Web/sites", "name": "sandbox-api" }',
  'resource storage "Microsoft.Storage/storageAccounts"',
  'param location string = "southeastasia"',
  'module network "vnet.bicep" = {',
  '  name: "sandbox-vnet"',
  '  params: {',
  '    addressPrefix: "10.0.0.0/16"',
  '  }',
  '}',
  'var tags = {',
  '  environment: "sandbox"',
  '  costCenter: "CC-001"',
  '}',
  'output resourceId string = storage.id',
  'resource keyVault "Microsoft.KeyVault/vaults" = {',
  '  location: location',
  '  sku: { family: "A", name: "standard" }',
  '}',
  'var tenantId = subscription().tenantId',
  'resource appServicePlan "Microsoft.Web/serverfarms"',
  'module sql "sql.bicep" = {',
  '  params: { sku: "GP_Gen5_2" }',
  '}',
  'output endpoint string = appService.properties.defaultHostName',
];

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Very faint vertical guide lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(90deg, var(--color-border-strong) 1px, transparent 1px)",
          backgroundSize: "120px 100%",
        }}
      />

      {/* Horizontal line guides */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px)",
          backgroundSize: "100% 28px",
        }}
      />

      {/* Corner brackets - top-left */}
      <svg className="absolute top-20 left-8 h-24 w-24 text-text-faint opacity-[0.04]" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1"
      >
        <path d="M0 32 L0 0 L32 0" />
        <path d="M64 0 L96 0 L96 32" />
        <path d="M96 64 L96 96 L64 96" />
        <path d="M32 96 L0 96 L0 64" />
      </svg>

      {/* Corner brackets - bottom-right */}
      <svg className="absolute bottom-20 right-8 h-24 w-24 text-text-faint opacity-[0.04]" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1"
      >
        <path d="M0 32 L0 0 L32 0" />
        <path d="M64 0 L96 0 L96 32" />
        <path d="M96 64 L96 96 L64 96" />
        <path d="M32 96 L0 96 L0 64" />
      </svg>

      {/* Faint code fragments */}
      <div className="absolute inset-0 overflow-hidden"
      >
        {CODE_FRAGMENTS.map((frag, i) => {
          const row = (i * 37) % 40;
          const col = (i * 17) % 12;
          return (
            <div
              key={i}
              className="absolute font-mono text-[11px] leading-[28px] whitespace-nowrap select-none"
              style={{
                top: `${row * 2.5}%`,
                left: `${col * 8}%`,
                color: "var(--color-text-faint)",
                opacity: 0.025 + (i % 3) * 0.01,
              }}
            >
              {frag}
            </div>
          );
        })}
      </div>

      {/* Very faint curly brace pair */}
      <svg
        className="absolute bottom-[15%] left-[5%] h-[200px] w-[60px] text-text-faint opacity-[0.03]"
        viewBox="0 0 60 200"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M40 0 C10 0, 10 30, 10 50 C10 70, 0 80, 0 100 C0 120, 10 130, 10 150 C10 170, 10 200, 40 200" />
        <path d="M20 0 C50 0, 50 30, 50 50 C50 70, 60 80, 60 100 C60 120, 50 130, 50 150 C50 170, 50 200, 20 200" />
      </svg>

      {/* Subtle angle brackets top-right */}
      <svg
        className="absolute top-[25%] right-[8%] h-16 w-16 text-text-faint opacity-[0.03]"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M40 8 L16 32 L40 56" />
        <path d="M24 8 L48 32 L24 56" />
      </svg>
    </div>
  );
}
