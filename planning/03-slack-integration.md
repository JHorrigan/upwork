# Slack Integration -- Settings & Notification Foundation

## Goal
Add Slack Bot configuration to the Settings page so the app can send job alert notifications.

## Changes

### 1. Schema (src/lib/db/schema.ts)
Add to `settings` table:
- `slackBotToken` (text, nullable) -- Bot User OAuth Token (`xoxb-...`)
- `slackChannelId` (text, nullable) -- Channel ID to post to
- `slackEnabled` (integer, default 0) -- Toggle on/off

### 2. API Updates
- **GET/PUT /api/settings** -- include Slack fields. Strip `slackBotToken` in GET responses (same pattern as `apiKeysJson`). Return `hasSlack: { token: boolean, channel: boolean, enabled: boolean }` instead.
- **POST /api/slack/test** -- send a test message to the configured channel using `fetch` against `https://slack.com/api/chat.postMessage`. No new dependencies needed.

### 3. Settings UI
Add a new card section between "API Keys" and "AI Model Configuration":
- Slack Bot Token input (password field with show/hide, same pattern as OpenAI key)
- Channel ID input (text field)
- Enable/disable toggle
- "Send Test" button -- posts to `/api/slack/test`, shows success/failure inline
- Status indicators: token configured, channel set, connection status from test

### 4. No new dependencies
Use `fetch` directly against Slack's Web API -- no `@slack/web-api` package needed.

## Steps
1. Update schema + push DB
2. Update settings API routes
3. Create `/api/slack/test` endpoint
4. Add Slack section to settings page UI
5. Typecheck + manual test
