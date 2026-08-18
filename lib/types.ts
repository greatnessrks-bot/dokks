export type DocumentKind = "tabular" | "text";

export interface ChartSpec {
  type: "bar" | "line";
  title: string;
  xKey: string;
  yKey: string;
  data: Record<string, string | number>[];
}

export interface LedgerEntry {
  id: string;
  question: string;
  answer: string;
  chart: ChartSpec | null;
  status: "pending" | "done" | "error";
}

export interface ParsedCsv {
  fileName: string;
  kind: DocumentKind;
  columns: string[];
  rows: Record<string, string>[];
  rawText: string;
}