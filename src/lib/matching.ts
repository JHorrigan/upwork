import type { PortfolioProject } from "@/lib/db/schema";

export type SkillMatch = {
  matched: string[];
  unmatched: string[];
  score: number;
};

export function matchSkills(
  jobSkills: string[],
  profileSkills: string[],
): SkillMatch {
  if (jobSkills.length === 0) return { matched: [], unmatched: [], score: 0 };

  const profileLower = new Set(profileSkills.map((s) => s.toLowerCase()));
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const skill of jobSkills) {
    if (profileLower.has(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      unmatched.push(skill);
    }
  }

  return {
    matched,
    unmatched,
    score: matched.length / jobSkills.length,
  };
}

export type PortfolioMatch = {
  index: number;
  project: PortfolioProject;
  skillOverlap: string[];
  score: number;
};

export function rankPortfolioProjects(
  jobSkills: string[],
  jobDescription: string,
  portfolio: PortfolioProject[],
): PortfolioMatch[] {
  if (portfolio.length === 0) return [];

  const jobSkillsLower = new Set(jobSkills.map((s) => s.toLowerCase()));
  const descWords = new Set(
    jobDescription.toLowerCase().split(/\W+/).filter((w) => w.length > 3),
  );

  return portfolio
    .map((project, index) => {
      const techLower = (project.technologies ?? []).map((t) => t.toLowerCase());
      const skillOverlap = techLower.filter((t) => jobSkillsLower.has(t));
      const skillScore = jobSkillsLower.size > 0
        ? skillOverlap.length / jobSkillsLower.size
        : 0;

      const projectWords = new Set(
        `${project.title} ${project.description}`.toLowerCase().split(/\W+/),
      );
      let keywordHits = 0;
      for (const word of descWords) {
        if (projectWords.has(word)) keywordHits++;
      }
      const keywordScore = descWords.size > 0
        ? keywordHits / descWords.size
        : 0;

      return {
        index,
        project,
        skillOverlap: skillOverlap.map(
          (s) => (project.technologies ?? []).find((t) => t.toLowerCase() === s) ?? s,
        ),
        score: skillScore * 0.7 + keywordScore * 0.3,
      };
    })
    .sort((a, b) => b.score - a.score);
}
