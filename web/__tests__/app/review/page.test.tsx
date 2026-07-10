import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewPage from "@/app/review/page";
import { useDeploymentStore } from "@/store/deploymentStore";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/Toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

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

vi.mock("@/lib/api", () => ({
  submitDeployment: vi.fn(),
  getDeployment: vi.fn(),
  getMe: vi.fn().mockResolvedValue(null),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/report", () => ({
  generateReport: vi.fn(() => "MOCK PROOF TEXT"),
}));

vi.mock("@/components/ui/Toast", () => ({
  toast: vi.fn(),
}));

const mockSubmit = api.submitDeployment as ReturnType<typeof vi.fn>;
const mockGetDeployment = api.getDeployment as ReturnType<typeof vi.fn>;

function setupStore() {
  const store = useDeploymentStore.getState();
  store.reset();
  store.selectTemplate({
    slug: "approval-workflow",
    name: "Automated Approval Workflow",
    description: "Test",
    category: "automation",
    icon: "Globe",
    resourceCount: 1,
    estimatedTime: "~3 min",
    steps: [],
  });
}

async function fillTagsAndSubmit(
  container: HTMLElement,
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByPlaceholderText("Cost Center"), "CC-001");
  await user.type(screen.getByPlaceholderText("Project ID"), "PROJ-001");
  await user.type(screen.getByPlaceholderText("Project Owner"), "John Doe");
  fireEvent.change(container.querySelector('input[type="date"]')!, {
    target: { value: "2026-12-31" },
  });
  await user.click(
    screen.getByRole("button", { name: /Submit for Deployment/i }),
  );
}

describe("ReviewPage — submission", () => {
  beforeEach(() => {
    setupStore();
    mockSubmit.mockResolvedValue({ submissionId: "SUB-TEST-123", resourceGroup: "sandbox-rg" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    useDeploymentStore.getState().reset();
  });

  it("opens modal with proof text after successful submission", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.getByText(/MOCK PROOF TEXT/)).toBeInTheDocument();
  });

  it("shows HOD approval instruction in modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.getByText(/HOD/i)).toBeInTheDocument();
  });

  it("polls quietly and shows no toast while status stays in progress", async () => {
    mockGetDeployment.mockResolvedValue({ submissionId: "SUB-TEST-123", status: "accepted", errorMessage: null });
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await waitFor(
      () => expect(mockGetDeployment).toHaveBeenCalledWith("SUB-TEST-123", "sandbox-rg"),
      { timeout: 5000 },
    );
    expect(toast).not.toHaveBeenCalledWith("error", expect.anything());
  }, 15000);

  it("shows an error toast and stops polling once the deployment fails", async () => {
    mockGetDeployment
      .mockResolvedValueOnce({ submissionId: "SUB-TEST-123", status: "accepted", errorMessage: null })
      .mockResolvedValueOnce({ submissionId: "SUB-TEST-123", status: "failed", errorMessage: "Deployment blocked by policy" });
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await waitFor(
      () => expect(toast).toHaveBeenCalledWith("error", "Deployment blocked by policy"),
      { timeout: 8000 },
    );

    const callsAfterFailure = mockGetDeployment.mock.calls.length;
    await new Promise((r) => setTimeout(r, 3500));
    expect(mockGetDeployment.mock.calls.length).toBe(callsAfterFailure);
  }, 15000);

  it("stays silent when the deployment succeeds", async () => {
    mockGetDeployment.mockResolvedValueOnce({ submissionId: "SUB-TEST-123", status: "succeeded", errorMessage: null });
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await waitFor(() => expect(mockGetDeployment).toHaveBeenCalledTimes(1), { timeout: 5000 });
    expect(toast).not.toHaveBeenCalledWith("error", expect.anything());

    const callsAfterSucceeded = mockGetDeployment.mock.calls.length;
    await new Promise((r) => setTimeout(r, 3500));
    expect(mockGetDeployment.mock.calls.length).toBe(callsAfterSucceeded);
  }, 15000);

  it("shows tag validation errors when fields are empty", async () => {
    const user = userEvent.setup();
    render(<ReviewPage />);

    await user.click(
      screen.getByRole("button", { name: /Submit for Deployment/i }),
    );

    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
    );
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
