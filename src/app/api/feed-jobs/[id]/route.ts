import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { feedJobs, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  db.update(feedJobs)
    .set(body)
    .where(eq(feedJobs.id, Number(id)))
    .run();

  const updated = db
    .select()
    .from(feedJobs)
    .where(eq(feedJobs.id, Number(id)))
    .get();

  return NextResponse.json(updated);
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const feedJob = db
    .select()
    .from(feedJobs)
    .where(eq(feedJobs.id, Number(id)))
    .get();

  if (!feedJob) {
    return NextResponse.json({ error: "Feed job not found" }, { status: 404 });
  }

  if (feedJob.promotedJobId) {
    return NextResponse.json({ error: "Already tracked", jobId: feedJob.promotedJobId }, { status: 409 });
  }

  const now = new Date().toISOString();
  const budgetType = feedJob.jobType?.toLowerCase().includes("hourly")
    ? "hourly"
    : "fixed";

  const clientParts = [
    feedJob.clientRating ? `Rating: ${feedJob.clientRating}` : null,
    feedJob.clientTotalSpent ? `Spent: ${feedJob.clientTotalSpent}` : null,
    feedJob.paymentVerified ? "Payment verified" : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const newJob = db
    .insert(jobs)
    .values({
      title: feedJob.title,
      upworkUrl: feedJob.url,
      budget: feedJob.budget,
      budgetType,
      description: feedJob.description,
      clientInfo: clientParts || null,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  db.update(feedJobs)
    .set({ promotedJobId: newJob.id })
    .where(eq(feedJobs.id, Number(id)))
    .run();

  return NextResponse.json(newJob, { status: 201 });
}
