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

// --- Settings ---

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  ollamaUrl: text("ollama_url").default("http://localhost:11434"),
  modelAssignmentsJson: text("model_assignments_json"),
  apiKeysJson: text("api_keys_json"),
  slackBotToken: text("slack_bot_token"),
  slackChannelId: text("slack_channel_id"),
  slackEnabled: integer("slack_enabled").default(0),
  updatedAt: text("updated_at").notNull(),
});

export type Settings = typeof settings.$inferSelect;

export type ModelAssignment = {
  provider: "ollama" | "openai";
  model: string;
};

export type ModelAssignments = {
  proposalDrafting?: ModelAssignment;
};

export type ApiKeys = {
  openai?: string;
};

// --- Jobs ---

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  upworkUrl: text("upwork_url"),
  budget: text("budget"),
  budgetType: text("budget_type").default("fixed"),
  description: text("description"),
  clientInfo: text("client_info"),
  proposalCount: integer("proposal_count"),
  connectsCost: integer("connects_cost"),
  deadline: text("deadline"),
  notes: text("notes"),
  status: text("status").default("draft").notNull(),
  proposalText: text("proposal_text"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Job = typeof jobs.$inferSelect;
