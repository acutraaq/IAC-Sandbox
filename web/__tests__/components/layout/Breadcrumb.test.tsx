import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

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

describe("Breadcrumb", () => {
  it("renders all item labels", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
  });

  it("renders a link for non-last items", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("does not render a link for the last item", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.queryByRole("link", { name: "Templates" })).toBeNull();
  });

  it("renders separator between items", () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(container.textContent).toContain("/");
  });
});
