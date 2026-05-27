import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listAllModels, listOllamaModels } from "@/lib/ai/providers";

export async function GET() {
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  const ollamaUrl = row?.ollamaUrl ?? "http://localhost:11434";
  const keys = row?.apiKeysJson ? JSON.parse(row.apiKeysJson) : {};

  const ollamaTest = await listOllamaModels(ollamaUrl);
  const models = await listAllModels(ollamaUrl, keys.openai);

  return NextResponse.json({
    models,
    status: {
      ollama: { connected: ollamaTest.length > 0, url: ollamaUrl },
      openai: { configured: !!keys.openai },
    },
  });
}
