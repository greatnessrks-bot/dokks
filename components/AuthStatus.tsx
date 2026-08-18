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

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
      <form action={logout}>
        <button type="submit" className="text-accent-amber hover:underline">
          {t("logOut")}
        </button>
      </form>
    </div>
  );
}