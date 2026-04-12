import { describe, it, expect } from "vitest";
import { buildSchema } from "@/lib/schema";
import type { FieldSchema } from "@/types";

describe("buildSchema", () => {
  it("validates required text field", () => {
    const fields: FieldSchema[] = [
      { name: "name", label: "Name", type: "text", required: true },
    ];
    const schema = buildSchema(fields);
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);

    const ok = schema.safeParse({ name: "hello" });
    expect(ok.success).toBe(true);
  });

  it("allows optional text field to be empty", () => {
    const fields: FieldSchema[] = [
      { name: "note", label: "Note", type: "text", required: false },
    ];
    const schema = buildSchema(fields);
    const result = schema.safeParse({ note: "" });
    expect(result.success).toBe(true);
  });

  it("validates required number field", () => {
    const fields: FieldSchema[] = [
      {
        name: "count",
        label: "Count",
        type: "number",
        required: true,
        min: 1,
        max: 10,
      },
    ];
    const schema = buildSchema(fields);

    expect(schema.safeParse({ count: 5 }).success).toBe(true);
    expect(schema.safeParse({ count: 0 }).success).toBe(false);
    expect(schema.safeParse({ count: 11 }).success).toBe(false);
  });

  it("coerces string to number", () => {
    const fields: FieldSchema[] = [
      { name: "size", label: "Size", type: "number", required: true },
    ];
    const schema = buildSchema(fields);
    const result = schema.safeParse({ size: "32" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe(32);
    }
  });

  it("validates required select field", () => {
    const fields: FieldSchema[] = [
      {
        name: "region",
        label: "Region",
        type: "select",
        required: true,
        options: [
          { label: "East", value: "east" },
          { label: "West", value: "west" },
        ],
      },
    ];
    const schema = buildSchema(fields);
    expect(schema.safeParse({ region: "" }).success).toBe(false);
    expect(schema.safeParse({ region: "east" }).success).toBe(true);
  });

  it("defaults toggle to false", () => {
    const fields: FieldSchema[] = [
      { name: "enabled", label: "Enabled", type: "toggle", required: false },
    ];
    const schema = buildSchema(fields);
    const result = schema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(false);
    }
  });

  it("handles mixed fields together", () => {
    const fields: FieldSchema[] = [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "size", label: "Size", type: "number", required: true },
      { name: "tier", label: "Tier", type: "select", required: true },
      { name: "active", label: "Active", type: "toggle", required: false },
    ];
    const schema = buildSchema(fields);
    const result = schema.safeParse({
      name: "test",
      size: 5,
      tier: "B1",
      active: true,
    });
    expect(result.success).toBe(true);
  });
});
