import { NextRequest, NextResponse } from "next/server";
import { resolveMx } from "dns/promises";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const basicShapeOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!basicShapeOk) {
    return NextResponse.json({ valid: false });
  }

  const domain = email.split("@")[1];

  try {
    const records = await resolveMx(domain);
    return NextResponse.json({ valid: records.length > 0 });
  } catch {
    return NextResponse.json({ valid: false });
  }
}