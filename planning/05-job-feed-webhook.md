# Job Feed -- Browser Extension Webhook Integration

## Goal
Receive job data from the Upwork Job Scraper browser extension via webhook, store in a feed table, push Slack alerts, and let the user browse/promote jobs to the tracker.

## Data Flow
Extension polls Upwork (every 5 min) -> webhook POST to our app -> save to feed_jobs -> Slack notification -> user browses feed -> promotes interesting jobs to tracker

## Changes

### 1. Schema
New `feed_jobs` table:
- `id` (auto-increment PK)
- `uid` (text, unique) -- Upwork's stable job ID, dedup key
- `title`, `url`, `description` (text)
- `jobType`, `budget`, `experienceLevel` (text)
- `skillsJson` (text) -- JSON array of skill strings
- `paymentVerified` (integer, 0/1)
- `clientRating`, `clientTotalSpent`, `proposals` (text) -- raw strings from Upwork
- `postedAt` (text) -- ISO timestamp from extension
- `scrapedAt` (text) -- when extension scraped it
- `targetName` (text) -- which saved search found it
- `dismissed` (integer, default 0) -- user dismissed this job
- `promotedJobId` (integer, nullable) -- FK to jobs table if promoted to tracker
- `createdAt` (text)

### 2. Webhook endpoint
`POST /api/webhook/jobs`:
- Accept v3 payload (check `status === "success"`)
- Deduplicate by `uid` (skip existing)
- Insert new jobs into `feed_jobs`
- Send Slack notification for each new job (title, budget, URL)
- Return count of new vs skipped jobs
- For `status !== "success"` (captcha, logged_out), send Slack warning

### 3. Feed page
`/upwork/feed` -- browse discovered jobs:
- List view, newest first
- Each card shows: title, budget, skills, client info, posted time
- Actions: "Track" (promotes to jobs table), "Dismiss", "View on Upwork"
- Filter: show/hide dismissed

### 4. Promote action
`POST /api/feed-jobs/[id]/promote`:
- Creates a new entry in `jobs` table from feed_job data
- Sets `feed_jobs.promotedJobId` to the new job ID
- Returns the new job for navigation

### 5. Upwork hub update
Add "Job Feed" card with link to `/upwork/feed`

## Steps
1. Schema + db push
2. Webhook endpoint
3. Feed page UI
4. Promote endpoint
5. Update Upwork hub
6. Typecheck + test
