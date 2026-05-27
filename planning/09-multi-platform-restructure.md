# 09 -- Multi-Platform Restructure

## Goal

Restructure the app from an Upwork-only tool into a multi-platform freelance manager. The home page becomes a global dashboard. Each platform (Upwork, Fiverr, etc.) gets its own sidebar section with sub-menus and its own platform-specific dashboard.

## Changes

### 1. Sidebar -- Expandable Platform Sections

**File:** `src/components/sidebar.tsx`

Current: Single "Upwork" link under "Platforms" heading.

New:
- **Dashboard** link at top (the `/` route, currently the logo does this but give it its own nav item)
- Each platform becomes a collapsible section with sub-menu items
- Upwork section expands to show: Profile, Job Feed, Jobs & Proposals, Templates
- Sub-menu items only show when the platform section is expanded or active
- Maintain the existing accent-color-per-platform pattern
- Settings stays at the bottom

Sidebar structure:
```
Dashboard          (/)
Platforms
  v Upwork         (/upwork)
      Profile      (/upwork/profile)
      Job Feed     (/upwork/feed)
      Jobs         (/upwork/jobs)
      Templates    (/upwork/templates)
  > Fiverr         (future -- not built now, just designed for)
Settings           (/settings)
```

### 2. Global Dashboard -- Home Page

**File:** `src/app/(dashboard)/page.tsx`

Current: Simple hero card with "Win more work" and a CTA link to Upwork.

New: A real dashboard with cross-platform overview:
- **Activity feed** -- Latest jobs across all platforms (most recent feed jobs, recently tracked jobs)
- **Active work** -- Jobs currently in progress (status: interview, won, or in-progress)
- **Quick stats** -- Total tracked jobs, proposals submitted, win rate, active platforms
- **Revenue summary** -- Placeholder section for revenue tracking (earnings, expected income)
- Pull data from existing API routes (`/api/jobs`, `/api/feed-jobs`)

Keep it simple -- show what data we already have. Revenue section can be a placeholder card since we don't track earnings yet.

### 3. Upwork Dashboard -- Platform Page

**File:** `src/app/(dashboard)/upwork/page.tsx`

Current: Grid of 8 feature cards (some disabled/future).

New: A dashboard focused on Upwork activity:
- **Recent feed jobs** -- Last 5-10 jobs from the feed
- **Tracked jobs** -- Jobs by status (draft, submitted, interview, etc.)
- **Quick actions** -- Links to key pages (new job, browse feed, edit profile)
- Keep the feature roadmap cards (Project Catalog, Strategy, Discovery+) but move them to a smaller "Coming Soon" section at the bottom
- Platform-specific stats (proposals sent, jobs tracked, etc.)

### 4. No Route Changes

All existing routes stay exactly where they are:
- `/upwork/profile`, `/upwork/feed`, `/upwork/jobs`, `/upwork/templates` -- unchanged
- `/settings` -- unchanged
- API routes -- unchanged

The only pages that change content are `/` (home) and `/upwork` (platform hub).

## Implementation Order

1. **Sidebar** -- Restructure with collapsible platform sections and sub-menus
2. **Global dashboard** -- Replace hero page with real dashboard
3. **Upwork dashboard** -- Replace feature-card grid with platform dashboard

## Out of Scope

- Fiverr implementation (just ensure the sidebar pattern supports adding it later)
- Revenue tracking backend (placeholder UI only)
- Settings changes (user said leave as-is)
- Any new API routes or database changes
