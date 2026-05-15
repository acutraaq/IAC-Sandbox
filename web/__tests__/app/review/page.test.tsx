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

  it("does not start polling after submission", async () => {
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const user = userEvent.setup();
    const { container } = render(<ReviewPage />);

    await fillTagsAndSubmit(container, user);

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );

    const pollingIntervals = intervalSpy.mock.calls.filter(
      ([, delay]) => delay === 3000,
    );
    expect(pollingIntervals).toHaveLength(0);

    intervalSpy.mockRestore();
  });

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
