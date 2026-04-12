import { z } from "zod";
import type { FieldSchema } from "@/types";

export function buildSchema(
  fields: FieldSchema[],
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    switch (field.type) {
      case "text":
        shape[field.name] = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;

      case "number":
        if (field.required) {
          let schema = z.coerce.number();
          if (field.min !== undefined) {
            schema = schema.min(field.min) as typeof schema;
          }
          if (field.max !== undefined) {
            schema = schema.max(field.max) as typeof schema;
          }
          shape[field.name] = schema;
        } else {
          shape[field.name] = z.coerce.number().optional();
        }
        break;

      case "select":
        shape[field.name] = field.required
          ? z.string().min(1, `Please select an option for ${field.label}`)
          : z.string().optional();
        break;

      case "toggle":
        shape[field.name] = z.boolean().optional().default(false);
        break;

      default:
        shape[field.name] = z.unknown();
    }
  }

  return z.object(shape);
}
