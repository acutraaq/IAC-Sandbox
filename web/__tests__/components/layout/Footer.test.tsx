import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders brand name", () => {
    render(<Footer />);
    expect(screen.getByText(/Sandbox Cloud Automation/i)).toBeInTheDocument();
  });

  it("renders environment label", () => {
    render(<Footer />);
    expect(screen.getByText(/Sandbox Environment/i)).toBeInTheDocument();
  });
});
