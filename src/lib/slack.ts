import { db } from "@/lib/db/client";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function sendSlackNotification(text: string) {
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!row?.slackEnabled || !row.slackBotToken || !row.slackChannelId) return;

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${row.slackBotToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: row.slackChannelId,
      text,
    }),
  });
}
