"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSettings, type Theme, type Tone, type Expertise } from "@/contexts/SettingsContext";
import type { Language } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { deactivateOwnAccount } from "@/lib/profile";
import DeviceAccounts from "@/components/DeviceAccounts";

export default function SettingsPage() {
  const { theme, language, tone, expertise, updateSettings, t } = useSettings();
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const router = useRouter();

  async function handleDeactivate() {
    setDeactivating(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setDeactivating(false);
      return;
    }
    const ok = await deactivateOwnAccount(data.user.id);
    if (ok) {
      await supabase.auth.signOut();
      router.push("/login");
    }
    setDeactivating(false);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="max-w-lg mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-accent-aqua transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("back")}
        </Link>

        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-8">
          {t("settings")}
        </h1>

        <section className="mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent-aqua mb-3">
            {t("appearance")}
          </h2>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["dark", "light"] as Theme[]).map((opt) => (
              <button
                key={opt}
                onClick={() => updateSettings({ theme: opt })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  theme === opt
                    ? "bg-accent-indigo text-background"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {t(opt)}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent-aqua mb-3">
            {t("language")}
          </h2>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(["en", "fr", "es"] as Language[]).map((opt) => (
              <button
                key={opt}
                onClick={() => updateSettings({ language: opt })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  language === opt
                    ? "bg-accent-indigo text-background"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {opt === "en" ? "English" : opt === "fr" ? "Français" : "Español"}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent-aqua mb-3">
            {t("personalization")}
          </h2>

          <div className="mb-4">
            <p className="text-xs font-mono text-muted mb-2">{t("answerStyle")}</p>
            <div className="flex border border-border rounded-lg overflow-hidden">
              {(["concise", "balanced", "detailed"] as Tone[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSettings({ tone: opt })}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    tone === opt
                      ? "bg-accent-indigo text-background"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-mono text-muted mb-2">{t("experienceLevel")}</p>
            <div className="flex border border-border rounded-lg overflow-hidden">
              {(["beginner", "intermediate", "expert"] as Expertise[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateSettings({ expertise: opt })}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    expertise === opt
                      ? "bg-accent-indigo text-background"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent-aqua mb-3">
            {t("accountsOnThisDevice")}
          </h2>
          <DeviceAccounts />
        </section>

        <section>
          <h2 className="text-xs font-mono uppercase tracking-widest text-accent-aqua mb-3">
            {t("account")}
          </h2>
          {!confirmingDeactivate ? (
            <button
              onClick={() => setConfirmingDeactivate(true)}
              className="text-sm font-mono text-accent-amber hover:underline"
            >
              {t("deactivateAccount")}
            </button>
          ) : (
            <div className="border border-accent-amber/40 bg-accent-amber/5 rounded-lg px-4 py-3">
              <p className="text-sm text-foreground mb-3">{t("deactivateWarning")}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="font-mono text-xs rounded-md bg-accent-amber text-background px-3 py-1.5 disabled:opacity-60"
                >
                  {deactivating ? "…" : t("deactivateAccount")}
                </button>
                <button
                  onClick={() => setConfirmingDeactivate(false)}
                  className="font-mono text-xs rounded-md border border-border px-3 py-1.5 text-muted hover:text-foreground"
                >
                  {t("back")}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}