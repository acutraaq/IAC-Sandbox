"use client";

import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noChrome = pathname === "/login";
  return (
    <main id="main-content" className={`flex-1 ${noChrome ? "" : "pt-16"}`}>
      {children}
    </main>
  );
}
