"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function EmailConfirmedContent() {
  const { t } = useSettings();
  const searchParams = useSearchParams();
  const expParam = searchParams.get("exp");
  const exp = expParam ? parseInt(expParam, 10) : Date.now();

  const [remaining, setRemaining] = useState(() => exp - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(exp - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [exp]);

  const expired = remaining <= 0;

  if (expired) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-sm text-muted">{t("linkExpiredTitle")}</p>
        <p className="text-sm text-muted mt-1">{t("linkExpiredBody")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm text-center">
      <p className="font-mono text-xs text-muted mb-6">{formatTime(remaining)}</p>
      <CheckCircle2 className="w-10 h-10 text-accent-aqua mx-auto mb-4" />
      <h1 className="font-display text-xl font-semibold text-foreground mb-2">
        {t("emailConfirmedTitle")}
      </h1>
      <p className="text-sm text-muted mb-6">{t("emailConfirmedBody")}</p>
      <Link
        href="/login"
        className="inline-block rounded-lg bg-accent-indigo text-background px-5 py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors"
      >
        {t("goToLogin")}
      </Link>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <EmailConfirmedContent />
      </Suspense>
    </div>
  );
}