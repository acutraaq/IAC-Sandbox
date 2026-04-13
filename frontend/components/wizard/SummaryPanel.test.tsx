import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryPanel } from "./SummaryPanel";
import type { TemplateStep } from "@/types";

const steps: TemplateStep[] = [
  {
    title: "Basic Details",
    description: "Name and region",
    fields: [
      { name: "appName", label: "Application name", type: "text", required: true },
      {
        name: "region",
        label: "Region",
        type: "select",
        required: true,
        options: [
          { label: "Southeast Asia (Singapore)", value: "southeastasia" },
          { label: "East Asia (Hong Kong)", value: "eastasia" },
        ],
      },
    ],
  },
  {
    title: "Settings",
    description: "Performance options",
    fields: [
      { name: "autoScale", label: "Auto-scale", type: "toggle", required: false },
    ],
  },
];

describe("SummaryPanel", () => {
  it("shows placeholder when no steps are completed", () => {
    render(<SummaryPanel steps={steps} completedSteps={[]} formValues={{}} />);
    expect(screen.getByText(/Your choices will appear here/)).toBeInTheDocument();
  });

  it("shows completed step title", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[0]}
        formValues={{ appName: "my-app", region: "southeastasia" }}
      />,
    );
    expect(screen.getByText("Basic Details")).toBeInTheDocument();
  });

  it("displays text field values", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[0]}
        formValues={{ appName: "my-app" }}
      />,
    );
    expect(screen.getByText("my-app")).toBeInTheDocument();
  });

  it("resolves select values to their human-readable label", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[0]}
        formValues={{ region: "southeastasia" }}
      />,
    );
    expect(screen.getByText("Southeast Asia (Singapore)")).toBeInTheDocument();
  });

  it("displays toggle true as 'Yes'", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[1]}
        formValues={{ autoScale: true }}
      />,
    );
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("displays toggle false as 'No'", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[1]}
        formValues={{ autoScale: false }}
      />,
    );
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("skips fields with empty values", () => {
    render(
      <SummaryPanel
        steps={steps}
        completedSteps={[0]}
        formValues={{ appName: "", region: "eastasia" }}
      />,
    );
    expect(screen.queryByText("Application name:")).toBeNull();
    expect(screen.getByText("East Asia (Hong Kong)")).toBeInTheDocument();
  });

  it("has accessible aside landmark", () => {
    render(<SummaryPanel steps={steps} completedSteps={[]} formValues={{}} />);
    expect(screen.getByRole("complementary", { name: "Setup summary" })).toBeInTheDocument();
  });
});
