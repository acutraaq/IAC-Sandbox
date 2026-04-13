import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Compute</Badge>);
    expect(screen.getByText("Compute")).toBeInTheDocument();
  });

  it("renders as an inline element", () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText("Label").tagName).toBe("SPAN");
  });

  it("accepts a custom className", () => {
    render(<Badge className="my-class">Tag</Badge>);
    expect(screen.getByText("Tag")).toHaveClass("my-class");
  });

  it.each(["default", "accent", "success", "warning", "error"] as const)(
    "renders %s variant without crashing",
    (variant) => {
      render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toBeInTheDocument();
    },
  );
});
