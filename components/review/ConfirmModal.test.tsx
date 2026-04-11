import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "./ConfirmModal";

const mockProofText = `SANDBOX DEPLOYMENT PROOF
========================
Submission ID : SUB-TEST-123
Status        : accepted`;

describe("ConfirmModal", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmModal
        open={false}
        proofText={mockProofText}
        onClose={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("displays proof text when open", () => {
    render(
      <ConfirmModal
        open={true}
        proofText={mockProofText}
        onClose={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText(/SUB-TEST-123/)).toBeInTheDocument();
    expect(screen.getByText(/SANDBOX DEPLOYMENT PROOF/)).toBeInTheDocument();
  });

  it("shows Copy to Clipboard button", () => {
    render(
      <ConfirmModal
        open={true}
        proofText={mockProofText}
        onClose={() => {}}
        onReset={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Copy to Clipboard/i }),
    ).toBeInTheDocument();
  });

  it("shows Start New Deployment link", () => {
    render(
      <ConfirmModal
        open={true}
        proofText={mockProofText}
        onClose={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText(/Start New Deployment/i)).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        open={true}
        proofText={mockProofText}
        onClose={onClose}
        onReset={() => {}}
      />,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
