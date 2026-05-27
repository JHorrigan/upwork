import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row?.slackBotToken || !row?.slackChannelId) {
    return NextResponse.json(
      { error: "Slack bot token and channel ID are both required." },
      { status: 400 },
    );
  }

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${row.slackBotToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: row.slackChannelId,
      text: "Upwork Freelance Manager -- test notification. Connection is working.",
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    return NextResponse.json(
      { error: data.error ?? "Unknown Slack API error" },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
