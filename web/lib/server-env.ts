import { z } from "zod";
import { SESSION_SECRET_MIN_LENGTH } from "./auth-core";

const envSchema = z.object({
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, "AZURE_STORAGE_CONNECTION_STRING is required"),
  SESSION_SECRET: z.string().min(
    SESSION_SECRET_MIN_LENGTH,
    `SESSION_SECRET must be at least ${SESSION_SECRET_MIN_LENGTH} characters`
  ),
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  WEBSITE_INSTANCE_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

export const serverEnv = parsed.data;
