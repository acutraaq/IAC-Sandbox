import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TemplateCard } from "./TemplateCard";
import type { Template } from "@/types";

const mockTemplate: Template = {
  slug: "web-application",
  name: "Web Application",
  description: "Deploy a ready-to-use web application with automatic scaling.",
  category: "compute",
  icon: "Globe",
  resourceCount: 3,
  estimatedTime: "~5 minutes",
  steps: [],
};

describe("TemplateCard", () => {
  it("renders the template name", () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText("Web Application")).toBeInTheDocument();
  });

  it("renders the template description", () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText(/Deploy a ready-to-use web application/)).toBeInTheDocument();
  });

  it("renders the resource count", () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText(/3\s*resources/)).toBeInTheDocument();
  });

  it("uses singular 'resource' when count is 1", () => {
    render(<TemplateCard template={{ ...mockTemplate, resourceCount: 1 }} />);
    expect(screen.getByText(/1\s*resource/)).toBeInTheDocument();
    expect(screen.queryByText(/resources/)).toBeNull();
  });

  it("renders the estimated time", () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText("~5 minutes")).toBeInTheDocument();
  });

  it("renders a link to the template detail page", () => {
    render(<TemplateCard template={mockTemplate} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/templates/web-application");
  });

  it("renders the category badge", () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText("Compute")).toBeInTheDocument();
  });

  it("falls back to raw category when label is not mapped", () => {
    render(<TemplateCard template={{ ...mockTemplate, category: "unknown-category" }} />);
    expect(screen.getByText("unknown-category")).toBeInTheDocument();
  });
});
