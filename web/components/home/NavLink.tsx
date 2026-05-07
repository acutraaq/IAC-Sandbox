"use client";

import Link from "next/link";
import { useDeploymentStore } from "@/store/deploymentStore";
import { Button } from "@/components/ui/Button";

interface NavLinkProps {
  href: string;
  mode: "template" | "custom" | "custom-request";
  variant?: "primary" | "secondary" | "ghost";
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
