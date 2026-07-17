import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppTypeComparisonDiagram } from "./AppTypeComparisonDiagram";
import { VibeWorkflowDiagram } from "./VibeWorkflowDiagram";
import { CopilotDecisionDiagram } from "./CopilotDecisionDiagram";

describe("AppTypeComparisonDiagram", () => {
  it("labels all three app types", () => {
    render(<AppTypeComparisonDiagram />);
    expect(screen.getByText(/Canvas/)).toBeInTheDocument();
    expect(screen.getByText(/Model-driven/)).toBeInTheDocument();
    expect(screen.getByText(/Vibe/)).toBeInTheDocument();
  });
});

describe("VibeWorkflowDiagram", () => {
  it("shows the 5-stage vibe workflow in order", () => {
    render(<VibeWorkflowDiagram />);
    const stages = ["Prompt", "Plan", "Generate", "Refine", "Publish"];
    for (const stage of stages) {
      expect(screen.getByText(stage)).toBeInTheDocument();
    }
  });
});

describe("CopilotDecisionDiagram", () => {
  it("shows both decision branches", () => {
    render(<CopilotDecisionDiagram />);
    expect(screen.getByText(/Copilot agents/)).toBeInTheDocument();
    expect(screen.getByText(/Copilot Studio/)).toBeInTheDocument();
  });
});
