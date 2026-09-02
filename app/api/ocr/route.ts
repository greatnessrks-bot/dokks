import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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

    const result = await model.generateContent([
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
    } else if (message.includes("403") || message.includes("401")) {
      userMessage = "We couldn't connect to our server. Please try again shortly.";
      status = 500;
    }

    return NextResponse.json({ error: userMessage }, { status });
  }
}