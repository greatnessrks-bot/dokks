"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";
import { upsertDeviceAccount } from "@/lib/deviceAccounts";
import { useSettings } from "@/contexts/SettingsContext";
import Spinner from "@/components/Spinner";

const EXIT_DURATION_MS = 180;

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { t } = useSettings();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function syncUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("deactivated_at")
          .eq("id", data.user.id)
          .single();

        if (profile?.deactivated_at) {
          await supabase.auth.signOut();
          router.push(`/account-status/${data.user.id}`);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (session) {
          upsertDeviceAccount({
            id: data.user.id,
            email: data.user.email ?? "",
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            lastUsed: new Date().toISOString(),
          });
        }
      }
    }

    syncUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  function openConfirm() {
    setModalMounted(true);
    setClosing(false);
    requestAnimationFrame(() => setConfirmOpen(true));
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setClosing(true);
    setTimeout(() => {
      setModalMounted(false);
      setClosing(false);
    }, EXIT_DURATION_MS);
  }

  async function handleConfirmLogout() {
    setLoggingOut(true);
    await logout();
  }

  if (loading) {
    return <Spinner className="w-4 h-4 text-muted" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-mono text-accent-indigo hover:text-accent-aqua transition-colors"
      >
        {t("signIn")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <span className="text-muted truncate max-w-[160px]">{user.email}</span>
      <button
        type="button"
        onClick={openConfirm}
        className="text-accent-amber px-2.5 py-1 rounded-full hover:bg-accent-amber/10 transition-colors duration-200"
      >
        {t("logOut")}
      </button>

      {modalMounted && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 transition-opacity duration-200 ease-out ${
            confirmOpen && !closing ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeConfirm}
        >
          <div
            className={`w-full max-w-sm rounded-xl border border-border bg-surface p-5 transition-all duration-200 ease-out ${
              confirmOpen && !closing
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-1"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground mb-5 text-center">
              {t("confirmLogoutTitle")}
            </h3>
            <div className="flex gap-2 justify-center">
              <button
                onClick={closeConfirm}
                disabled={loggingOut}
                className="font-mono text-xs rounded-md border border-border px-4 py-2 text-muted hover:text-foreground transition-colors disabled:opacity-60"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="font-mono text-xs rounded-md bg-accent-amber text-background px-4 py-2 disabled:opacity-60 flex items-center gap-1.5"
              >
                {loggingOut && <Spinner className="w-3 h-3 text-background" />}
                {t("logOut")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}