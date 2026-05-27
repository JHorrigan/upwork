import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profile, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { matchSkills, rankPortfolioProjects } from "@/lib/matching";
import type { PortfolioProject } from "@/lib/db/schema";

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

  const jobSkills: string[] = job.skillsJson
    ? JSON.parse(job.skillsJson)
    : [];
  const profileSkills: string[] = prof.skillsJson
    ? JSON.parse(prof.skillsJson)
    : [];
  const portfolio: PortfolioProject[] = prof.portfolioJson
    ? JSON.parse(prof.portfolioJson)
    : [];

  const skills = matchSkills(jobSkills, profileSkills);
  const ranked = rankPortfolioProjects(
    jobSkills,
    job.description ?? "",
    portfolio,
  );

  return NextResponse.json({
    skills,
    portfolio: ranked.slice(0, 3),
    recommended: ranked.length > 0 ? ranked[0] : null,
  });
}
