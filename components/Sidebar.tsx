"use client";

import { useRef, useState } from "react";
import { FileText, Plus, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ChatSummary } from "@/lib/chats";
import { deleteChat } from "@/lib/chats";
import Spinner from "@/components/Spinner";
import { useSettings } from "@/contexts/SettingsContext";

interface Props {
  chats: ChatSummary[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onChatDeleted: (chatId: string) => void;
  open: boolean;
  onClose: () => void;
  loading: boolean;
}

interface MenuState {
  chatId: string;
  fileName: string;
  x: number;
  y: number;
}

const LONG_PRESS_MS = 500;

export default function Sidebar({
  chats,
  selectedChatId,
  onSelect,
  onNewChat,
  onChatDeleted,
  open,
  onClose,
  loading,
}: Props) {
  const { t } = useSettings();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openMenu(chatId: string, fileName: string, x: number, y: number) {
    setMenu({ chatId, fileName, x, y });
  }

  function closeMenu() {
    setMenu(null);
  }

  function handleContextMenu(e: React.MouseEvent, chatId: string, fileName: string) {
    e.preventDefault();
    openMenu(chatId, fileName, e.clientX, e.clientY);
  }

  function handleTouchStart(e: React.TouchEvent, chatId: string, fileName: string) {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openMenu(chatId, fileName, touch.clientX, touch.clientY);
    }, LONG_PRESS_MS);
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function handleConfirmDelete() {
    if (!confirmingId) return;
    setDeletingId(confirmingId);
    const ok = await deleteChat(confirmingId);
    setDeletingId(null);
    if (ok) {
      onChatDeleted(confirmingId);
    }
    setConfirmingId(null);
  }

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
              {t("newChat")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : chats.length === 0 ? (
              <p className="text-xs font-mono text-muted px-2 py-4 text-center">
                {t("noChatsYet")}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelect(chat.id)}
                    onContextMenu={(e) => handleContextMenu(e, chat.id, chat.fileName)}
                    onTouchStart={(e) => handleTouchStart(e, chat.id, chat.fileName)}
                    onTouchEnd={clearLongPress}
                    onTouchMove={clearLongPress}
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
          <div className="p-3 border-t border-border">
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-background/60 hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              {t("settings")}
            </Link>
          </div>
        </div>
      </aside>

      {menu && (
        <>
          <div className="fixed inset-0 z-50" onClick={closeMenu} onContextMenu={(e) => e.preventDefault()} />
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-border bg-surface shadow-lg overflow-hidden"
            style={{ top: menu.y, left: menu.x }}
          >
            <button
              onClick={() => {
                setConfirmingId(menu.chatId);
                closeMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-accent-amber hover:bg-background/60 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {t("deleteChat")}
            </button>
          </div>
        </>
      )}

      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {t("deleteChatConfirmTitle")}
            </h3>
            <p className="text-xs text-muted mb-5">{t("deleteChatConfirmBody")}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmingId(null)}
                className="font-mono text-xs rounded-md border border-border px-3 py-1.5 text-muted hover:text-foreground transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === confirmingId}
                className="font-mono text-xs rounded-md bg-accent-amber text-background px-3 py-1.5 disabled:opacity-60 flex items-center gap-1.5"
              >
                {deletingId === confirmingId && <Spinner className="w-3 h-3 text-background" />}
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}