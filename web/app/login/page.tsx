import { Suspense } from "react";
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border-glow bg-surface p-8 glow-border">
          <pre
            className="font-mono text-base text-text-muted leading-relaxed whitespace-pre-wrap"
            aria-hidden="true"
          >
{`# ----------------------------------------
# sandbox · EPF Internal IaC
# ----------------------------------------
#
# Authentication required.
# Microsoft Entra ID SSO.
#
`}
          </pre>
          <div className="mt-3 flex items-baseline gap-2 font-mono text-base">
            <span className="text-prompt">$</span>
            <span className="text-text">sandbox auth login</span>
            <span className="animate-terminal-cursor-blink inline-block h-[0.9em] w-[0.5em] bg-accent align-middle motion-reduce:animate-none" aria-hidden="true" />
          </div>
          <div className="mt-10">
            <Suspense>
              <LoginButton />
            </Suspense>
          </div>
          <p className="mt-8 font-mono text-xs text-text-faint">
            <span className="text-comment"># </span>
            v1.0.0 · placeholder-session-active
          </p>
        </div>
      </div>
    </div>
  );
}
