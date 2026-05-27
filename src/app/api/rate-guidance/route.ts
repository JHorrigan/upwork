import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profile, settings, jobs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { generate } from "@/lib/ai/providers";
import { buildRatePrompts } from "@/lib/ai/rate-prompt";
import type { ModelAssignments, ApiKeys } from "@/lib/db/schema";

export async function POST(req: Request) {
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(jobId)))
    .get();
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const prof = db.select().from(profile).where(eq(profile.id, 1)).get();
  if (!prof) {
    return NextResponse.json(
      { error: "Profile not configured" },
      { status: 400 },
    );
  }

  const sett = db.select().from(settings).where(eq(settings.id, 1)).get();
  const assignments: ModelAssignments = sett?.modelAssignmentsJson
    ? JSON.parse(sett.modelAssignmentsJson)
    : {};
  const keys: ApiKeys = sett?.apiKeysJson ? JSON.parse(sett.apiKeysJson) : {};

  const modelConfig = assignments.proposalDrafting;
  if (!modelConfig) {
    return NextResponse.json(
      {
        error:
          "No AI model configured for proposal drafting. Go to Settings to configure one.",
      },
      { status: 400 },
    );
  }

  const completedRow = db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.status, "completed"))
    .get();
  const completedCount = completedRow?.count ?? 0;

  const statusCounts = db
    .select({
      status: jobs.status,
      count: sql<number>`count(*)`,
    })
    .from(jobs)
    .groupBy(jobs.status)
    .all();
  const statusSummary = statusCounts
    .map((r) => `${r.count} ${r.status}`)
    .join(", ");

  const { systemPrompt, userPrompt } = buildRatePrompts({
    profile: prof,
    completedCount,
    statusSummary,
    jobTitle: job.title,
    jobDescription: job.description ?? "",
    budget: job.budget,
    budgetType: job.budgetType,
    clientInfo: job.clientInfo,
    proposalCount: job.proposalCount,
  });

  const raw = await generate(
    {
      provider: modelConfig.provider,
      model: modelConfig.model,
      systemPrompt,
      userPrompt,
    },
    sett?.ollamaUrl ?? "http://localhost:11434",
    keys.openai,
  );

  let guidance;
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    guidance = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw },
      { status: 502 },
    );
  }

  return NextResponse.json({ guidance, model: modelConfig });
}
