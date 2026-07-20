import Link from "next/link";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <pre
          className="font-mono text-sm text-text-muted leading-relaxed whitespace-pre-wrap"
          aria-hidden="true"
        >
{`# ----------------------------------------
# 404 · resource not found
# ----------------------------------------
#
# The path you requested doesn't exist in
# this sandbox.
#
`}
        </pre>
        <h1 className="mt-4 font-sans text-2xl font-bold text-text md:text-3xl">
          Nothing deployed here
        </h1>
        <p className="mt-2 max-w-[50ch] text-sm text-text-muted md:text-base">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to sandbox
          </Link>
        </Button>
      </div>
    </PageTransition>
  );
}
