import type { FieldSchema } from "@/types";

export function displayFieldValue(field: FieldSchema, value: unknown): string {
  if (field.type === "toggle") return value ? "Yes" : "No";
  if (field.type === "select")
    return field.options?.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}
