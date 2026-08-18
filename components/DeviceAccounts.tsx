"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDeviceAccounts, type DeviceAccount } from "@/lib/deviceAccounts";
import { getAccountStatus } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import Spinner from "@/components/Spinner";

interface AccountWithStatus extends DeviceAccount {
  deactivatedAt: string | null;
}

export default function DeviceAccounts() {
  const [accounts, setAccounts] = useState<AccountWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useSettings();

  useEffect(() => {
    (async () => {
      const stored = getDeviceAccounts();
      const withStatus = await Promise.all(
        stored.map(async (acc) => {
          const status = await getAccountStatus(acc.id);
          return { ...acc, deactivatedAt: status?.deactivated_at ?? null };
        })
      );
      setAccounts(withStatus);
      setLoading(false);
    })();
  }, []);

  async function handleClick(account: AccountWithStatus) {
    if (account.deactivatedAt) {
      router.push(`/account-status/${account.id}`);
      return;
    }

    setSwitchingId(account.id);
    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });
    setSwitchingId(null);

    if (error) {
      router.push(`/login?message=${encodeURIComponent("Please sign in to " + account.email)}`);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner className="w-5 h-5 text-muted" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return <p className="text-xs font-mono text-muted">—</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {accounts.map((account) => (
        <button
          key={account.id}
          onClick={() => handleClick(account)}
          disabled={switchingId === account.id}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left hover:bg-background/60 transition-colors disabled:opacity-60"
        >
          <span className="font-mono text-xs text-foreground truncate">{account.email}</span>
          {account.deactivatedAt ? (
            <span className="text-xs font-mono text-accent-amber shrink-0 ml-2">
              {t("deactivatedOn")}
            </span>
          ) : switchingId === account.id ? (
            <Spinner className="w-3.5 h-3.5 text-muted shrink-0 ml-2" />
          ) : (
            <span className="text-xs font-mono text-accent-aqua shrink-0 ml-2">●</span>
          )}
        </button>
      ))}
    </div>
  );
}