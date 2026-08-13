"use client";

import { Check, X } from "lucide-react";
import { checkPassword, ALLOWED_SYMBOLS } from "@/lib/password";

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
  const check = checkPassword(password);

  return (
    <ul className="flex flex-col gap-1 mt-2">
      <Rule met={check.minLength} label="At least 8 characters" />
      <Rule met={check.hasLetter} label="At least one letter" />
      <Rule met={check.hasNumber} label="At least one number" />
      <Rule met={check.hasSymbol} label={`At least one symbol (${ALLOWED_SYMBOLS})`} />
      <Rule met={check.onlyAllowedChars} label="No punctuation, hyphens, or underscores" />
    </ul>
  );
}