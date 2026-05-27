import type { Profile, PortfolioProject } from "@/lib/db/schema";
import type { Job } from "@/lib/db/schema";
import { matchSkills, rankPortfolioProjects } from "@/lib/matching";

export type ProposalContext = {
  experienceLevel?: string | null;
  weeklyHours?: string | null;
  projectLength?: string | null;
  jobSkills?: string[];
  highlightedProjectIndex?: number | null;
  paymentType?: string | null;
  milestones?: { description: string; dueDate: string; amount: number }[];
};

export function buildProposalPrompts(
  profile: Profile,
  jobDescription: string,
  jobTitle?: string,
  templateContent?: string,
  bidRate?: number | null,
  ctx?: ProposalContext,
): { systemPrompt: string; userPrompt: string } {
  const skills: string[] = profile.skillsJson
    ? JSON.parse(profile.skillsJson)
    : [];
  const portfolio: PortfolioProject[] = profile.portfolioJson
    ? JSON.parse(profile.portfolioJson)
    : [];

  const portfolioSummary = portfolio
    .map((p) => `- ${p.title}: ${p.description}`)
    .join("\n");

  const jobSkills = ctx?.jobSkills ?? [];
  const skillMatch = jobSkills.length > 0
    ? matchSkills(jobSkills, skills)
    : null;

  let highlightedProject: PortfolioProject | undefined;
  if (ctx?.highlightedProjectIndex != null && portfolio[ctx.highlightedProjectIndex]) {
    highlightedProject = portfolio[ctx.highlightedProjectIndex];
  } else if (jobSkills.length > 0 && portfolio.length > 0) {
    const ranked = rankPortfolioProjects(jobSkills, jobDescription, portfolio);
    if (ranked.length > 0 && ranked[0].score > 0) {
      highlightedProject = ranked[0].project;
    }
  }

  const systemPrompt = `You are a freelance proposal writer for Upwork. Write a compelling, personalized proposal for a job posting.

FREELANCER PROFILE:
Name: ${profile.fullName ?? profile.name}
Title: ${profile.title}
Rate: ${profile.rateCurrency === "GBP" ? "£" : "$"}${profile.hourlyRate}/hr
Skills: ${skills.join(", ")}
Overview: ${profile.overview}

KEY PORTFOLIO PROJECTS:
${portfolioSummary}${
    highlightedProject
      ? `

HIGHLIGHTED PROJECT (feature this in the proposal -- it's the best match for this job):
${highlightedProject.title}: ${highlightedProject.description}${
          highlightedProject.technologies?.length
            ? ` [${highlightedProject.technologies.join(", ")}]`
            : ""
        }`
      : ""
  }${
    skillMatch && skillMatch.matched.length > 0
      ? `

SKILL MATCH: ${skillMatch.matched.join(", ")} (${Math.round(skillMatch.score * 100)}% overlap with job requirements).${
          skillMatch.unmatched.length > 0
            ? ` Job also asks for: ${skillMatch.unmatched.join(", ")} -- do not claim expertise you don't have, but you can express willingness to learn or adapt.`
            : ""
        }`
      : ""
  }

PROPOSAL STRUCTURE (follow this exactly):
1. Hook (1-2 sentences): Reference something specific from the job post. Show you read it carefully.
2. Relevance (2-3 sentences): Connect your specific experience directly to what they need.
3. Approach (2-3 sentences): Briefly outline how you'd tackle this project. Be specific, not generic.
4. Social proof / differentiator (1-2 sentences): Reference a relevant portfolio project or unique technical angle.
5. Call to action (1 sentence): Invite them to discuss. Keep it low-pressure.

RULES:
- Keep it 150-250 words total.
- Be specific -- reference the job description directly, don't be generic.
- Professional but conversational tone. Not formal or stiff.
- Never start with "Dear Sir/Madam" or "I am a highly skilled professional."
- Never list every technology you know -- only mention what's relevant to this job.
- Do not use emojis.
- Write the proposal text only -- no headers, no labels, no section markers.${
    bidRate
      ? `
- The freelancer is bidding at ${profile.rateCurrency === "GBP" ? "£" : "$"}${bidRate}/hr for this job. You may reference this rate naturally if it helps the proposal (e.g. "at my rate of..."), but do not force it in.`
      : ""
  }${
    templateContent
      ? `

REFERENCE TEMPLATE:
The freelancer has provided a template below as a starting point. Use its tone, structure, and style as a guide, but customize fully for this specific job. Do not copy it verbatim.

${templateContent}`
      : ""
  }`;

  const userParts: string[] = [];
  if (jobTitle) userParts.push(`Job Title: ${jobTitle}`);
  if (ctx?.experienceLevel) userParts.push(`Experience Level: ${ctx.experienceLevel}`);
  if (ctx?.weeklyHours) userParts.push(`Weekly Hours: ${ctx.weeklyHours}`);
  if (ctx?.projectLength) userParts.push(`Project Length: ${ctx.projectLength}`);
  if (jobSkills.length > 0) userParts.push(`Required Skills: ${jobSkills.join(", ")}`);
  if (ctx?.paymentType === "milestones" && ctx.milestones && ctx.milestones.length > 0) {
    const msLines = ctx.milestones
      .map((m) => `  - ${m.description || "Milestone"}${m.dueDate ? ` (due ${m.dueDate})` : ""}: $${m.amount.toFixed(2)}`)
      .join("\n");
    userParts.push(`Payment: By milestones\n${msLines}`);
  } else if (ctx?.paymentType === "project") {
    userParts.push(`Payment: Single payment on project completion`);
  }
  userParts.push(`\nJob Description:\n${jobDescription}`);
  const userPrompt = userParts.join("\n");

  return { systemPrompt, userPrompt };
}
