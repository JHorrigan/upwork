import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { feedJobs, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = db
    .select()
    .from(feedJobs)
    .where(eq(feedJobs.id, Number(id)))
    .get();
  if (!row) {
    return NextResponse.json({ error: "Feed job not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

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

function parseBudgetRange(
  budget: string | null,
  jobType: string | null,
): { budgetMin: number | null; budgetMax: number | null; budgetDisplay: string | null } {
  const hourlyMatch = jobType?.match(
    /Hourly:\s*\$([0-9,.]+)\s*-\s*\$([0-9,.]+)/,
  );
  if (hourlyMatch) {
    return {
      budgetMin: parseFloat(hourlyMatch[1].replace(/,/g, "")),
      budgetMax: parseFloat(hourlyMatch[2].replace(/,/g, "")),
      budgetDisplay: `$${hourlyMatch[1]} - $${hourlyMatch[2]}/hr`,
    };
  }
  const fixedMatch = budget?.match(/\$([0-9,.]+)/);
  if (fixedMatch) {
    const amount = parseFloat(fixedMatch[1].replace(/,/g, ""));
    return { budgetMin: amount, budgetMax: amount, budgetDisplay: budget };
  }
  return { budgetMin: null, budgetMax: null, budgetDisplay: budget ?? null };
}

function parseProposalCount(proposals: string | null): number | null {
  if (!proposals) return null;
  if (proposals.includes("Fewer than 5")) return 3;
  if (proposals.includes("50+")) return 50;
  const rangeMatch = proposals.match(/(\d+)\s*to\s*(\d+)/);
  if (rangeMatch) {
    return Math.round((Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2);
  }
  return null;
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
  const isHourly = feedJob.jobType?.toLowerCase().includes("hourly");
  const budgetType = isHourly ? "hourly" : "fixed";
  const { budgetMin, budgetMax, budgetDisplay } = parseBudgetRange(
    feedJob.budget,
    feedJob.jobType,
  );

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
      budget: budgetDisplay,
      budgetType,
      budgetMin,
      budgetMax,
      description: feedJob.description,
      clientInfo: clientParts || null,
      experienceLevel: feedJob.experienceLevel,
      skillsJson: feedJob.skillsJson,
      postedAt: feedJob.postedAt,
      proposalCount: parseProposalCount(feedJob.proposals),
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
