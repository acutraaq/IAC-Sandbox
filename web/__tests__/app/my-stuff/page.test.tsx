import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MyDeploymentsPage from "@/app/my-stuff/page";
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
  listMyDeployments: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const mockList = api.listMyDeployments as ReturnType<typeof vi.fn>;

describe("MyDeploymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton cards while loading", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<MyDeploymentsPage />);
    expect(
      screen.getAllByTestId("skeleton-row").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders page title as My Deployments", async () => {
    mockList.mockResolvedValue([]);
    render(<MyDeploymentsPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /my deployments/i })
      ).toBeInTheDocument()
    );
  });

  it("renders a list of resource groups", async () => {
    mockList.mockResolvedValue([
      {
        resourceGroup: "my-app-rg",
        location: "southeastasia",
        tags: {
          "Cost Center": "CC-001",
          "Project ID": "PROJ-001",
          "Project Owner": "Alice",
          "Expiry Date": "2027-01-01",
        },
        status: "succeeded",
        submissionId: "sub-abc",
        deployedAt: "2026-04-20T10:00:00.000Z",
      },
    ]);

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText("my-app-rg")).toBeInTheDocument()
    );
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });

  it("shows empty state when no deployments found", async () => {
    mockList.mockResolvedValue([]);

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no deployments/i)).toBeInTheDocument()
    );
  });

  it("shows error message when API call fails", async () => {
    mockList.mockRejectedValue(new Error("Network error"));

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    );
  });
});
