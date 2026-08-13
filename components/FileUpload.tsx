"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseCsvFile } from "@/lib/csv";
import type { ParsedCsv } from "@/lib/types";

interface Props {
  onParsed: (data: ParsedCsv) => void;
  fileName: string | null;
}

export default function FileUpload({ onParsed, fileName }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a .csv file.");
        return;
      }
      parseCsvFile(file)
        .then(onParsed)
        .catch(() => setError("Couldn't parse that file. Is it valid CSV?"));
    },
    [onParsed]
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
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        {fileName ? (
          <>
            <FileSpreadsheet className="w-7 h-7 text-accent-aqua" strokeWidth={1.5} />
            <p className="font-mono text-sm text-foreground">{fileName}</p>
            <p className="text-xs text-muted">Drop a new file to replace it</p>
          </>
        ) : (
          <>
            <Upload className="w-7 h-7 text-muted" strokeWidth={1.5} />
            <p className="text-sm text-foreground">
              Drop a CSV here, or click to browse
            </p>
            <p className="text-xs text-muted">Sales reports, exports, logs — any tabular CSV</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-3 text-xs font-mono text-accent-amber">{error}</p>
      )}
    </div>
  );
}