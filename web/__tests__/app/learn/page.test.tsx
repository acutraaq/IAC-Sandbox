import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LearnPage from "@/app/learn/page";

describe("LearnPage", () => {
  it("renders the page heading", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { name: "Learn Power Platform", level: 1 })).toBeInTheDocument();
  });

  it("renders the tab switcher with the first topic visible", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { name: "Canvas apps", level: 2 })).toBeInTheDocument();
  });
});
