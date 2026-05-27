# Proposal Templates

## Goal
Save reusable proposal templates that the AI drafter can build from. Templates provide a starting structure/tone that the AI customizes per job.

## Changes

### 1. Schema
New `proposal_templates` table: `id`, `name`, `content`, `createdAt`, `updatedAt`.

### 2. API
- `GET/POST /api/proposal-templates` -- list all, create new
- `GET/PUT/DELETE /api/proposal-templates/[id]` -- single template CRUD

### 3. Proposal generation
Update `buildProposalPrompts` to accept optional template text. When provided, the AI is told to use it as a structural/tone reference while customizing for the specific job.

### 4. UI -- Template management
Add a "Templates" card to the Upwork hub page (href to `/upwork/templates`). Simple list page with inline create/edit/delete.

### 5. UI -- Template selection in job detail
Add a dropdown above the "Generate Proposal" button on the job detail page. Fetches available templates, lets user pick one before generating.

## Steps
1. Schema + db push
2. API routes
3. Update proposal prompt builder
4. Template management page
5. Wire template selection into job detail page
6. Update Upwork hub card
7. Typecheck
