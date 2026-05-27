# Upwork Freelance Manager

A Next.js 16 + React 19 + Tailwind 4 application for managing freelance work on Upwork.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript 5
- Tailwind CSS 4
- Lucide React (icons)
- pnpm, Node 22 LTS

## Working in this repo with Claude

### Feature workflow (mandatory for non-trivial work)
1. **Plan** -- write a plan in `planning/NN-slug.md`. Wait for user approval before implementing.
2. **Implement** -- small, incremental steps. Validate each step before moving on.
3. **Test** -- run the app, verify behavior end-to-end. Type-check. Run tests if present.
4. **Push** -- only after explicit user approval. Never push unprompted.

### When a plan is complete
- Append a short summary (5-15 lines) to `HISTORY.md` under a new heading.
- Delete the plan file from `planning/`.
- Update `planning/README.md` to remove the entry from the active list.

This keeps `planning/` strictly about what's in flight right now -- no stale work bleeding into current context.

### Context discipline (progressive disclosure)
- **Always loaded**: this file (`CLAUDE.md`).
- **Read on demand**: `planning/README.md` at the start of any feature work to see what's active; specific plan files only when working on that feature; `HISTORY.md` only when prior decisions are relevant.
- Keep each plan <= 200 lines. Keep each `HISTORY.md` entry <= 15 lines. Split or trim if longer.
- Do not duplicate stack/convention info into plans -- it's here.

### Where things live
| Path | Purpose |
|---|---|
| `CLAUDE.md` | Always-on instructions (this file). Stack, workflow, conventions. |
| `planning/` | Active plans only. One `.md` per feature. |
| `planning/README.md` | One-line index of active plans. |
| `HISTORY.md` | Append-only log of completed features. Newest at top. |
| `src/` | Application code. |

## Project conventions
- Use latest stable APIs of every library.
- Don't overengineer. Don't program defensively. Identify root causes before fixing.
- Never use emojis in code, commits, PRs, or logging.
- Prefer editing existing files over creating new ones.
- Comments only when the *why* is non-obvious.
- Use `pnpm` for all package management.
- Run `pnpm dev` (with Turbopack) for local development.
- Run `pnpm typecheck` before considering work complete.

## Key context
- No Upwork API access currently -- application was rejected due to no body of work yet. All features must work without API access (manual input, scraping guidance, browser workflows).
- This is a personal tool for a freelancer new to Upwork who has a complete profile and portfolio but zero completed jobs.
