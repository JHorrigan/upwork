import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull(),
  fullName: text("full_name"),
  title: text("title").notNull(),
  upworkUrl: text("upwork_url"),
  overview: text("overview").notNull(),
  hourlyRate: real("hourly_rate"),
  rateCurrency: text("rate_currency").default("USD"),
  availability: text("availability"),
  location: text("location"),
  timezone: text("timezone"),
  skillsJson: text("skills_json"),
  portfolioJson: text("portfolio_json"),
  employmentJson: text("employment_json"),
  educationJson: text("education_json"),
  languagesJson: text("languages_json"),
  updatedAt: text("updated_at").notNull(),
});

export type Profile = typeof profile.$inferSelect;

export type PortfolioProject = {
  title: string;
  description: string;
  technologies?: string[];
  url?: string;
};

export type Employment = {
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  description?: string;
};

export type Education = {
  degree: string;
  institution: string;
  year?: string;
};

export type Language = {
  language: string;
  proficiency: string;
};
