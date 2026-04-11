import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Lock className="h-7 w-7 text-accent" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text">Sign In</h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in with your Microsoft work account to access the Sandbox
            Playground.
          </p>
        </div>

        <button
          disabled
          aria-disabled="true"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-text-muted opacity-60 cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M13 1h10v10H13z" />
            <path fill="#7fba00" d="M1 13h10v10H1z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
          </svg>
          Sign in with Microsoft
        </button>

        <p className="text-xs text-text-muted">
          Microsoft Single Sign-On is being configured. Check back soon.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
