import { createClient } from "@/lib/supabase/client";

export function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export async function uploadChatImage(
  userId: string,
  chatId: string,
  base64: string,
  mimeType: string
): Promise<string | null> {
  const supabase = createClient();

  const { data: sessionCheck } = await supabase.auth.getSession();
  console.log("Session at upload time:", sessionCheck.session?.user?.id, "| userId param:", userId);

  const ext = mimeType.split("/")[1]?.split("+")[0] || "jpg";
  const path = `${userId}/${chatId}.${ext}`;

  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });

  const { error } = await supabase.storage
    .from("chat-images")
    .upload(path, blob, { upsert: true, contentType: mimeType });

  if (error) {
    console.error("Failed to upload chat image:", error);
    return null;
  }

  const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
  return data.publicUrl;
}