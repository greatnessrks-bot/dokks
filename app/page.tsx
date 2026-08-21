"use client";

import HeroBanner from "@/components/HeroBanner";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, PanelLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import FileUpload from "@/components/FileUpload";
import DataPreview from "@/components/DataPreview";
import QueryLedger from "@/components/QueryLedger";
import AuthStatus from "@/components/AuthStatus";
import LanguageDropdown from "@/components/LanguageDropdown";
import Sidebar from "@/components/Sidebar";
import Spinner from "@/components/Spinner";
import { createClient } from "@/lib/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import {
  createChat,
  loadChats,
  loadChatWithEntries,
  saveChatEntry,
  type ChatSummary,
} from "@/lib/chats";
import type { LedgerEntry, ParsedCsv } from "@/lib/types";

interface ApiError extends Error {
  retryAt?: string;
}

const PENDING_KEY = "ai-data-analyst:pending-ask";

interface PendingAsk {
  data: ParsedCsv;
  question: string;
}

export default function Home() {
  const { t, language, tone, expertise } = useSettings();
  const [data, setData] = useState<ParsedCsv | null>(null);
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authNotice, setAuthNotice] = useState(false);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [pendingNewFile, setPendingNewFile] = useState<ParsedCsv | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasResumedPending = useRef(false);
  const hasLoadedChats = useRef(false);

  const refreshChats = useCallback(async (userId: string) => {
    setChatsLoading(true);
    const list = await loadChats(userId);
    setChats(list);
    setChatsLoading(false);
  }, []);

  async function runAsk(
    askData: ParsedCsv,
    askQuestion: string,
    forUser: User | null,
    chatId: string | null
  ) {
    const id = crypto.randomUUID();
    setSubmitting(true);
    setEntries((prev) => [
      ...prev,
      { id, question: askQuestion, answer: "", chart: null, status: "pending" },
    ]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: askData.rawText,
          columns: askData.columns,
          kind: askData.kind,
          question: askQuestion,
          language,
          tone,
          expertise,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        const error: ApiError = new Error(json.error || "Analysis failed");
        error.retryAt = json.retryAt;
        throw error;
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, answer: json.answer, chart: json.chart, status: "done" }
            : entry
        )
      );

      if (forUser && chatId) {
        saveChatEntry(chatId, forUser.id, {
          question: askQuestion,
          answer: json.answer,
          chart: json.chart,
        });
      }
    } catch (err) {
      let errorMessage = "Something went wrong.";

      if (err instanceof Error) {
        errorMessage = err.message;

        const apiErr = err as ApiError;
        if (apiErr.retryAt) {
          const retryTime = new Date(apiErr.retryAt);
          const formatted = retryTime.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });
          errorMessage = `Rate limit reached — try again after ${formatted}.`;
        } else if (err.message === "Failed to fetch") {
          errorMessage = "Connection lost — check your internet and try again.";
        }
      }

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, answer: errorMessage, status: "error" }
            : entry
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: userData }) => {
      setUser(userData.user);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !user || hasLoadedChats.current) return;
    hasLoadedChats.current = true;
    refreshChats(user.id);
  }, [authChecked, user, refreshChats]);

  useEffect(() => {
    if (!authChecked || !user || hasResumedPending.current) return;

    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;

    hasResumedPending.current = true;
    sessionStorage.removeItem(PENDING_KEY);

    (async () => {
      try {
        const pending: PendingAsk = JSON.parse(raw);
        setData(pending.data);
        setEntries([]);
        setAuthNotice(false);

        const newChatId = await createChat(
          user.id,
          pending.data.fileName,
          pending.data.rawText,
          pending.data.kind
        );
        setSelectedChatId(newChatId);
        refreshChats(user.id);

        await runAsk(pending.data, pending.question, user, newChatId);
      } catch {
        // Malformed/stale payload — safe to ignore, user just asks again.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user]);

  async function handleFileParsed(parsed: ParsedCsv) {
    if (data) {
      setPendingNewFile(parsed);
      return;
    }
    await acceptNewFile(parsed);
  }

  async function acceptNewFile(parsed: ParsedCsv) {
    setData(parsed);
    setEntries([]);
    setSelectedChatId(null);
    setPendingNewFile(null);
    setAuthNotice(false);
    setSidebarOpen(false);

    if (user) {
      const newChatId = await createChat(user.id, parsed.fileName, parsed.rawText, parsed.kind);
      setSelectedChatId(newChatId);
      refreshChats(user.id);
    }
  }

  async function handleClearFile() {
  if (user && selectedChatId && entries.length === 0) {
    const supabase = createClient();
    await supabase.from("chats").delete().eq("id", selectedChatId);
    setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
  }
  setData(null);
  setSelectedChatId(null);
  setEntries([]);
  setPendingNewFile(null);
}

  function handleNewChat() {
    setData(null);
    setEntries([]);
    setSelectedChatId(null);
    setPendingNewFile(null);
    setQuestion("");
    setAuthNotice(false);
    setSidebarOpen(false);
  }

  async function handleSelectChat(chatId: string) {
    setSidebarOpen(false);
    setChatLoading(true);
    const result = await loadChatWithEntries(chatId);
    setChatLoading(false);
    if (!result) return;
    setData(result.parsedCsv);
    setEntries(result.entries);
    setSelectedChatId(chatId);
    setPendingNewFile(null);
    setQuestion("");
    setAuthNotice(false);
  }

  function handleChatDeleted(chatId: string) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (selectedChatId === chatId) {
      handleNewChat();
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !question.trim() || submitting) return;

    const q = question.trim();

    if (!user) {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ data, question: q })
      );
      setAuthNotice(true);
      return;
    }

    let chatId = selectedChatId;
    if (!chatId) {
      chatId = await createChat(user.id, data.fileName, data.rawText, data.kind);
      setSelectedChatId(chatId);
      refreshChats(user.id);
    }

    setAuthNotice(false);
    setQuestion("");
    await runAsk(data, q, user, chatId);
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {user && (
        <Sidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onSelect={handleSelectChat}
          onNewChat={handleNewChat}
          onChatDeleted={handleChatDeleted}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          loading={chatsLoading}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col h-screen">
        <header className="shrink-0 bg-background z-20 pt-3">
          <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center justify-between">
            {user ? (
              <div className="relative group">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
                <span className="pointer-events-none absolute left-0 top-full mt-1 whitespace-nowrap rounded-md bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  Sidebar
                </span>
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <LanguageDropdown />
              <AuthStatus />
            </div>
          </div>
          <div className="px-8">
            <div className="h-[3px] rounded-full bg-gradient-to-r from-transparent via-border to-transparent max-w-3xl mx-auto" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
            <HeroBanner />

            <header className="mb-10">
              <p className="font-mono text-xs tracking-widest text-accent-aqua uppercase mb-2">
                Dokks - Data Analyst
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                {t("heroTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted max-w-md">
                {t("heroSubtitle")}
              </p>
            </header>

            <section className="mb-6">
  <FileUpload
    onParsed={handleFileParsed}
    fileName={data?.fileName ?? null}
    onClear={handleClearFile}
    canClear={entries.length === 0}
  />
</section>

            {pendingNewFile && (
              <section className="mb-6 border border-accent-amber/40 bg-accent-amber/5 rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm text-foreground">
                  {t("openNewChatPrompt")}
                </span>
                <button
                  onClick={() => acceptNewFile(pendingNewFile)}
                  className="font-mono text-xs rounded-md bg-accent-indigo text-background px-3 py-1.5 hover:bg-accent-aqua transition-colors whitespace-nowrap"
                >
                  {t("openNewChat")}
                </button>
              </section>
            )}

            {chatLoading ? (
              <div className="mb-6 flex justify-center py-10">
                <Spinner className="w-6 h-6 text-accent-indigo" />
              </div>
            ) : (
              <>
                {data && (
                  <section className="mb-6">
                    <DataPreview data={data} />
                  </section>
                )}

                <section>
                  <QueryLedger entries={entries} />
                </section>
              </>
            )}
          </div>
        </div>

        <footer className="shrink-0 bg-background z-20 relative">
          <div className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent" />
          <div className="max-w-3xl mx-auto px-4 pb-10 pt-2">
            <form onSubmit={handleAsk} className="relative">
              <div className="flex gap-2 p-[1.5px] rounded-lg bg-gradient-to-r from-accent-indigo/60 via-accent-aqua/60 to-accent-indigo/60 focus-within:from-accent-indigo focus-within:via-accent-aqua focus-within:to-accent-indigo transition-colors">
                <div className="flex flex-1 gap-2 rounded-[7px] bg-surface p-1">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={!data || submitting}
                    placeholder={
                      data ? t("askPlaceholder") : t("uploadFileFirst")
                    }
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted disabled:opacity-50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!data || !question.trim() || submitting}
                    className="px-3 rounded-md bg-accent-indigo text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-aqua transition-colors"
                    aria-label="Ask"
                  >
                    {submitting ? (
                      <Spinner className="w-4 h-4 text-background" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {authNotice && (
              <div className="mt-3 border border-accent-indigo/40 bg-accent-indigo/5 rounded-lg px-4 py-3 text-sm text-foreground flex items-center justify-between gap-3 flex-wrap">
                <span>{t("pleaseLogin")}</span>
                <Link
                  href="/login"
                  className="font-mono text-xs text-accent-indigo hover:text-accent-aqua transition-colors whitespace-nowrap"
                >
                  {t("signInSignUp")}
                </Link>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}