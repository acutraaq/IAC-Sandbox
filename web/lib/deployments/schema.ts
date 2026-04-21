import { z } from "zod";

// Required by subscription policy COE-Enforce-Tag-RG.
const tagsSchema = z.object({
  "Cost Center": z.string().min(1, "Cost Center tag is required"),
  "Project ID": z.string().min(1, "Project ID tag is required"),
  "Project Owner": z.string().min(1, "Project Owner tag is required"),
  "Expiry Date": z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry Date must be in YYYY-MM-DD format"),
});

export const templateDeploymentSchema = z.object({
  mode: z.literal("template"),
  tags: tagsSchema,
  template: z.object({
    slug: z.string().min(1, "template.slug is required"),
    formValues: z.record(z.string(), z.unknown()).default({}),
  }),
});

export const customDeploymentSchema = z.object({
  mode: z.literal("custom"),
  tags: tagsSchema,
  resources: z
    .array(
      z.object({
        type: z.string().min(1, "resource type is required"),
        name: z.string().min(1, "resource name is required"),
        icon: z.string().min(1, "resource icon is required"),
        config: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .min(1, "At least one resource is required"),
});

export const deploymentPayloadSchema = z.discriminatedUnion("mode", [
  templateDeploymentSchema,
  customDeploymentSchema,
]);

export type DeploymentPayload = z.infer<typeof deploymentPayloadSchema>;
