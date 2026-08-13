"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/app/auth/actions";
import Spinner from "@/components/Spinner";

function ResetForm() {
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent-aqua transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>

      <p className="font-mono text-xs tracking-widest text-accent-aqua uppercase mb-2 text-center">
        AI Data Analyst
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight text-center mb-2">
        Reset your password
      </h1>
      <p className="text-sm text-muted text-center mb-8">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>

      <form
        action={requestPasswordReset}
        onSubmit={() => setSubmitting(true)}
        className="flex flex-col gap-3"
      >
        <div>
          <label htmlFor="email" className="text-xs font-mono text-muted block mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-indigo"
            placeholder="you@example.com"
          />
        </div>

        {error && <p className="text-xs font-mono text-accent-amber">{error}</p>}
        {message && <p className="text-xs font-mono text-accent-aqua">{message}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-accent-indigo text-background py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors disabled:opacity-60"
        >
          {submitting && <Spinner className="w-4 h-4 text-background" />}
          Send reset link
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}