# Quickstart: Streamline City & Overview Page Layout

## Prerequisites

- Node.js 20+
- `GH_TOKEN` environment variable set (GitHub PAT with `repo` scope)
- `npm install` completed

## Implementation Order

Work through these changes in order, as later steps depend on earlier ones:

### Step 1: Extend PullRequest type with labels

**File**: `src/types.ts`

Add `labels: string[]` to the `PullRequest` interface.

### Step 2: Update GitHub API client to capture labels

**File**: `src/api/github.ts`

Add `labels: Array<{ name: string }>` to the `GitHubPR` interface.

### Step 3: Update PR collector to extract labels

**File**: `src/services/pr-collector.ts`

In `extractPRsFromCommits()`, map `ghPR.labels.map(l => l.name)` into the PR object.

### Step 4: Create backfill script

**File**: `scripts/backfill-labels.ts`

Script that reads `data/history.json` + `data/current.json`, fetches labels for all PRs from GitHub API, updates JSON files in-place. Add `"backfill-labels": "npx tsx scripts/backfill-labels.ts"` to package.json scripts.

### Step 5: Run backfill

```bash
npm run backfill-labels
```

Verify: `data/history.json` and `data/current.json` PRs now have `labels` arrays.

### Step 6: Frontend — Replace commit SHA with PR title

**Files**: `site/js/components/status-badge.js`, `site/js/components/city-detail.js`, `site/js/components/overview.js`

Modify `renderStatusBadge()` to accept optional `latestPRTitle` parameter. Update callers to find and pass the latest non-bot PR title.

### Step 7: Frontend — Add Finnish weekday to dates

**File**: `site/js/components/status-badge.js`

Update `formatTime()` to include `weekday: 'short'` in the `toLocaleString` options.

### Step 8: Frontend — Collapsible sections

**File**: `site/js/components/city-detail.js`, `site/css/style.css`

Wrap production/staging/pending sections in `<details>` elements. Production starts closed, others open.

### Step 9: Frontend — Color-coded PR label badges

**Files**: `site/js/components/pr-list.js`, `site/css/style.css`

Add label badge rendering. Define label mapping constant. Add CSS for label badges.

### Step 10: Frontend — Hide author on hover

**File**: `site/css/style.css`

Add `.pr-author` opacity transitions and `@media (hover: none)` fallback.

### Step 11: Frontend — Dynamic page title

**File**: `site/js/app.js`

Add `document.title = ...` in each route handler.

### Step 12: Update tests

Update existing tests for the new `labels` field. Add tests for backfill script logic.

## Verification

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Lint
npm run lint

# Visual verification (local dev server)
npm run test:e2e  # or manually serve dist/ and check the pages
```
