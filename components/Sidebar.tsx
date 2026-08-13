"use client";

import { FileText, Plus } from "lucide-react";
import type { ChatSummary } from "@/lib/chats";

interface Props {
  chats: ChatSummary[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({
  chats,
  selectedChatId,
  onSelect,
  onNewChat,
  open,
  onClose,
}: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed md:sticky md:top-0 inset-y-0 left-0 z-40 h-screen border-r border-border bg-surface flex flex-col overflow-hidden transition-all duration-200 ${
          open
            ? "translate-x-0 w-64"
            : "-translate-x-full w-64 md:translate-x-0 md:w-0 md:border-r-0"
        }`}
      >
        <div className="w-64 flex flex-col h-full shrink-0">
          <div className="p-3 border-b border-border">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-indigo text-background px-3 py-2 text-sm font-medium hover:bg-accent-aqua transition-colors"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chats.length === 0 ? (
              <p className="text-xs font-mono text-muted px-2 py-4 text-center">
                No chats yet
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelect(chat.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      chat.id === selectedChatId
                        ? "bg-accent-indigo/15 text-foreground"
                        : "text-muted hover:bg-background/60 hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-mono text-xs">
                      {chat.fileName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}