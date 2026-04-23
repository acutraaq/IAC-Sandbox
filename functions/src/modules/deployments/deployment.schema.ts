import { z } from "zod";

const tagsSchema = z.object({
  "Cost Center": z.string().min(1),
  "Project ID": z.string().min(1),
  "Project Owner": z.string().min(1),
  "Expiry Date": z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const templateDeploymentSchema = z.object({
  mode: z.literal("template"),
  tags: tagsSchema,
  template: z.object({
    slug: z.string().min(1),
    formValues: z.record(z.string(), z.unknown()).default({}),
  }),
});

const customDeploymentSchema = z.object({
  mode: z.literal("custom"),
  tags: tagsSchema,
  resources: z.array(
    z.object({
      type: z.string().min(1),
      name: z.string().min(1),
      icon: z.string().min(1),
      config: z.record(z.string(), z.unknown()).default({}),
    })
  ).min(1),
});

export const deploymentPayloadSchema = z.discriminatedUnion("mode", [
  templateDeploymentSchema,
  customDeploymentSchema,
]);

export type DeploymentPayload = z.infer<typeof deploymentPayloadSchema>;
