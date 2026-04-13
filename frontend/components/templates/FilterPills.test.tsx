import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterPills } from "./FilterPills";

const categories = ["All", "Compute", "Data", "Network", "Security", "Starter Kits"];

describe("FilterPills", () => {
  it("renders all category buttons", () => {
    render(<FilterPills selected="all" onChange={() => {}} />);
    for (const label of categories) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the selected category as pressed", () => {
    render(<FilterPills selected="compute" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Compute" })).toHaveAttribute("aria-pressed", "true");
  });

  it("marks non-selected categories as not pressed", () => {
    render(<FilterPills selected="compute" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Data" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the correct value when a pill is clicked", async () => {
    const onChange = vi.fn();
    render(<FilterPills selected="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Data" }));
    expect(onChange).toHaveBeenCalledWith("data");
  });

  it("calls onChange with 'all' when All is clicked", async () => {
    const onChange = vi.fn();
    render(<FilterPills selected="compute" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "All" }));
    expect(onChange).toHaveBeenCalledWith("all");
  });

  it("has accessible group label", () => {
    render(<FilterPills selected="all" onChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
  });
});
