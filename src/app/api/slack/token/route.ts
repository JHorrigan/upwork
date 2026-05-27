import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const { token } = await req.json();

  db.update(settings)
    .set({
      slackBotToken: token || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(settings.id, 1))
    .run();

  return NextResponse.json({ configured: !!token });
}
