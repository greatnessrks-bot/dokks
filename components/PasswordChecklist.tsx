"use client";

import { Check, X } from "lucide-react";
import { checkPassword, ALLOWED_SYMBOLS } from "@/lib/password";
import { useSettings } from "@/contexts/SettingsContext";

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-xs font-mono ${
        met ? "text-accent-aqua" : "text-muted"
      }`}
    >
      {met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
      {label}
    </li>
  );
}

export default function PasswordChecklist({ password }: { password: string }) {
  const { t } = useSettings();
  const check = checkPassword(password);

  return (
    <ul className="flex flex-col gap-1 mt-2">
      <Rule met={check.minLength} label={t("pwMinLength")} />
      <Rule met={check.hasLetter} label={t("pwHasLetter")} />
      <Rule met={check.hasNumber} label={t("pwHasNumber")} />
      <Rule met={check.hasSymbol} label={`${t("pwHasSymbol")} (${ALLOWED_SYMBOLS})`} />
      <Rule met={check.onlyAllowedChars} label={t("pwOnlyAllowedChars")} />
    </ul>
  );
}