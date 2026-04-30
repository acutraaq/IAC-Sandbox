import { Suspense } from "react";
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-6">
      <section className="w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl font-semibold text-text">Sandbox IAC</h1>
          <p className="text-sm text-text-muted">Sign in to continue</p>
        </div>
        <div className="mt-8">
          <Suspense>
            <LoginButton />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-text-muted">
          EPF Internal · Sandbox
        </p>
      </section>
    </div>
  );
}
