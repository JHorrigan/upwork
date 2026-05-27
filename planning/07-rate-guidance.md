# 07 -- Rate Guidance & Project Completion Tracking

Adds AI-powered rate advice to the job detail page, factoring in the freelancer's journey (completed project count), client budget, Upwork fees, and rate increase scheduling.

Related: Plan 06's assessment panel includes a basic "suggested rate." This plan builds the data layer and dedicated rate guidance that assessment can later consume.

## What changes

### 1. "Completed" job status

Add `completed` after `won` in the status lifecycle: draft > submitted > viewed > interview > won > completed > lost.

"Won" means the contract was awarded. "Completed" means the work is finished and (ideally) reviewed. The completed count drives rate strategy.

### 2. New fields on `jobs` table

| Column | Type | Purpose |
|---|---|---|
| `bidRate` | real | What the freelancer actually bid (hourly or fixed total) |
| `bidRateCurrency` | text | USD or GBP, defaults to profile currency |

Rate increase scheduling is advisory only (shown in the AI guidance output) -- not stored per-job, since it's set on Upwork at contract time.

### 3. Rate guidance API endpoint

`POST /api/rate-guidance`

Request: `{ jobId }`

The endpoint:
1. Loads the job (budget, budgetType, description, clientInfo)
2. Loads the freelancer profile (hourlyRate, rateCurrency, skills, title)
3. Counts completed projects: `SELECT COUNT(*) FROM jobs WHERE status = 'completed'`
4. Builds a prompt with all context
5. Calls the LLM (uses the same model assignment as proposal drafting)
6. Returns structured JSON

Response shape:
```json
{
  "suggestedRate": 30,
  "rateRange": { "low": 25, "high": 35 },
  "currency": "USD",
  "upworkFee": 3.0,
  "youReceive": 27.0,
  "justification": "With zero completed projects, pricing at the lower end of the client's $25-40/hr budget wins trust...",
  "rateIncrease": {
    "recommended": true,
    "frequency": "6 months",
    "percent": 10,
    "reasoning": "After 6 months you should have enough reviews to justify a modest increase."
  },
  "strategyPhase": "Phase 1: Building reputation (0 completed projects)"
}
```

### 4. Rate guidance prompt

System prompt context:
- Freelancer profile (title, skills, hourly rate, overview)
- Completed project count + statuses summary (e.g. "2 completed, 1 won, 3 submitted")
- Strategy phases:
  - Phase 1 (0-2 completed): Price at low end of client budget. Win reviews. Avoid rate increases.
  - Phase 2 (3-7 completed): Price at mid range. Consider modest rate increases (5-10% every 6-12 months).
  - Phase 3 (8+ completed): Price at or above market. Rate increases every 3-6 months are justified.

User prompt context:
- Job title, description, budget, budget type
- Client info (rating, spend, payment verified)
- Proposal count (competition level)

LLM returns JSON. The prompt explicitly asks for the response shape above. Includes Upwork's 10% service fee calculation.

### 5. UI: Rate Guidance panel on job detail page

New section in the left column, between the status/meta section and the description section. Only shown for hourly jobs (or for fixed jobs where a comparable hourly equivalent is useful).

**Layout:**
- "Rate Guidance" heading with a generate button (lightning bolt icon)
- Once generated, shows:
  - Recommended rate (large number) with "you receive" after fees
  - Justification text (2-3 sentences)
  - Strategy phase badge (Phase 1/2/3)
  - Rate increase recommendation (if applicable): frequency + percent
- Below the guidance: "Your bid rate" input field where the user records what they actually bid
- Save button persists bidRate to the job record

**States:**
- Not yet generated: generate button + brief explanation
- Loading: spinner
- Generated: full guidance display
- Error: error message with retry

### 6. Bid rate in proposal context

When generating proposals (existing flow), if `bidRate` is set on the job, include it in the proposal prompt so the LLM can reference the specific rate the freelancer is offering.

Update `buildProposalPrompts()` to accept optional `bidRate` + `currency` params.

## Schema migration

```sql
-- Add completed status (no schema change needed, status is a text column)
-- Add bid rate fields
ALTER TABLE jobs ADD COLUMN bid_rate REAL;
ALTER TABLE jobs ADD COLUMN bid_rate_currency TEXT;
```

## Implementation order

1. Schema: add `bidRate` and `bidRateCurrency` columns to jobs table
2. Status: add "completed" to status enum in UI + API validation
3. API: rate guidance endpoint + prompt builder
4. UI: rate guidance panel on job detail page
5. UI: bid rate input + save
6. Integration: pass bidRate to proposal prompt
7. Typecheck + end-to-end test
