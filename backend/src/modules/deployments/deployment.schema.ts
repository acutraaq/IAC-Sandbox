import { z } from "zod";

export const templateDeploymentSchema = z.object({
  mode: z.literal("template"),
  template: z.object({
    slug: z.string().min(1, "template.slug is required"),
    formValues: z.record(z.string(), z.unknown()).default({}),
  }),
});

export const customDeploymentSchema = z.object({
  mode: z.literal("custom"),
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
