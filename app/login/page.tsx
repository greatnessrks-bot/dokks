"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "@/app/auth/actions";
import { checkPassword } from "@/lib/password";
import PasswordChecklist from "@/components/PasswordChecklist";
import Spinner from "@/components/Spinner";
import { useSettings } from "@/contexts/SettingsContext";

function LoginForm() {
  const { t } = useSettings();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const message = searchParams.get("message");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();

    if (mode === "signup") {
      const pwCheck = checkPassword(password);
      if (!pwCheck.valid) {
        setFormError(t("passwordRequirementsError"));
        return;
      }

      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/verify-email?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (!json.valid) {
          setCheckingEmail(false);
          setFormError(t("invalidEmailError"));
          return;
        }
      } catch {
        // If the check itself fails, don't block signup over an infra hiccup.
      }
      setCheckingEmail(false);
    }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        const result = await login(formData);
        if (result?.error) {
          setFormError(result.error);
        }
      } else {
        const result = await signup(formData);
        if (result?.error) {
          setFormError(result.error);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || checkingEmail;

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent-aqua transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t("back")}
      </Link>

      <p className="font-mono text-xs tracking-widest text-accent-aqua uppercase mb-2 text-center">
        AI Data Analyst
      </p>
      <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight text-center mb-8">
        {mode === "signin" ? t("welcomeBack") : t("createAccount")}
      </h1>

      <div className="flex mb-6 border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setFormError(null);
          }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "signin"
              ? "bg-accent-indigo text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {t("signIn")}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setFormError(null);
          }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "signup"
              ? "bg-accent-indigo text-background"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {t("signUp")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="email" className="text-xs font-mono text-muted block mb-1">
            {t("emailLabel")}
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
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="text-xs font-mono text-muted">
              {t("passwordLabel")}
            </label>
            {mode === "signin" && (
              <Link
                href="/reset-password"
                className="text-xs font-mono text-accent-indigo hover:text-accent-aqua transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            )}
          </div>
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
              aria-label={showPassword ? t("hidePasswordLabel") : t("showPasswordLabel")}
              tabIndex={-1}
            >
              {showPassword ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
          {mode === "signup" && <PasswordChecklist password={password} />}
        </div>

        {(formError || urlError) && (
          <p className="text-xs font-mono text-accent-amber">{formError || urlError}</p>
        )}
        {message && <p className="text-xs font-mono text-accent-aqua">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-accent-indigo text-background py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors disabled:opacity-60"
        >
          {busy && <Spinner className="w-4 h-4 text-background" />}
          {checkingEmail ? t("checkingEmail") : mode === "signin" ? t("signIn") : t("signUp")}
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