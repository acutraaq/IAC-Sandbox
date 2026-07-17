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
});
