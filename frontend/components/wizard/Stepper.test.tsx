import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stepper } from "./Stepper";

const steps = [
  { title: "Basic Details" },
  { title: "Performance" },
  { title: "Networking" },
];

describe("Stepper", () => {
  it("renders all step labels", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />);
    expect(screen.getByText("Basic Details")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Networking")).toBeInTheDocument();
  });

  it("marks the current step with aria-current='step'", () => {
    render(<Stepper steps={steps} currentStep={1} completedSteps={[]} />);
    const stepIndicators = document.querySelectorAll('[aria-current="step"]');
    expect(stepIndicators).toHaveLength(1);
    // The current step is index 1 — its indicator shows "2"
    expect(stepIndicators[0]).toHaveTextContent("2");
  });

  it("shows step number for non-current, non-completed steps", () => {
    render(<Stepper steps={steps} currentStep={1} completedSteps={[]} />);
    // Step 0 is not current and not completed — shows "1"
    // Step 2 is not current and not completed — shows "3"
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not set aria-current on non-current steps", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />);
    const allIndicators = document.querySelectorAll('[aria-current]');
    expect(allIndicators).toHaveLength(1);
  });

  it("hides step numbers for completed steps (shows check icon instead)", () => {
    render(<Stepper steps={steps} currentStep={2} completedSteps={[0, 1]} />);
    // Completed steps should not show their step numbers
    expect(screen.queryByText("1")).toBeNull();
    expect(screen.queryByText("2")).toBeNull();
    // Non-completed current step shows "3"
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has accessible nav landmark", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />);
    expect(screen.getByRole("navigation", { name: "Setup progress" })).toBeInTheDocument();
  });

  it("renders as an ordered list", () => {
    render(<Stepper steps={steps} currentStep={0} completedSteps={[]} />);
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
