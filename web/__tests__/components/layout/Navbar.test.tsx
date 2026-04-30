import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/layout/Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

describe("Navbar", () => {
  it("renders the Sandbox wordmark", () => {
    render(<Navbar />);
    expect(screen.getByText("Sandbox")).toBeInTheDocument();
  });

  it("renders Home and Templates nav links", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
  });

  it("marks Home as aria-current=page when on /", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders the SB user avatar", () => {
    render(<Navbar />);
    expect(screen.getByText("SB")).toBeInTheDocument();
  });
});
