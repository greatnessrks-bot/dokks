"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Camera, Image as ImageIcon } from "lucide-react";
import { parseImageFile } from "@/lib/parseDocument";
import { useSettings } from "@/contexts/SettingsContext";
import type { ParsedCsv } from "@/lib/types";
import Spinner from "@/components/Spinner";

interface Props {
  onParsed: (data: ParsedCsv) => void;
  disabled?: boolean;
}

export default function AttachMenu({ onParsed, disabled }: Props) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleImageSelected(file: File) {
    setError(null);
    setProcessing(true);
    try {
      const parsed = await parseImageFile(file);
      onParsed(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("couldntParseFile"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || processing}
        aria-label="Attach"
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-background/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        {processing ? <Spinner className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-44 rounded-lg border border-border bg-surface shadow-lg overflow-hidden z-50">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              cameraInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-background/60 transition-colors"
          >
            <Camera className="w-4 h-4" />
            {t("camera")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              galleryInputRef.current?.click();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-background/60 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            {t("gallery")}
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelected(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSelected(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="absolute bottom-full left-0 mb-1 w-48 text-xs font-mono text-accent-amber whitespace-normal z-50">
          {error}
        </p>
      )}
    </div>
  );
}