import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profile, settings, jobs, proposalTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generate } from "@/lib/ai/providers";
import { buildProposalPrompts } from "@/lib/ai/proposal-prompt";
import type { ProposalContext } from "@/lib/ai/proposal-prompt";
import type { ModelAssignments, ApiKeys, Job } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const { jobId, jobDescription, jobTitle, templateId } = body;

  let description = jobDescription;
  let title = jobTitle;
  let bidRate: number | null = null;
  let proposalCtx: ProposalContext | undefined;

  if (jobId) {
    const job = db
      .select()
      .from(jobs)
      .where(eq(jobs.id, Number(jobId)))
      .get();
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    description = job.description;
    title = title ?? job.title;
    bidRate = job.bidRate;
    proposalCtx = {
      experienceLevel: job.experienceLevel,
      weeklyHours: job.weeklyHours,
      projectLength: job.projectLength,
      jobSkills: job.skillsJson ? JSON.parse(job.skillsJson) : [],
      highlightedProjectIndex: job.highlightedProjectIndex,
      paymentType: job.paymentType,
      milestones: job.milestonesJson ? JSON.parse(job.milestonesJson) : [],
    };
  }

  if (!description) {
    return NextResponse.json(
      { error: "No job description provided" },
      { status: 400 },
    );
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
  const keys: ApiKeys = sett?.apiKeysJson
    ? JSON.parse(sett.apiKeysJson)
    : {};

  const modelConfig = assignments.proposalDrafting;
  if (!modelConfig) {
    return NextResponse.json(
      { error: "No AI model configured for proposal drafting. Go to Settings to configure one." },
      { status: 400 },
    );
  }

  let templateContent: string | undefined;
  if (templateId) {
    const tmpl = db
      .select()
      .from(proposalTemplates)
      .where(eq(proposalTemplates.id, Number(templateId)))
      .get();
    templateContent = tmpl?.content;
  }

  const { systemPrompt, userPrompt } = buildProposalPrompts(
    prof,
    description,
    title,
    templateContent,
    bidRate,
    proposalCtx,
  );

  const proposal = await generate(
    {
      provider: modelConfig.provider,
      model: modelConfig.model,
      systemPrompt,
      userPrompt,
    },
    sett?.ollamaUrl ?? "http://localhost:11434",
    keys.openai,
  );

  return NextResponse.json({
    proposal,
    model: modelConfig,
  });
}
