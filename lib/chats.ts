import { createClient } from "@/lib/supabase/client";
import { parseCsvText } from "@/lib/csv";
import type { ChartSpec, LedgerEntry, ParsedCsv } from "@/lib/types";

export interface ChatSummary {
  id: string;
  fileName: string;
  createdAt: string;
}

export async function loadChats(userId: string): Promise<ChatSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chats")
    .select("id, file_name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to load chats:", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    createdAt: row.created_at,
  }));
}

export async function createChat(
  userId: string,
  fileName: string,
  csvText: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, file_name: fileName, csv_text: csvText })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create chat:", error);
    return null;
  }

  return data.id as string;
}

export async function loadChatWithEntries(
  chatId: string
): Promise<{ parsedCsv: ParsedCsv; entries: LedgerEntry[] } | null> {
  const supabase = createClient();

  const { data: chatRow, error: chatError } = await supabase
    .from("chats")
    .select("file_name, csv_text")
    .eq("id", chatId)
    .single();

  if (chatError || !chatRow) {
    console.error("Failed to load chat:", chatError);
    return null;
  }

  const parsedCsv = parseCsvText(chatRow.file_name, chatRow.csv_text);
  if (!parsedCsv) return null;

  const { data: entryRows, error: entriesError } = await supabase
    .from("chat_entries")
    .select("id, question, answer, chart, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (entriesError || !entryRows) {
    console.error("Failed to load chat entries:", entriesError);
    return { parsedCsv, entries: [] };
  }

  const entries: LedgerEntry[] = entryRows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    chart: row.chart as ChartSpec | null,
    status: "done",
  }));

  return { parsedCsv, entries };
}

export async function saveChatEntry(
  chatId: string,
  userId: string,
  entry: { question: string; answer: string; chart: ChartSpec | null }
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("chat_entries").insert({
    chat_id: chatId,
    user_id: userId,
    question: entry.question,
    answer: entry.answer,
    chart: entry.chart,
  });

  if (error) {
    console.error("Failed to save chat entry:", error);
  }
}