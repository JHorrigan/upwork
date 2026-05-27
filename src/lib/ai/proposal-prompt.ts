import type { Profile, PortfolioProject } from "@/lib/db/schema";

export function buildProposalPrompts(
  profile: Profile,
  jobDescription: string,
  jobTitle?: string,
  templateContent?: string,
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

  const systemPrompt = `You are a freelance proposal writer for Upwork. Write a compelling, personalized proposal for a job posting.

FREELANCER PROFILE:
Name: ${profile.fullName ?? profile.name}
Title: ${profile.title}
Rate: ${profile.rateCurrency === "GBP" ? "£" : "$"}${profile.hourlyRate}/hr
Skills: ${skills.join(", ")}
Overview: ${profile.overview}

KEY PORTFOLIO PROJECTS:
${portfolioSummary}

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
    templateContent
      ? `

REFERENCE TEMPLATE:
The freelancer has provided a template below as a starting point. Use its tone, structure, and style as a guide, but customize fully for this specific job. Do not copy it verbatim.

${templateContent}`
      : ""
  }`;

  const titleLine = jobTitle ? `Job Title: ${jobTitle}\n` : "";
  const userPrompt = `${titleLine}Job Description:\n${jobDescription}`;

  return { systemPrompt, userPrompt };
}
