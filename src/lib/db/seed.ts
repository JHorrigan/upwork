import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { profile } from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

const existing = db.select().from(profile).get();
if (existing) {
  console.log("Profile already exists, skipping seed.");
  sqlite.close();
  process.exit(0);
}

db.insert(profile)
  .values({
    name: "James H.",
    fullName: "James Horrigan",
    title: "AI Automation Specialist - LLM APIs, n8n, Python, React, AWS",
    upworkUrl: "https://www.upwork.com/freelancers/jameshorrigan",
    overview: `I am an AI automation specialist who helps clients build full-stack production-grade agentic automation workflows and AI powered applications. I am experienced in the use of LLM APIs, n8n, agentic RAG and vector embedding/search, Python, AWS, Next.js, React, Typescript & Tailwind.

Projects I have completed include a hiring automation solution to reduce application sifting work for hiring teams on enterprise-level ATS systems, a live call transcript application for agents in a debt management contact centre delivering RAG-powered response suggestions and live call sentiment analysis, and a software agency platform to manage client on-boarding and deliver automated AI audits on client bottleneck processes.

I can fully manage your project from the start, achieving all required deliverables. I am responsive, and will keep clear communication flowing. Outside of my core skills I have worked with many more, and I am adaptable to the needs of your project.

If you have a project in mind, please drop me a message. Let's build something great together.`,
    hourlyRate: 40.0,
    rateCurrency: "USD",
    availability: "30+ hrs/week",
    location: "Ormskirk, UK",
    timezone: "Europe/London",
    skillsJson: JSON.stringify([
      "Python",
      "React",
      "Amazon Web Services",
      "Django",
      "Flask",
      "JavaScript",
      "TypeScript",
      "Full-Stack Development",
      "Web Development",
      "Software Development",
      "Generative AI",
      "Generative AI Prompt Engineering",
      "Clear Communicator",
      "Accountable for Outcomes",
    ]),
    portfolioJson: JSON.stringify([
      {
        title: "CiiVSOFT AI-Powered Hiring Automation",
        description:
          "A hiring automation solution to reduce application sifting work for hiring teams on enterprise-level ATS systems. Highly scalable Python architecture capable of concurrent data ingestion from enterprise applicant tracking systems with real-time business logic application.",
        technologies: [
          "Python",
          "Django",
          "AWS",
          "Docker",
          "Celery",
          "Spacy",
          "Flask",
        ],
      },
      {
        title: "Live Call Transcript Application",
        description:
          "A live call transcript application for agents in a debt management contact centre delivering RAG-powered response suggestions and live call sentiment analysis.",
        technologies: ["React", "Python", "LLM APIs", "RAG", "WebSockets"],
      },
      {
        title: "Software Agency Platform",
        description:
          "A software agency platform to manage client on-boarding and deliver automated AI audits on client bottleneck processes.",
        technologies: ["Next.js", "React", "Python", "AI", "n8n"],
      },
    ]),
    employmentJson: JSON.stringify([
      {
        title: "Software Engineer",
        company: "Intrum",
        startDate: "October 2023",
        endDate: "June 2025",
        description:
          "Developed customer-facing portals using React and Amazon CloudFront. Built digital APIs using Python, API Gateway and AWS Lambda. Implemented custom authentication flows with Amazon Cognito. Delivered within Agile framework using CI/CD via Azure DevOps.",
      },
      {
        title: "CTO/Software Engineer",
        company: "CiiVSOFT",
        startDate: "January 2019",
        endDate: "July 2023",
        description:
          "Designed highly scalable Python architecture for concurrent data ingestion from enterprise ATS systems. Built in-house resume parser using AWS, GCP, Flask & Spacy. Onboarded major European clients including Alstom, Agoda, Babcock, EDP & Glovo. Developed serverless solutions using EventBridge, Step Functions, DynamoDB & Lambda.",
      },
      {
        title: "Data Platform Engineer",
        company: "Pricesearcher.com",
        startDate: "January 2017",
        endDate: "December 2018",
        description:
          "Supported a vertical search engine processing over 300 million live products using Python and AWS. Built feed processor for multiple file formats with parallel processing. Rebuilt data feed downloader handling ~1000 clients including Amazon and eBay.",
      },
      {
        title: "Innovations Technician",
        company: "Capita Customer Management",
        startDate: "March 2016",
        endDate: "December 2016",
        description:
          "Created real-time web applications using Node.js with Express and Koa frameworks. Developed productivity tracking and gamified sales performance applications.",
      },
      {
        title: "Web Administrator/Communications Manager",
        company: "Capita Customer Management",
        startDate: "March 2014",
        endDate: "March 2016",
        description:
          "Administrated intranet sites for multi-site operation. Developed web features in HTML, CSS and jQuery. Built VBA-powered Excel reports, call loggers, workload management systems, and quality scoring trackers.",
      },
      {
        title: "Web Administrator/Communications Manager",
        company: "Capita Customer Management",
        startDate: "January 2008",
        endDate: "March 2014",
        description:
          "Redeveloped and administrated intranet site. Selected by Tesco as knowledge management champion. Designed data upload solution avoiding substantial cost. Implemented outbound campaign and customer callback systems.",
      },
      {
        title: "Software Engineer",
        company: "Marconi PLC",
        startDate: "August 1998",
        endDate: "September 2006",
        description:
          "Developed payphone software in embedded C. Provided software solutions to defects in the generic software base. Developed Windows utilities using C++. Liaised with international clients.",
      },
      {
        title: "Trainee Software Engineer",
        company: "Marconi PLC",
        startDate: "August 1996",
        endDate: "August 1998",
        description:
          "Completed two-year software engineering apprenticeship with placements in Product Testing, Business Improvement, Innovations, Purchasing and Quality Liaison.",
      },
    ]),
    educationJson: JSON.stringify([
      {
        degree: "HND Software Engineering",
        institution: "St Helens College",
        year: "1998-1999",
      },
      {
        degree: "HNC Software Engineering",
        institution: "St Helens College",
        year: "1996-1998",
      },
    ]),
    languagesJson: JSON.stringify([
      { language: "English", proficiency: "Native or Bilingual" },
    ]),
    updatedAt: new Date().toISOString(),
  })
  .run();

console.log("Profile seeded successfully.");
sqlite.close();
