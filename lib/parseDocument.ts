import * as XLSX from "xlsx";
import mammoth from "mammoth";
import JSZip from "jszip";
import { parseCsvFile } from "@/lib/csv";
import type { ParsedCsv } from "@/lib/types";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".docx", ".pptx", ".pdf"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function parseFile(file: File): Promise<ParsedCsv> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return parseCsvFile(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseXlsxFile(file);
  }
  if (name.endsWith(".docx")) {
    return parseDocxFile(file);
  }
  if (name.endsWith(".pptx")) {
    return parsePptxFile(file);
  }
  if (name.endsWith(".pdf")) {
    return parsePdfFile(file);
  }

  throw new Error("Unsupported file type.");
}

async function parseXlsxFile(file: File): Promise<ParsedCsv> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  const rawText = XLSX.utils.sheet_to_csv(sheet);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return { fileName: file.name, kind: "tabular", columns, rows, rawText };
}

async function parseDocxFile(file: File): Promise<ParsedCsv> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });

  return { fileName: file.name, kind: "text", columns: [], rows: [], rawText: result.value };
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function parsePptxFile(file: File): Promise<ParsedCsv> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] ?? "0", 10);
      return na - nb;
    });

  const slideTexts: string[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("text");
    const text = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g))
      .map((m) => decodeXmlEntities(m[1]))
      .join(" ");
    slideTexts.push(text);
  }

  const rawText = slideTexts.map((text, i) => `Slide ${i + 1}: ${text}`).join("\n\n");

  return { fileName: file.name, kind: "text", columns: [], rows: [], rawText };
}

async function parsePdfFile(file: File): Promise<ParsedCsv> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(text);
  }

  const rawText = pageTexts.join("\n\n");

  return { fileName: file.name, kind: "text", columns: [], rows: [], rawText };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.readAsDataURL(file);
  });
}

export async function parseImageFile(file: File): Promise<ParsedCsv> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("That image is too large. Please use one under 10MB.");
  }

  const imageBase64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";
  const imagePreviewUrl = `data:${mimeType};base64,${imageBase64}`;

  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Couldn't read that image.");
  }

  return {
    fileName: file.name || "Photo",
    kind: "text",
    columns: [],
    rows: [],
    rawText: json.text,
    imagePreviewUrl,
  };
}