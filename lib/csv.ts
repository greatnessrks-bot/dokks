import Papa from "papaparse";
import type { ParsedCsv } from "@/lib/types";

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawText = reader.result as string;
      const parsed = parseCsvText(file.name, rawText);
      if (!parsed) {
        reject(new Error("Couldn't parse that file. Is it valid CSV?"));
        return;
      }
      resolve(parsed);
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsText(file);
  });
}

export function parseCsvText(fileName: string, rawText: string): ParsedCsv | null {
  const results = Papa.parse<Record<string, string>>(rawText, {
    header: true,
    skipEmptyLines: true,
  });
  const columns = results.meta.fields;
  if (!columns) return null;
  return { fileName, kind: "tabular", columns, rows: results.data, rawText };
}