import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MAX_CONTENT_CHARS = 20000;

interface ChartSpec {
  type: "bar" | "line";
  title: string;
  xKey: string;
  yKey: string;
  data: Record<string, string | number>[];
}

interface AnalyzeResponse {
  answer: string;
  chart: ChartSpec | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  concise: "Keep the answer brief and to the point — a sentence or two where possible.",
  balanced: "Give a reasonably detailed answer without being overly long.",
  detailed: "Give a thorough, detailed answer with relevant context and nuance.",
};

const EXPERTISE_INSTRUCTIONS: Record<string, string> = {
  beginner:
    "Explain in simple terms, avoiding technical or statistical jargon, as if speaking to someone new to data analysis.",
  intermediate: "Assume general familiarity with basic data analysis concepts.",
  expert:
    "You may use technical/statistical terminology freely and assume strong data analysis expertise.",
};

const CHART_SCHEMA_INSTRUCTION = `When you include a non-null "chart", follow this EXACTLY:
- "data" must be an array of plain JSON objects.
- Every object's property names must be the EXACT same strings as "xKey" and "yKey" (case-sensitive). Example: if "xKey" is "Month", every object must have a "Month" property — not "month", not "date", not anything else.
- EVERY object in "data" must include BOTH the "xKey" and "yKey" properties — never omit one, even if a value is 0.
- The value for "yKey" in every object must be a plain number — no currency symbols, no thousands separators (commas), no percent signs, no units. E.g. use 260000, not "$260,000". Put any formatted/currency version only in the "answer" text, never inside chart data.`;

// Gemini's free-tier daily quota resets at midnight Pacific Time.
// This calculates that exact moment as a UTC timestamp so the client
// can render it in the visitor's own local time.
function nextPacificMidnightUTC(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {} as Record<string, string>);

  const laWallAsUtc = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second
  );
  const offsetMs = laWallAsUtc - now.getTime();

  const nextMidnightLAWall = Date.UTC(+parts.year, +parts.month - 1, +parts.day + 1, 0, 0, 0);
  return new Date(nextMidnightLAWall - offsetMs);
}

// Fire-and-forget alert email so you find out about auth/billing issues
// before a user has to tell you. Never throws — a failed alert should
// never break the user-facing error response.
async function alertAuthError(message: string) {
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_TO || !process.env.ALERT_EMAIL_FROM) {
    console.error("Auth error occurred but alert email is not configured:", message);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM,
        to: process.env.ALERT_EMAIL_TO,
        subject: "AI Data Analyst: API auth error",
        text: `Got an auth error from Gemini:\n\n${message}\n\nCheck your API key / billing on Google AI Studio.`,
      }),
    });
  } catch (alertErr) {
    console.error("Failed to send auth error alert email:", alertErr);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, columns, kind, question, language, tone, expertise } = await req.json();

    if (!content || !question) {
      return NextResponse.json(
        { error: "content and question are required" },
        { status: 400 }
      );
    }

    const truncatedContent =
      content.length > MAX_CONTENT_CHARS
        ? content.slice(0, MAX_CONTENT_CHARS) + "\n...[truncated for length]"
        : content;

    const isTabular = kind === "tabular" && Array.isArray(columns) && columns.length > 0;

    const languageName = LANGUAGE_NAMES[language] ?? "English";
    const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.balanced;
    const expertiseInstruction = EXPERTISE_INSTRUCTIONS[expertise] ?? EXPERTISE_INSTRUCTIONS.intermediate;

    const personalizationBlock = `

Respond in ${languageName}, including the "answer" field and any chart "title" — but always keep JSON property names ("answer", "chart", "type", "title", "xKey", "yKey", "data") in English exactly as shown, never translated. ${toneInstruction} ${expertiseInstruction}`;

    const systemPrompt = isTabular
      ? `You are a data analyst. You are given a CSV dataset and a question about it in plain English.

Columns available: ${columns.join(", ")}

Respond ONLY with a single valid JSON object, no markdown fences, no preamble. Shape:
{
  "answer": "<a clear, concise answer to the question, referencing actual numbers from the data>",
  "chart": {
    "type": "bar" | "line",
    "title": "<short chart title>",
    "xKey": "<column name to use on the x-axis>",
    "yKey": "<column name to use on the y-axis>",
    "data": [ { "<xKey>": ..., "<yKey>": ... }, ... ]
  } | null
}

${CHART_SCHEMA_INSTRUCTION}

Only include a "chart" object if a chart would meaningfully help answer the question (e.g. trends, comparisons, totals by category). Otherwise set "chart" to null. Keep chart data to at most 20 points, aggregating if necessary.${personalizationBlock}`
      : `You are a document analyst. You are given the extracted text of a document (Word, PowerPoint, or PDF) and a question about it in plain English.

Respond ONLY with a single valid JSON object, no markdown fences, no preamble. Shape:
{
  "answer": "<a clear answer to the question, referencing specific details from the document>",
  "chart": {
    "type": "bar" | "line",
    "title": "<short chart title>",
    "xKey": "<a label field you invent, e.g. 'Month' or 'Category'>",
    "yKey": "<a numeric field you invent, e.g. 'Revenue'>",
    "data": [ { "<xKey>": ..., "<yKey>": ... }, ... ]
  } | null
}

${CHART_SCHEMA_INSTRUCTION}

Charts are rarely appropriate for a text document — only include a non-null "chart" object if the document text contains a small set of clearly comparable numeric values worth visualizing (at most 20 points). Otherwise always set "chart" to null.${personalizationBlock}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      `${isTabular ? "CSV data" : "Document text"}:\n${truncatedContent}\n\nQuestion: ${question}`
    );

    const rawText = result.response.text();
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed: AnalyzeResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { answer: rawText, chart: null };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Analyze error:", err);

    const message = err instanceof Error ? err.message : "";
    let userMessage = "Something went wrong while analyzing your data. Please try again.";
    let status = 500;
    let retryAt: string | undefined;

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      const resetTime = nextPacificMidnightUTC();
      retryAt = resetTime.toISOString();
      userMessage = "Rate limit reached — try again later.";
      status = 429;
    } else if (message.includes("403") || message.includes("401")) {
      userMessage = "We couldn't connect to our server. Please try again shortly.";
      status = 500;
      await alertAuthError(message);
    } else if (message.toLowerCase().includes("safety")) {
      userMessage = "That question couldn't be processed. Try rephrasing it.";
      status = 400;
    }

    return NextResponse.json({ error: userMessage, retryAt }, { status });
  }
}