import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewPage from "@/app/review/page";
import { useDeploymentStore } from "@/store/deploymentStore";
import * as api from "@/lib/api";

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

// Collects every setInterval call — lets us find the 3 s polling interval
// without being confused by Testing Library's internal 50 ms waitFor intervals.
type IntervalEntry = { fn: () => Promise<void>; delay: number; handle: number };
let capturedIntervals: IntervalEntry[];

function getPollingCallback(): (() => Promise<void>) | undefined {
  return capturedIntervals.find((i) => i.delay === 3000)?.fn;
}

function setupStore() {
  const store = useDeploymentStore.getState();
  store.reset();
  store.setMode("custom");
  store.addResource({
    type: "Microsoft.Storage/storageAccounts",
    name: "File Storage",
    icon: "HardDrive",
    config: {},
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

describe("ReviewPage — deployment status polling", () => {
  beforeEach(() => {
    capturedIntervals = [];

    vi.spyOn(globalThis, "setInterval").mockImplementation(
      (fn: TimerHandler, delay?: number) => {
        const handle = capturedIntervals.length + 1;
        capturedIntervals.push({
          fn: fn as () => Promise<void>,
          delay: delay ?? 0,
          handle,
        });
        return handle as unknown as ReturnType<typeof setInterval>;
      },
    );

    setupStore();
    mockSubmit.mockResolvedValue({ submissionId: "SUB-TEST-123", resourceGroup: "sandbox-rg" });
    mockGetDeployment.mockResolvedValue({
      submissionId: "SUB-TEST-123",
      status: "running",
      errorMessage: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    useDeploymentStore.getState().reset();
  });

  it("registers a 3 s polling interval after successful submission", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    expect(getPollingCallback()).toBeDefined();
  });

  it("calls getDeployment with the submission ID when the interval fires", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    await getPollingCallback()!();

    expect(mockGetDeployment).toHaveBeenCalledWith("SUB-TEST-123", "sandbox-rg");
  });

  it("shows running status banner after the first poll", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    await getPollingCallback()!();

    await waitFor(() =>
      expect(screen.getByText(/Deploying to Azure/i)).toBeInTheDocument(),
    );
  });

  it("stops polling and shows success banner on succeeded status", async () => {
    mockGetDeployment.mockResolvedValue({
      submissionId: "SUB-TEST-123",
      status: "succeeded",
      errorMessage: null,
    });

    const clearSpy = vi.spyOn(globalThis, "clearInterval");

    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    await getPollingCallback()!();

    await waitFor(() =>
      expect(screen.getByText(/Deployed successfully/i)).toBeInTheDocument(),
    );
    expect(clearSpy).toHaveBeenCalled();
  });

  it("stops polling and shows failure banner with error on failed status", async () => {
    mockGetDeployment.mockResolvedValue({
      submissionId: "SUB-TEST-123",
      status: "failed",
      errorMessage: "ResourceGroupNotFound: The resource group was not found.",
    });

    const clearSpy = vi.spyOn(globalThis, "clearInterval");

    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    await getPollingCallback()!();

    await waitFor(() => {
      expect(screen.getByText(/Deployment failed/i)).toBeInTheDocument();
      expect(
        screen.getByText(/ResourceGroupNotFound/i),
      ).toBeInTheDocument();
    });
    expect(clearSpy).toHaveBeenCalled();
  });

  it("clears the polling interval when the modal is closed", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");

    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    expect(getPollingCallback()).toBeDefined();

    await user.click(screen.getByLabelText("Close dialog"));

    expect(clearSpy).toHaveBeenCalled();
  });
});
