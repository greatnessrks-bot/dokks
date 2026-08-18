"use client";

import { useSettings } from "@/contexts/SettingsContext";
import type { ParsedCsv } from "@/lib/types";

export default function DataPreview({ data }: { data: ParsedCsv }) {
  const { t } = useSettings();

  if (data.kind === "text") {
    const preview = data.rawText.slice(0, 1500);
    const isTruncated = data.rawText.length > 1500;
    const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length;

    return (
      <div className="border border-border bg-surface rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/40">
          <span className="text-xs font-mono text-muted">
            {wordCount.toLocaleString()} {t("words")}
          </span>
          <span className="text-xs font-mono text-accent-aqua">{t("preview")}</span>
        </div>
        <div className="px-4 py-3 max-h-64 overflow-y-auto">
          <p className="text-xs font-mono text-foreground/90 whitespace-pre-wrap">
            {preview}
            {isTruncated && "…"}
          </p>
        </div>
      </div>
    );
  }

  const previewRows = data.rows.slice(0, 5);

  return (
    <div className="border border-border bg-surface rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/40">
        <span className="text-xs font-mono text-muted">
          {data.rows.length.toLocaleString()} {t("rowsCols")} · {data.columns.length} {t("columns")}
        </span>
        <span className="text-xs font-mono text-accent-aqua">{t("previewFirst5")}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-2 py-2 text-left font-mono text-xs text-muted border-r border-border">
                #
              </th>
              {data.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-background/40 transition-colors">
                <td className="px-2 py-2 font-mono text-xs text-muted border-r border-border">
                  {i + 1}
                </td>
                {data.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 font-mono text-xs text-foreground/90 whitespace-nowrap"
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}