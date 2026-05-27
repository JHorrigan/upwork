# 06 -- Proposal Workshop

Replaces the current generate-once proposal flow with an interactive workshop on the job detail page. Three new AI-powered panels alongside the existing proposal editor.

## What changes

### 1. Job Assessment Panel (new, top of right column)

AI analyzes the job and returns structured JSON:

- **Bid/No-Bid verdict** with reasoning (good fit, bad fit, risky)
- **Suggested rate** -- a specific number/range with rationale, calibrated to our zero-review phase (undercut slightly to win, raise later)
- **Competition snapshot** -- reads proposal count, client spend, client rating to gauge how competitive this will be
- **Red flags** -- scope creep indicators, unrealistic budget, vague requirements, no payment verification

The assessment uses profile data + job description + our strategy context (Phase 1: first 5 jobs, price below market, target low-proposal jobs, favour new clients).

Displayed as a compact card with verdict badge, rate suggestion, and expandable reasoning.

### 2. Approach Generator (new panel, below job assessment)

AI generates a technical approach for how we'd deliver this job:

- **Implementation plan** -- key steps, technologies, architecture decisions
- **Deliverables** -- what the client gets back (repo, docs, deployment, etc.)
- **Timeline estimate** -- realistic delivery window
- **Risk mitigation** -- what could go wrong and how we'd handle it

Stored in a new `approachText` column on the `jobs` table. Editable like the proposal.

### 3. Proposal Scoring (added to proposal section)

After a proposal exists, AI scores it 1-10 across:

- **Relevance** -- does it reference the specific job, not generic filler?
- **Hook strength** -- does the opening grab attention?
- **Specificity** -- concrete approach vs vague promises?
- **Differentiation** -- does it stand out from template proposals?
- **Call to action** -- clear, low-pressure next step?
- **Length** -- within 150-250 word sweet spot?

Returns an overall score, per-category scores, and specific suggestions for improvement. Displayed as a score badge + expandable breakdown.

### 4. Iterative Refinement (replaces current regenerate button)

Below the proposal text, a chat-style input where the user types refinement instructions:

- "Make the hook more specific to their React migration"
- "Mention my Supabase experience"
- "Shorten by 30%"
- "More confident tone"

Sends the current proposal + instruction to the LLM, returns updated proposal. The proposal text updates in place. No conversation history needed -- each refinement is a single-shot: current proposal + instruction = new proposal.

## API changes

### New endpoint: `POST /api/proposals/assess`

Request: `{ jobId }` 
Response: `{ verdict, suggestedRate, reasoning, redFlags, competition }`

Uses the same provider/model config as proposal drafting.

### New endpoint: `POST /api/proposals/approach`

Request: `{ jobId }`
Response: `{ approach }`

### New endpoint: `POST /api/proposals/score`

Request: `{ jobId }` (reads proposal from job record)
Response: `{ overall, categories: { relevance, hook, specificity, differentiation, cta, length }, suggestions }`

### Modified endpoint: `POST /api/proposals/generate`

Add optional `refinement` field. When present, sends current proposal + refinement instruction instead of generating from scratch.

Request: `{ jobId, templateId?, refinement? }`

## Schema change

Add `approachText` column to `jobs` table.

## UI layout (job detail page, right column)

1. **Job Assessment** -- verdict badge, rate, reasoning (collapsible)
2. **Approach** -- generate/view/edit technical approach
3. **Proposal** -- existing proposal section, now with:
   - Score badge next to "Proposal" heading (clickable to expand breakdown)
   - Refinement input below proposal text
   - Score auto-refreshes after each generation/refinement

## Prompt strategy

All prompts include:
- Full freelancer profile (skills, portfolio, overview)
- Job title + full description
- Strategy context: "This freelancer is in Phase 1 on Upwork (zero completed jobs). Priority is winning first 5 reviews. Price competitively. Target quick-turnaround, lower-competition jobs."

Assessment prompt additionally gets: budget, client rating, client spend, proposal count, payment verified status.

Scoring prompt gets: the proposal text + job description, scores against the 6 criteria.

Approach prompt gets: job description + profile skills, generates implementation-focused plan.

## Implementation order

1. Schema migration (add `approachText` to jobs)
2. Assessment endpoint + prompt
3. Approach endpoint + prompt
4. Scoring endpoint + prompt
5. Refine flow (modify generate endpoint)
6. UI -- assessment panel
7. UI -- approach panel
8. UI -- proposal scoring display
9. UI -- refinement input
10. Typecheck + test end-to-end
