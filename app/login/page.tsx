"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "@/app/auth/actions";

function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent-aqua transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Link>

      <p className="font-mono text-xs tracking-widest text-accent-aqua uppercase mb-2 text-center">
        AI Data Analyst
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight text-center mb-8">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>

      <div className="flex mb-6 border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-accent-indigo text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-accent-indigo text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Sign up
        </button>
      </div>

      <form
        action={mode === "signin" ? login : signup}
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
        <div>
          <label htmlFor="password" className="text-xs font-mono text-muted block mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
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
        </div>

        {error && (
          <p className="text-xs font-mono text-accent-amber">{error}</p>
        )}
        {message && (
          <p className="text-xs font-mono text-accent-aqua">{message}</p>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-accent-indigo text-background py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors"
        >
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}