import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  DEPLOYMENT_QUEUE: z.string().min(1, "DEPLOYMENT_QUEUE is required"),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, "AZURE_STORAGE_CONNECTION_STRING is required"),
  FOUNDRY_API_KEY: z.string().min(1, "FOUNDRY_API_KEY is required"),
  FOUNDRY_RESOURCE_NAME: z.string().min(1, "FOUNDRY_RESOURCE_NAME is required"),
});

let parsedData: z.infer<typeof envSchema> | undefined;

function getEnv() {
  if (parsedData) return parsedData;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  parsedData = parsed.data;
  return parsedData;
}

export default new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    return getEnv()[prop as keyof z.infer<typeof envSchema>];
  },
});
