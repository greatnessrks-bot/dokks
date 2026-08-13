"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { updatePassword } from "@/app/auth/actions";
import { checkPassword } from "@/lib/password";
import PasswordChecklist from "@/components/PasswordChecklist";
import Spinner from "@/components/Spinner";

function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const check = checkPassword(password);

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-xs tracking-widest text-accent-aqua uppercase mb-2 text-center">
        AI Data Analyst
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight text-center mb-8">
        Set a new password
      </h1>

      <form
        action={updatePassword}
        onSubmit={(e) => {
          if (!check.valid) {
            e.preventDefault();
            return;
          }
          setSubmitting(true);
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label htmlFor="password" className="text-xs font-mono text-muted block mb-1">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-indigo"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          <PasswordChecklist password={password} />
        </div>

        {error && <p className="text-xs font-mono text-accent-amber">{error}</p>}

        <button
          type="submit"
          disabled={!check.valid || submitting}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-accent-indigo text-background py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting && <Spinner className="w-4 h-4 text-background" />}
          Update password
        </button>
      </form>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}