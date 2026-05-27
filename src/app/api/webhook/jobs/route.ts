import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { feedJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSlackNotification } from "@/lib/slack";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

type WebhookJob = {
  uid: string;
  title: string;
  url?: string;
  description?: string;
  jobType?: string;
  budget?: string;
  experienceLevel?: string;
  skills?: string[];
  paymentVerified?: boolean;
  clientRating?: string;
  clientTotalSpent?: string;
  proposals?: string;
  postedAtIso?: string;
  scrapedAt?: string;
};

type WebhookPayload = {
  status: string;
  targetName?: string;
  jobs?: WebhookJob[];
  reason?: string;
  message?: string;
  timestamp?: string;
};

export async function POST(req: Request) {
  const body: WebhookPayload = await req.json();

  if (body.status !== "success") {
    const reason = body.reason ?? body.status;
    sendSlackNotification(
      `Upwork scraper issue: ${reason} -- ${body.message ?? "Check your browser"}`,
    );
    return NextResponse.json({ status: "warning_forwarded", reason }, { headers: corsHeaders });
  }

  const incoming = body.jobs ?? [];
  if (incoming.length === 0) {
    return NextResponse.json({ added: 0, skipped: 0 }, { headers: corsHeaders });
  }

  const now = new Date().toISOString();
  let added = 0;
  let updated = 0;

  const seenUids = incoming.map((j) => j.uid);

  for (const job of incoming) {
    const existing = db
      .select()
      .from(feedJobs)
      .where(eq(feedJobs.uid, job.uid))
      .get();

    if (existing) {
      db.update(feedJobs)
        .set({
          proposals: job.proposals ?? existing.proposals,
          clientRating: job.clientRating ?? existing.clientRating,
          clientTotalSpent: job.clientTotalSpent ?? existing.clientTotalSpent,
          scrapedAt: job.scrapedAt ?? existing.scrapedAt,
          lastSeenAt: now,
        })
        .where(eq(feedJobs.id, existing.id))
        .run();
      updated++;
      continue;
    }

    db.insert(feedJobs)
      .values({
        uid: job.uid,
        title: job.title,
        url: job.url ?? null,
        description: job.description ?? null,
        jobType: job.jobType ?? null,
        budget: job.budget ?? null,
        experienceLevel: job.experienceLevel ?? null,
        skillsJson: job.skills ? JSON.stringify(job.skills) : null,
        paymentVerified: job.paymentVerified ? 1 : 0,
        clientRating: job.clientRating ?? null,
        clientTotalSpent: job.clientTotalSpent ?? null,
        proposals: job.proposals ?? null,
        postedAt: job.postedAtIso ?? null,
        scrapedAt: job.scrapedAt ?? null,
        targetName: body.targetName ?? null,
        lastSeenAt: now,
        createdAt: now,
      })
      .run();

    added++;

    const budget = job.budget ? ` | ${job.budget}` : "";
    const skills = job.skills?.slice(0, 3).join(", ") ?? "";
    const skillsLine = skills ? ` | ${skills}` : "";
    sendSlackNotification(
      `New Upwork job: ${job.title}${budget}${skillsLine}\n${job.url ?? ""}`,
    );
  }

  return NextResponse.json({ added, updated }, { headers: corsHeaders });
}
