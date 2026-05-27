import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const JSON_FIELDS = ["modelAssignmentsJson", "apiKeysJson"] as const;

function getOrCreateSettings() {
  let row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row) {
    db.insert(settings)
      .values({ updatedAt: new Date().toISOString() })
      .run();
    row = db.select().from(settings).where(eq(settings.id, 1)).get()!;
  }
  return row;
}

function stripSecrets(row: typeof settings.$inferSelect) {
  const keys = row.apiKeysJson ? JSON.parse(row.apiKeysJson) : {};
  const { apiKeysJson: _, slackBotToken: __, ...rest } = row;
  return {
    ...rest,
    hasApiKeys: {
      openai: !!keys.openai,
    },
    hasSlack: {
      token: !!row.slackBotToken,
      channel: !!row.slackChannelId,
      enabled: !!row.slackEnabled,
    },
  };
}

export async function GET() {
  const row = getOrCreateSettings();
  return NextResponse.json(stripSecrets(row));
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id: _, apiKeysJson: __, slackBotToken: ___, ...updates } = body;
  updates.updatedAt = new Date().toISOString();

  for (const field of JSON_FIELDS) {
    if (field in updates && typeof updates[field] !== "string") {
      updates[field] = JSON.stringify(updates[field]);
    }
  }

  db.update(settings).set(updates).where(eq(settings.id, 1)).run();
  const updated = getOrCreateSettings();
  return NextResponse.json(stripSecrets(updated));
}
