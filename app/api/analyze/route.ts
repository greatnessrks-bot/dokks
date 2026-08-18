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
    const { content, columns, kind, question } = await req.json();

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

    const systemPrompt = isTabular
      ? `You are a data analyst. You are given a CSV dataset and a question about it in plain English.

Columns available: ${columns.join(", ")}

Respond ONLY with a single valid JSON object, no markdown fences, no preamble. Shape:
{
  "answer": "<a clear, concise plain-English answer to the question, referencing actual numbers from the data>",
  "chart": {
    "type": "bar" | "line",
    "title": "<short chart title>",
    "xKey": "<column name to use on the x-axis>",
    "yKey": "<column name to use on the y-axis>",
    "data": [ { "<xKey>": ..., "<yKey>": ... }, ... ]
  } | null
}

Only include a "chart" object if a chart would meaningfully help answer the question (e.g. trends, comparisons, totals by category). Otherwise set "chart" to null. Keep chart data to at most 20 points, aggregating if necessary.`
      : `You are a document analyst. You are given the extracted text of a document (Word, PowerPoint, or PDF) and a question about it in plain English.

Respond ONLY with a single valid JSON object, no markdown fences, no preamble. Shape:
{
  "answer": "<a clear, concise plain-English answer to the question, referencing specific details from the document>",
  "chart": null
}

Charts are rarely appropriate for a text document — only include a non-null "chart" object if the document text itself contains a small set of clearly comparable numeric values worth visualizing (at most 20 points, type "bar" or "line"). Otherwise always set "chart" to null.`;

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