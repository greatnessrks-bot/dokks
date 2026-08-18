"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAccountStatus, reactivateAccount, type AccountStatus } from "@/lib/profile";
import { useSettings } from "@/contexts/SettingsContext";
import Spinner from "@/components/Spinner";

export default function AccountStatusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useSettings();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await getAccountStatus(params.id);
      setStatus(result);
      setLoading(false);
    })();
  }, [params.id]);

  async function handleReactivate() {
    setReactivating(true);
    const ok = await reactivateAccount(params.id);
    setReactivating(false);
    if (ok) {
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-6 h-6 text-muted" />
      </div>
    );
  }

  if (!status || !status.deactivated_at) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-sm text-muted">Account not found or not deactivated.</p>
      </div>
    );
  }

  const deactivatedDate = new Date(status.deactivated_at).toLocaleString();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs tracking-widest text-accent-amber uppercase mb-2">
          Account deactivated
        </p>
        <h1 className="font-display text-xl font-semibold text-foreground mb-2">
          {status.email}
        </h1>
        <p className="text-sm text-muted mb-6">
          {t("deactivatedOn")} {deactivatedDate}
        </p>
        <button
          onClick={handleReactivate}
          disabled={reactivating}
          className="w-full rounded-lg bg-accent-indigo text-background py-2.5 text-sm font-medium hover:bg-accent-aqua transition-colors disabled:opacity-60"
        >
          {reactivating ? "…" : t("reactivate")}
        </button>
        <Link
          href="/login"
          className="block mt-4 text-xs font-mono text-muted hover:text-foreground transition-colors"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}