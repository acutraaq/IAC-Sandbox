"use client";

import Link from "next/link";
import { useDeploymentStore } from "@/store/deploymentStore";
import { Button } from "@/components/ui/Button";

import type { ButtonVariant } from "@/lib/button-classes";

interface NavLinkProps {
  href: string;
  mode: "template" | "custom" | "custom-request";
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function NavLink({ href, mode, variant = "primary", size = "md", children }: NavLinkProps) {
  function handleClick() {
    useDeploymentStore.getState().setMode(mode);
  }

  return (
    <Button asChild variant={variant} size={size}>
      <Link href={href} onClick={handleClick}>
        {children}
      </Link>
    </Button>
  );
}
