import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return message.includes("503") || message.toLowerCase().includes("high demand") || message.toLowerCase().includes("overloaded");
}

async function generateContentWithRetry(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  parts: Parameters<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>[0]
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await generateContentWithRetry(model, [
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      {
        text: "Transcribe all readable text from this image exactly as it appears, preserving structure (paragraphs, lists, and tables as plain text). Do not add commentary, summaries, or anything not present in the image. If the image contains no readable text, respond with exactly: NO_TEXT_FOUND",
      },
    ]);

    const text = result.response.text().trim();

    if (!text || text === "NO_TEXT_FOUND") {
      return NextResponse.json(
        { error: "No readable text found in that image." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("OCR error:", err);

    const message = err instanceof Error ? err.message : "";
    let userMessage = "Something went wrong while reading the image. Please try again.";
    let status = 500;

    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      userMessage = "Rate limit reached — try again later.";
      status = 429;
    } else if (message.includes("503") || message.toLowerCase().includes("high demand") || message.toLowerCase().includes("overloaded")) {
      userMessage = "Our AI service is experiencing high demand right now. Please try again in a few minutes.";
      status = 503;
    } else if (message.includes("403") || message.includes("401")) {
      userMessage = "We couldn't connect to our server. Please try again shortly.";
      status = 500;
    }

    return NextResponse.json({ error: userMessage }, { status });
  }
}