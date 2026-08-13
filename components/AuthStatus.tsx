"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logout } from "@/app/auth/actions";
import Spinner from "@/components/Spinner";

export default function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <Spinner className="w-4 h-4 text-muted" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs font-mono text-accent-indigo hover:text-accent-aqua transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <span className="text-muted truncate max-w-[160px]">{user.email}</span>
      <form action={logout}>
        <button type="submit" className="text-accent-amber hover:underline">
          Log out
        </button>
      </form>
    </div>
  );
}