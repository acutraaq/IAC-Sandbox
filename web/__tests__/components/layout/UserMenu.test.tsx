import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/layout/UserMenu";

const replaceMock = vi.fn();
const { logoutUserMock } = vi.hoisted(() => ({ logoutUserMock: vi.fn<() => Promise<void>>() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/api", () => ({
  logoutUser: logoutUserMock,
}));

beforeEach(() => {
  replaceMock.mockClear();
  logoutUserMock.mockResolvedValue(undefined);
});

describe("UserMenu", () => {
  it("renders the user's initials and opens menu with name on click", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    expect(screen.getByLabelText(/account menu/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/account menu/i));
    expect(screen.getByText("Demo User")).toBeInTheDocument();
    expect(screen.getByText("demo@sandbox.local")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls logoutUser and redirects to /login on Sign out", async () => {
    const user = userEvent.setup();
    render(<UserMenu user={{ upn: "demo@sandbox.local", displayName: "Demo User" }} />);
    await user.click(screen.getByLabelText(/account menu/i));
    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));
    await waitFor(() => {
      expect(logoutUserMock).toHaveBeenCalledOnce();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
  });
});
