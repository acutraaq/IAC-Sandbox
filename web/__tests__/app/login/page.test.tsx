import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/login/page";

const replaceMock = vi.fn();
const { loginUserMock } = vi.hoisted(() => ({ loginUserMock: vi.fn<() => Promise<void>>() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("next=/templates"),
}));

vi.mock("@/lib/api", () => ({
  loginUser: loginUserMock,
}));

beforeEach(() => {
  replaceMock.mockClear();
  loginUserMock.mockResolvedValue(undefined);
});

describe("LoginPage", () => {
  it("renders heading and Microsoft sign-in button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /sandbox iac/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  it("calls loginUser and navigates to next on click", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /sign in with microsoft/i }));
    await waitFor(() => {
      expect(loginUserMock).toHaveBeenCalledOnce();
      expect(replaceMock).toHaveBeenCalledWith("/templates");
    });
  });

  it("falls back to '/' when next is missing or unsafe", async () => {
    const user = userEvent.setup();
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ replace: replaceMock }),
      useSearchParams: () => new URLSearchParams("next=//evil.com"),
    }));
    vi.resetModules();
    const Mod = await import("@/app/login/page");
    render(<Mod.default />);
    await user.click(screen.getByRole("button", { name: /sign in with microsoft/i }));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });
});
