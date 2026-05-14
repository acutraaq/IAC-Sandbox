import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders version info", () => {
    render(<Footer />);
    expect(screen.getByText(/v1\.0\.0/i)).toBeInTheDocument();
  });

  it("renders subscription meta", () => {
    render(<Footer />);
    expect(screen.getByText(/sub-epf-sandbox-internal/i)).toBeInTheDocument();
  });
});
