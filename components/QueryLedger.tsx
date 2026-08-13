import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { LedgerEntry } from "@/lib/types";

const COLORS = {
  border: "#232935",
  muted: "#8A93A3",
  surface: "#12161D",
  foreground: "#E8EAF0",
  aqua: "#35E6C8",
  indigo: "#7C6FFF",
  amber: "#FFB454",
};

function ChartBlock({ entry }: { entry: LedgerEntry }) {
  if (!entry.chart) return null;
  const { type, title, xKey, yKey, data } = entry.chart;

  const tooltipStyle = {
    fontSize: 12,
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    color: COLORS.foreground,
  };

  return (
    <div id={`chart-${entry.id}`} className="mt-3 border border-border bg-surface rounded-xl p-4">
      <p className="text-xs font-mono text-muted mb-2">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        {type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: COLORS.muted }}
              axisLine={{ stroke: COLORS.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.muted }}
              axisLine={{ stroke: COLORS.border }}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: COLORS.border, opacity: 0.3 }} />
            <Bar dataKey={yKey} fill={COLORS.aqua} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid stroke={COLORS.border} vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: COLORS.muted }}
              axisLine={{ stroke: COLORS.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.muted }}
              axisLine={{ stroke: COLORS.border }}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.border }} />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={COLORS.indigo}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS.indigo }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function QueryLedger({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl px-6 py-10 text-center">
        <p className="text-sm text-muted">
          Ask something about your data — e.g. &ldquo;which region had the
          highest sales in Q3?&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          data-entry-id={entry.id}
          className={`px-4 py-4 ${
            i !== entries.length - 1 ? "border-b border-border/60" : ""
          }`}
        >
          <div className="flex gap-3">
            <span className="font-mono text-xs text-accent-indigo pt-0.5 w-6 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {entry.question}
              </p>
              {entry.status === "pending" && (
                <div className="flex items-center gap-2 mt-2 text-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-mono">analyzing…</span>
                </div>
              )}
              {entry.status === "error" && (
                <p className="mt-2 text-xs font-mono text-accent-amber">
                  {entry.answer}
                </p>
              )}
              {entry.status === "done" && (
                <>
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed border-l-2 border-accent-aqua pl-3">
                    {entry.answer}
                  </p>
                  <ChartBlock entry={entry} />
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}