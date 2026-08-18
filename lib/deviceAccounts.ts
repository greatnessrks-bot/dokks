const KEY = "ai-data-analyst:device-accounts";

export interface DeviceAccount {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  lastUsed: string;
}

export function getDeviceAccounts(): DeviceAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DeviceAccount[]) : [];
  } catch {
    return [];
  }
}

export function upsertDeviceAccount(account: DeviceAccount) {
  const accounts = getDeviceAccounts().filter((a) => a.id !== account.id);
  accounts.unshift(account);
  localStorage.setItem(KEY, JSON.stringify(accounts));
}