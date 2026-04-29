"use client";

import { useSearchParams } from "next/navigation";

function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return null;
  return raw;
}

export function LoginButton() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const href = next
    ? `/api/auth/login?next=${encodeURIComponent(next)}`
    : "/api/auth/login";

  return (
    <a
      href={href}
      className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 21 21"
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      <span>Sign in with Microsoft</span>
    </a>
  );
}
