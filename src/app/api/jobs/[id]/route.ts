import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { feedJobs, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSlackNotification } from "@/lib/slack";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(id)))
    .get();
  if (!row) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { id: _, createdAt: __, ...updates } = body;
  const now = new Date().toISOString();
  updates.updatedAt = now;

  const before = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(id)))
    .get();

  if (updates.status && before) {
    if (updates.status === "submitted" && before.status !== "submitted") {
      updates.submittedAt = now;
    }
    if (updates.status === "won" && before.status !== "won") {
      updates.wonAt = now;
    }
    if (updates.status === "completed" && before.status !== "completed") {
      updates.completedAt = now;
    }
  }

  db.update(jobs)
    .set(updates)
    .where(eq(jobs.id, Number(id)))
    .run();
  const updated = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(id)))
    .get();

  if (before && updated && updates.status && before.status !== updated.status) {
    sendSlackNotification(
      `Job status changed: ${updated.title} -- ${before.status} -> ${updated.status}`,
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const jobId = Number(id);
  db.update(feedJobs)
    .set({ promotedJobId: null })
    .where(eq(feedJobs.promotedJobId, jobId))
    .run();
  db.delete(jobs)
    .where(eq(jobs.id, jobId))
    .run();
  return NextResponse.json({ ok: true });
}
