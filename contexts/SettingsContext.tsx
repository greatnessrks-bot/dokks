"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { translations, type Language, type TranslationKey } from "@/lib/i18n";

export type Theme = "dark" | "light";
export type Tone = "concise" | "balanced" | "detailed";
export type Expertise = "beginner" | "intermediate" | "expert";

export interface Settings {
  theme: Theme;
  language: Language;
  tone: Tone;
  expertise: Expertise;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  language: "en",
  tone: "balanced",
  expertise: "intermediate",
};

const STORAGE_KEY = "ai-data-analyst:settings";

interface SettingsContextValue extends Settings {
  loaded: boolean;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
        if (parsed.theme) applyTheme(parsed.theme);
      } catch {
        // ignore malformed local cache
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(uid: string) {
      const { data } = await supabase
        .from("profiles")
        .select("theme, language, tone, expertise")
        .eq("id", uid)
        .single();

      if (data) {
        const next: Settings = {
          theme: (data.theme as Theme) ?? DEFAULT_SETTINGS.theme,
          language: (data.language as Language) ?? DEFAULT_SETTINGS.language,
          tone: (data.tone as Tone) ?? DEFAULT_SETTINGS.tone,
          expertise: (data.expertise as Expertise) ?? DEFAULT_SETTINGS.expertise,
        };
        setSettings(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setLoaded(true);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadProfile(data.user.id);
      } else {
        setLoaded(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadProfile(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<Settings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (userId) {
        const supabase = createClient();
        await supabase.from("profiles").update(partial).eq("id", userId);
      }
    },
    [settings, userId]
  );

  const t = useCallback(
    (key: TranslationKey) => translations[settings.language][key] ?? translations.en[key],
    [settings.language]
  );

  return (
    <SettingsContext.Provider value={{ ...settings, loaded, updateSettings, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}