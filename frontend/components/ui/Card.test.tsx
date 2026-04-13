import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies hoverable styles when hoverable=true", () => {
    render(<Card hoverable>Hoverable</Card>);
    expect(screen.getByText("Hoverable")).toHaveClass("cursor-pointer");
  });

  it("does not apply cursor-pointer by default", () => {
    render(<Card>Static</Card>);
    const card = screen.getByText("Static");
    expect(card).not.toHaveClass("cursor-pointer");
  });

  it("merges custom className", () => {
    render(<Card className="extra">Content</Card>);
    expect(screen.getByText("Content")).toHaveClass("extra");
  });

  it("forwards onClick handler", async () => {
    const onClick = vi.fn();
    render(<Card hoverable onClick={onClick}>Click</Card>);
    await userEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
