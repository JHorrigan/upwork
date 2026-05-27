import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const body = await req.json();
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  const existing = row?.apiKeysJson ? JSON.parse(row.apiKeysJson) : {};

  const merged = { ...existing, ...body };
  db.update(settings)
    .set({
      apiKeysJson: JSON.stringify(merged),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(settings.id, 1))
    .run();

  return NextResponse.json({
    openai: !!merged.openai,
  });
}
