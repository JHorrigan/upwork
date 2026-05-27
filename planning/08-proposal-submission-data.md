# 08 -- Proposal Submission Data & Pattern Matching

Enrich the tracked job data model to capture everything Upwork shows on the proposal submission form, fix data loss during feed-to-job promotion, and use pattern matching to generate stronger proposals.

## Problem

When submitting a proposal on Upwork, the form shows structured data we don't capture. When promoting a feed job to a tracked job, we lose fields the scraper already collected. The proposal generator doesn't leverage our portfolio or skills for targeted matching.

## Gap audit: Upwork submission form vs our data

### Currently captured
| Upwork field | Our field | Notes |
|---|---|---|
| Job title | `jobs.title` | OK |
| Description | `jobs.description` | OK |
| Link to posting | `jobs.upworkUrl` | OK |
| Connects required | `jobs.connectsCost` | OK but not populated on promotion |
| Budget / hourly range | `jobs.budget` | String only -- not parsed into min/max |
| Budget type | `jobs.budgetType` | OK |
| Client info | `jobs.clientInfo` | Flattened to string, loses structure |
| Proposal count | `jobs.proposalCount` | Exists but not populated from feed |
| Cover letter | `jobs.proposalText` | OK |
| Bid rate | `jobs.bidRate` | OK (just added in plan 07) |

### Lost on promotion (feedJob has it, tracked job doesn't)
| Feed field | What it contains |
|---|---|
| `experienceLevel` | Entry / Intermediate / Expert |
| `skillsJson` | Required skills array (e.g. ["Python"]) |
| `postedAt` | When the job was posted |
| `proposals` | Text like "5-10 proposals", "Fewer than 5" |

### Not captured at all
| Upwork field | Why it matters |
|---|---|
| **Category / tag** | e.g. "Scripting and Automation" -- helps pattern match what types of work we win |
| **Weekly hours** | e.g. "Less than 30 hrs/week" -- affects rate strategy and availability |
| **Project length** | e.g. "Less than a month" -- affects rate strategy and effort estimation |
| **Boost connects** | Optional bid to appear in top 4 bidders -- competitive tactic |
| **Portfolio highlight** | Which portfolio project to feature with this proposal |
| **Payment structure** | By milestones (description, due date, amount per milestone) or by project (single payment) |
| **Attachments** | Files attached to the proposal (specs, samples, diagrams) |

## Plan

### 1. Enrich jobs table schema

Add missing columns to `jobs`:

| Column | Type | Source |
|---|---|---|
| `experienceLevel` | text | From feed or manual |
| `skillsJson` | text (JSON array) | From feed or manual |
| `category` | text | Manual entry or future scrape |
| `postedAt` | text | From feed or manual |
| `weeklyHours` | text | e.g. "Less than 30 hrs/week" |
| `projectLength` | text | e.g. "Less than a month" |
| `boostConnects` | integer | Optional boost bid |
| `highlightedProjectIndex` | integer | Index into profile.portfolioJson |

### 2. Fix promotion to carry over all data

Update `POST /api/feed-jobs/[id]` to also copy:
- `experienceLevel`
- `skillsJson`
- `postedAt`
- Parse `proposals` text into `proposalCount` integer (e.g. "5-10 proposals" -> 7, "Fewer than 5" -> 3)

### 3. Parse budget into structured range

Add `budgetMin` (real) and `budgetMax` (real) columns to `jobs`. When budget is a string like "$20-$40", parse it on promotion. This gives rate guidance exact numbers to work with instead of string parsing in the prompt.

### 4. Pattern matching for proposals

#### Skills matching
Compare `jobs.skillsJson` against `profile.skillsJson`. Calculate overlap score. Feed into:
- Rate guidance prompt (more overlap = more confidence to bid higher)
- Proposal prompt (reference specific matching skills)
- Job assessment (bid/no-bid signal)

#### Portfolio matching
For each job, score each portfolio project by:
- Technology overlap between `job.skillsJson` and `portfolio.technologies`
- Keyword similarity between job description and portfolio description
- Use LLM to pick the best portfolio project to highlight

Suggest which portfolio project to attach as the "profile highlight" on the Upwork form.

#### Effort estimation
Use `weeklyHours` + `projectLength` to estimate total project effort. Feed into:
- Rate guidance (short projects can command a premium; long projects favour stability)
- Proposal approach section (realistic timeline references)

### 5. Boost strategy

Track `boostConnects` per job. Over time, build data on:
- Did boosted proposals win more often?
- What's the typical boost range for jobs at this budget level?
- When is boosting worth the connect spend?

For now, just capture the field. Strategy advice comes later once there's enough data.

### 6. Attachment generation (future consideration)

Potential auto-generated attachments:
- One-page project approach document (from plan 06's approach generator)
- Relevant code samples extracted from portfolio
- Architecture diagram for technical projects

Not in scope for initial implementation, but the `approachText` from plan 06 could be exported as a PDF attachment.

## What this enables for proposals

With all this data flowing into the proposal prompt, the AI can:
- Reference specific matching skills ("I see you need Python -- I've built X with it")
- Suggest the strongest portfolio piece to highlight
- Reference realistic timelines based on project length and weekly hours
- Adjust tone for experience level (intermediate jobs get practical, expert gets deep)
- Factor competition level and boost into overall bidding strategy

## Implementation order

1. Schema: add new columns to jobs table
2. Fix promotion: carry over all feed data + parse proposal count
3. Parse budget into min/max on promotion
4. Update rate guidance prompt to use structured data (experience level, hours, length)
5. Skills matching utility function
6. Portfolio matching (LLM-assisted)
7. Portfolio highlight selector in job detail UI
8. Update proposal prompt to include all new context
9. Boost connects field in job detail UI
10. Typecheck + end-to-end test

## Relationship to other plans

- **Plan 06 (Proposal Workshop)**: The assessment panel will consume skills matching scores, experience level, and effort estimates. The approach generator output could become an attachment.
- **Plan 07 (Rate Guidance)**: Now gets structured budget min/max, experience level, weekly hours, and project length for better rate calculations.
