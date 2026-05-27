import type { Profile } from "@/lib/db/schema";

type RateContext = {
  profile: Profile;
  completedCount: number;
  statusSummary: string;
  jobTitle: string;
  jobDescription: string;
  budget: string | null;
  budgetType: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  clientInfo: string | null;
  proposalCount: number | null;
  experienceLevel: string | null;
  weeklyHours: string | null;
  projectLength: string | null;
  jobSkills: string[];
  profileSkillOverlap: string[];
  paymentType: string | null;
  milestoneCount: number;
  milestoneTotal: number | null;
};

export function buildRatePrompts(ctx: RateContext): {
  systemPrompt: string;
  userPrompt: string;
} {
  const skills: string[] = ctx.profile.skillsJson
    ? JSON.parse(ctx.profile.skillsJson)
    : [];

  const currency = ctx.profile.rateCurrency === "GBP" ? "GBP" : "USD";
  const symbol = currency === "GBP" ? "£" : "$";

  let phase: string;
  if (ctx.completedCount <= 2) {
    phase = `Phase 1: Building reputation (${ctx.completedCount} completed projects). Priority is winning reviews. Price at the LOW end of the client's budget. Avoid recommending rate increases -- the freelancer needs wins first.`;
  } else if (ctx.completedCount <= 7) {
    phase = `Phase 2: Growing (${ctx.completedCount} completed projects). The freelancer has some reviews now. Price at the MID range of the client's budget. Modest rate increases (5-10% every 6-12 months) are reasonable.`;
  } else {
    phase = `Phase 3: Established (${ctx.completedCount} completed projects). The freelancer has a solid track record. Price at or ABOVE market rate. Rate increases every 3-6 months are justified.`;
  }

  const systemPrompt = `You are a freelance rate advisor for Upwork. Analyze a job posting and recommend what hourly rate the freelancer should bid.

FREELANCER PROFILE:
Name: ${ctx.profile.fullName ?? ctx.profile.name}
Title: ${ctx.profile.title}
Current listed rate: ${symbol}${ctx.profile.hourlyRate}/hr
Skills: ${skills.join(", ")}
Currency: ${currency}

FREELANCER JOURNEY:
${phase}
Job history: ${ctx.statusSummary}

UPWORK FEE STRUCTURE:
Upwork charges a 10% service fee on freelancer earnings. If the freelancer bids ${symbol}30/hr, they receive ${symbol}27/hr after the fee. Always calculate and show the net amount.

RATE INCREASE SCHEDULING:
Upwork allows freelancers to schedule automatic rate increases on contracts. Options: every 3 months, every 6 months, every 12 months, or never. Increase amounts: 5%, 10%, 50%, or a custom value. Recommend whether to include a rate increase and what settings to use, based on the freelancer's phase and the job context.

INSTRUCTIONS:
Analyze the job and return your recommendation as JSON with this exact structure:
{
  "suggestedRate": <number>,
  "rateRange": { "low": <number>, "high": <number> },
  "currency": "${currency}",
  "upworkFee": <number based on suggestedRate>,
  "youReceive": <number after 10% fee>,
  "justification": "<2-3 sentences explaining why this rate>",
  "rateIncrease": {
    "recommended": <boolean>,
    "frequency": "<never | 3 months | 6 months | 12 months>",
    "percent": <number or null>,
    "reasoning": "<1-2 sentences>"
  },
  "strategyPhase": "<Phase 1/2/3 label>"
}

Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

  const parts: string[] = [];
  parts.push(`Job Title: ${ctx.jobTitle}`);
  if (ctx.budgetMin != null && ctx.budgetMax != null) {
    if (ctx.budgetMin === ctx.budgetMax) {
      parts.push(`Client Budget: ${symbol}${ctx.budgetMin} (${ctx.budgetType ?? "fixed"})`);
    } else {
      parts.push(`Client Budget: ${symbol}${ctx.budgetMin} - ${symbol}${ctx.budgetMax}/hr (${ctx.budgetType ?? "hourly"})`);
    }
  } else if (ctx.budget) {
    parts.push(`Client Budget: ${ctx.budget} (${ctx.budgetType ?? "unknown type"})`);
  }
  if (ctx.experienceLevel) parts.push(`Experience Level: ${ctx.experienceLevel}`);
  if (ctx.weeklyHours) parts.push(`Weekly Hours: ${ctx.weeklyHours}`);
  if (ctx.projectLength) parts.push(`Project Length: ${ctx.projectLength}`);
  if (ctx.clientInfo) parts.push(`Client Info: ${ctx.clientInfo}`);
  if (ctx.proposalCount != null) parts.push(`Existing Proposals: ~${ctx.proposalCount}`);
  if (ctx.paymentType === "milestones") {
    parts.push(`Payment: By milestones (${ctx.milestoneCount} milestones${ctx.milestoneTotal != null ? `, total ${symbol}${ctx.milestoneTotal.toFixed(2)}` : ""})`);
  } else if (ctx.paymentType === "project") {
    parts.push(`Payment: By project (single payment on completion)`);
  }
  if (ctx.jobSkills.length > 0) parts.push(`Required Skills: ${ctx.jobSkills.join(", ")}`);
  if (ctx.profileSkillOverlap.length > 0) {
    parts.push(`Freelancer Matching Skills: ${ctx.profileSkillOverlap.join(", ")} (${ctx.profileSkillOverlap.length}/${ctx.jobSkills.length} match)`);
  }
  parts.push(`\nJob Description:\n${ctx.jobDescription}`);

  const userPrompt = parts.join("\n");

  return { systemPrompt, userPrompt };
}
