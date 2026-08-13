import type { ParsedCsv } from "@/lib/types";

export default function DataPreview({ data }: { data: ParsedCsv }) {
  const previewRows = data.rows.slice(0, 5);

  return (
    <div className="border border-border bg-surface rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/40">
        <span className="text-xs font-mono text-muted">
          {data.rows.length.toLocaleString()} rows · {data.columns.length} columns
        </span>
        <span className="text-xs font-mono text-accent-aqua">preview: first 5</span>
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