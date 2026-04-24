import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "./ConfirmModal";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProofText = `SANDBOX DEPLOYMENT PROOF
========================
Submission ID : SUB-TEST-123
Status        : accepted`;

const defaultProps = {
  proofText: mockProofText,
  deploymentStatus: null as null,
  deploymentError: null,
  resourceGroup: null,
  onClose: () => {},
  onReset: () => {},
};

describe("ConfirmModal", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmModal open={false} {...defaultProps} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("displays proof text when open", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(screen.getByText(/SUB-TEST-123/)).toBeInTheDocument();
    expect(screen.getByText(/SANDBOX DEPLOYMENT PROOF/)).toBeInTheDocument();
  });

  it("shows Copy to Clipboard button", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Copy to Clipboard/i })
    ).toBeInTheDocument();
  });

  it("shows Start New Deployment link", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(screen.getByText(/Start New Deployment/i)).toBeInTheDocument();
  });

  it("calls onReset when Start New Deployment is clicked", async () => {
    const onReset = vi.fn();
    render(<ConfirmModal open={true} {...defaultProps} onReset={onReset} />);
    await userEvent.click(screen.getByText(/Start New Deployment/i));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<ConfirmModal open={true} {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Submitted step active for accepted status", () => {
    render(
      <ConfirmModal open={true} {...defaultProps} deploymentStatus="accepted" />
    );
    const submittedLi = screen.getByText("Submitted").closest("li");
    expect(submittedLi).toHaveAttribute("data-active");
  });

  it("shows Deploying step active for running status", () => {
    render(
      <ConfirmModal open={true} {...defaultProps} deploymentStatus="running" />
    );
    const deployingLi = screen.getByText("Deploying").closest("li");
    expect(deployingLi).toHaveAttribute("data-active");
  });

  it("shows Complete step active for succeeded status", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="succeeded"
      />
    );
    const completeLi = screen.getByText("Complete").closest("li");
    expect(completeLi).toHaveAttribute("data-active");
  });

  it("shows View in Azure Portal link when succeeded with resource group", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="succeeded"
        resourceGroup="my-test-rg"
      />
    );
    const link = screen.getByRole("link", { name: /View in Azure Portal/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("my-test-rg"));
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not show portal link without resource group", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="succeeded"
        resourceGroup={null}
      />
    );
    expect(screen.queryByRole("link", { name: /View in Azure Portal/i })).toBeNull();
  });

  it("shows Complete step in error state with error message for failed status", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="failed"
        deploymentError="ResourceGroupNotFound: The resource group was not found."
      />
    );
    const completeLi = screen.getByText("Complete").closest("li");
    expect(completeLi).toHaveAttribute("data-failed");
    expect(
      screen.getByText(/ResourceGroupNotFound/i)
    ).toBeInTheDocument();
  });
});
