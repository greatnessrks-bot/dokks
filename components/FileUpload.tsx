"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { parseFile, isSupportedFile } from "@/lib/parseDocument";
import { useSettings } from "@/contexts/SettingsContext";
import type { ParsedCsv } from "@/lib/types";

interface Props {
  onParsed: (data: ParsedCsv) => void;
  fileName: string | null;
  onClear?: () => void;
  canClear?: boolean;
}

export default function FileUpload({ onParsed, fileName, onClear, canClear }: Props) {
  const { t } = useSettings();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!isSupportedFile(file.name)) {
        setError(t("unsupportedFileType"));
        return;
      }
      parseFile(file)
        .then(onParsed)
        .catch(() => setError(t("couldntParseFile")));
    },
    [onParsed, t]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={`relative border-2 border-dashed rounded-xl px-6 py-10 text-center transition-all ${
        isDragging
          ? "border-accent-indigo bg-accent-indigo/5 shadow-[0_0_24px_-4px_rgba(124,111,255,0.35)]"
          : "border-border bg-surface"
      }`}
    >
      <input
        type="file"
        accept=".csv,.xlsx,.xls,.docx,.pptx,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      {fileName && canClear && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label={t("removeFile")}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex flex-col items-center gap-2 pointer-events-none">
        {fileName ? (
          <>
            <FileSpreadsheet className="w-7 h-7 text-accent-aqua" strokeWidth={1.5} />
            <p className="font-mono text-sm text-foreground">{fileName}</p>
            <p className="text-xs text-muted">{t("dropNewFileToReplace")}</p>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-muted" strokeWidth={1.5} />
            <p className="text-sm text-foreground">{t("dropFileHere")}</p>
            <p className="text-xs text-muted">{t("fileTypesHint")}</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-3 text-xs font-mono text-accent-amber">{error}</p>
      )}
    </div>
  );
}