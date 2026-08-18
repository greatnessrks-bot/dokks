import { createClient } from "@/lib/supabase/client";

export interface AccountStatus {
  id: string;
  email: string;
  deactivated_at: string | null;
}

export async function getAccountStatus(id: string): Promise<AccountStatus | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_account_status", { account_id: id });
  if (error || !data || data.length === 0) return null;
  return data[0] as AccountStatus;
}

export async function reactivateAccount(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reactivate_account", { account_id: id });
  return !error;
}

export async function deactivateOwnAccount(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: new Date().toISOString() })
    .eq("id", userId);
  return !error;
}