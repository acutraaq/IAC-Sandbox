import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/layout/UserMenu";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  replaceMock.mockClear();
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
});

describe("UserMenu", () => {
  it("renders the user's initials and opens menu with name on click", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    expect(screen.getByLabelText(/account menu/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Demo User")).toBeInTheDocument();
    expect(screen.getByText("demo@sandbox.local")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls /api/auth/logout and redirects to /login on Sign out", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    await user.click(screen.getByLabelText(/account menu/i));
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
