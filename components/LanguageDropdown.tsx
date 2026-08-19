"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import type { Language } from "@/lib/i18n";

const LANGUAGES: { code: Language; label: string; flagCode: string }[] = [
  { code: "en", label: "English", flagCode: "gb" },
  { code: "fr", label: "Français", flagCode: "fr" },
  { code: "es", label: "Español", flagCode: "es" },
];

function FlagBadge({ flagCode, label }: { flagCode: string; label: string }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full overflow-hidden border border-border shrink-0 relative">
      <Image
        src={`https://flagcdn.com/w40/${flagCode}.png`}
        alt={label}
        fill
        className="object-cover"
        sizes="20px"
      />
    </span>
  );
}

export default function LanguageDropdown() {
  const { language, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-mono text-muted hover:text-foreground hover:bg-surface transition-colors"
      >
        <FlagBadge flagCode={current.flagCode} label={current.label} />
        <span>{current.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg border border-border bg-surface shadow-lg z-50 overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                updateSettings({ language: lang.code });
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-left transition-colors ${
                lang.code === language
                  ? "bg-accent-indigo/15 text-foreground"
                  : "text-muted hover:bg-background/60 hover:text-foreground"
              }`}
            >
              <FlagBadge flagCode={lang.flagCode} label={lang.label} />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}