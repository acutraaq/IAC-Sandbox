import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepWalkthrough } from "./StepWalkthrough";

const STEPS = [
  { title: "First step", detail: "Do the first thing." },
  { title: "Second step", detail: "Do the second thing." },
];

describe("StepWalkthrough", () => {
  it("renders every step's title and detail", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByText("First step")).toBeInTheDocument();
    expect(screen.getByText("Do the first thing.")).toBeInTheDocument();
    expect(screen.getByText("Second step")).toBeInTheDocument();
    expect(screen.getByText("Do the second thing.")).toBeInTheDocument();
  });

  it("renders as an ordered list", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("numbers each step starting at 1", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("renders sub-steps as a nested list when present", () => {
    const steps = [
      {
        title: "Start your app",
        detail: "Select Create.",
        subSteps: ["Select Blank canvas app", "Choose the environment"],
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(screen.getByText("Select Blank canvas app")).toBeInTheDocument();
    expect(screen.getByText("Choose the environment")).toBeInTheDocument();
  });

  it("renders the expected result when present", () => {
    const steps = [
      {
        title: "Preview your app",
        detail: "Select Play.",
        expectedResult: "The app runs full-screen as an end user would see it.",
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(
      screen.getByText("The app runs full-screen as an end user would see it.")
    ).toBeInTheDocument();
  });

  it("renders the pitfall when present", () => {
    const steps = [
      {
        title: "Sign in",
        detail: "Go to make.powerapps.com.",
        pitfall: "Signing in with a personal account shows no environments.",
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(
      screen.getByText("Signing in with a personal account shows no environments.")
    ).toBeInTheDocument();
  });

  it("renders cleanly with no optional fields", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.queryByText(/You should see:/)).not.toBeInTheDocument();
  });
});
