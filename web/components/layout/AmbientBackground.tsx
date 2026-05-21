"use client";

import { motion } from "framer-motion";
import { reducedMotionEnabled } from "@/lib/motion";

const CODE_FRAGMENTS = [
  '{ "type": "Microsoft.Web/sites", "name": "sandbox-api" }',
  'resource storage "Microsoft.Storage/storageAccounts"',
  'param location string = "southeastasia"',
  'module network "vnet.bicep" = {',
  '  name: "sandbox-vnet"',
  '  params: { addressPrefix: "10.0.0.0/16" }',
  '}',
  'var tags = { environment: "sandbox", costCenter: "CC-001" }',
  'output resourceId string = storage.id',
  'resource keyVault "Microsoft.KeyVault/vaults" = {',
  '  sku: { family: "A", name: "standard" }',
  '}',
  'var tenantId = subscription().tenantId',
  'resource appServicePlan "Microsoft.Web/serverfarms"',
  'output endpoint string = appService.properties.defaultHostName',
];

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Parchment vignette — darkens edges for depth on cream bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(90,65,30,0.06) 100%)",
        }}
      />

      {/* Subtle warm grain texture via repeating gradient */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(90,65,30,0.08) 2px, rgba(90,65,30,0.08) 4px)",
        }}
      />

      {/* Dot grid — warm sepia dots */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(90,65,30,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Corner brackets — warm sepia */}
      <motion.svg
        className="absolute top-20 left-8 h-20 w-20"
        viewBox="0 0 80 80"
        fill="none"
        stroke="rgba(90,65,30,0.18)"
        strokeWidth="1"
        animate={reducedMotionEnabled ? undefined : { opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M0 24 L0 0 L24 0" />
        <path d="M56 0 L80 0 L80 24" />
        <path d="M80 56 L80 80 L56 80" />
        <path d="M24 80 L0 80 L0 56" />
      </motion.svg>

      <motion.svg
        className="absolute bottom-20 right-8 h-20 w-20"
        viewBox="0 0 80 80"
        fill="none"
        stroke="rgba(90,65,30,0.18)"
        strokeWidth="1"
        animate={reducedMotionEnabled ? undefined : { opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <path d="M0 24 L0 0 L24 0" />
        <path d="M56 0 L80 0 L80 24" />
        <path d="M80 56 L80 80 L56 80" />
        <path d="M24 80 L0 80 L0 56" />
      </motion.svg>

      {/* Floating code fragments — very faint sepia ink */}
      <div className="absolute inset-0 overflow-hidden">
        {CODE_FRAGMENTS.map((frag, i) => {
          const row = (i * 37) % 40;
          const col = (i * 17) % 12;
          return (
            <motion.div
              key={i}
              className="absolute whitespace-nowrap select-none font-mono text-xs leading-[28px]"
              style={{
                top: `${row * 2.5}%`,
                left: `${col * 8}%`,
                color: "rgba(90,65,30,0.25)",
              }}
              animate={
                reducedMotionEnabled
                  ? undefined
                  : {
                      y: [0, -4, 0],
                      opacity: [
                        0.04 + (i % 3) * 0.01,
                        0.08 + (i % 3) * 0.01,
                        0.04 + (i % 3) * 0.01,
                      ],
                    }
              }
              transition={{
                duration: 5 + (i % 4),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            >
              {frag}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
