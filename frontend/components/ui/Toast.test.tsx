import { describe, it, expect } from "vitest";
import { render, screen, act, waitForElementToBeRemoved } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastContainer, toast } from "./Toast";

describe("ToastContainer", () => {
  it("renders an aria-live='polite' region", () => {
    render(<ToastContainer />);
    const region = document.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("shows a success toast when toast() is called", async () => {
    render(<ToastContainer />);
    act(() => {
      toast("success", "Deployment submitted");
    });
    expect(await screen.findByText("Deployment submitted")).toBeInTheDocument();
  });

  it("shows an error toast when toast() is called", async () => {
    render(<ToastContainer />);
    act(() => {
      toast("error", "Something went wrong");
    });
    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows a warning toast when toast() is called", async () => {
    render(<ToastContainer />);
    act(() => {
      toast("warning", "Check your inputs");
    });
    expect(await screen.findByText("Check your inputs")).toBeInTheDocument();
  });

  it("shows a dismiss button on each toast", async () => {
    render(<ToastContainer />);
    act(() => {
      toast("success", "Dismissible");
    });
    expect(await screen.findByRole("button", { name: "Dismiss notification" })).toBeInTheDocument();
  });

  it("removes the toast from state when dismiss is clicked", async () => {
    render(<ToastContainer />);
    act(() => {
      toast("success", "Will be dismissed");
    });
    await screen.findByText("Will be dismissed");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await waitForElementToBeRemoved(() => screen.queryByText("Will be dismissed"), {
      timeout: 2000,
    });
  });

});

