import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("next=/templates"),
}));

describe("LoginPage", () => {
  it("renders the heading", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /sandbox iac/i })).toBeInTheDocument();
  });

  it("renders a link (not a button) to sign in with Microsoft", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("link", { name: /sign in with microsoft/i })
    ).toBeInTheDocument();
  });

  it("links to /api/auth/login with the next param URL-encoded", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /sign in with microsoft/i });
    expect(link).toHaveAttribute("href", "/api/auth/login?next=%2Ftemplates");
  });

  it("links to /api/auth/login without next when next is unsafe", async () => {
    vi.doMock("next/navigation", () => ({
      useSearchParams: () => new URLSearchParams("next=//evil.com"),
    }));
    vi.resetModules();
    const Mod = await import("@/app/login/page");
    render(<Mod.default />);
    const link = screen.getByRole("link", { name: /sign in with microsoft/i });
    expect(link).toHaveAttribute("href", "/api/auth/login");
  });

  it("links to /api/auth/login without next when next param is absent", async () => {
    vi.doMock("next/navigation", () => ({
      useSearchParams: () => new URLSearchParams(""),
    }));
    vi.resetModules();
    const Mod = await import("@/app/login/page");
    render(<Mod.default />);
    const link = screen.getByRole("link", { name: /sign in with microsoft/i });
    expect(link).toHaveAttribute("href", "/api/auth/login");
  });
});
