# Quickstart: Redesign City Deployment View

**Feature**: `005-redesign-deployment-view`

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
git checkout 005-redesign-deployment-view
npm install
```

## Development

The frontend is static vanilla JS — no build step required. Serve the `site/` directory:

```bash
npx serve site
# or
python3 -m http.server 8000 -d site
```

Open `http://localhost:8000` (or the port shown by serve).

## Data

Ensure `data/current.json` and `data/history.json` exist with valid data. The site fetches these at runtime.

To refresh data from live environments:

```bash
npm run fetch
```

## Files to Modify

| File | Change | Scope |
|------|--------|-------|
| `site/js/app.js` | Load `history.json` globally, pass to city detail | Small |
| `site/js/components/city-detail.js` | New layout: prod → staging → awaiting | Major |
| `site/js/components/pr-list.js` | Add `showRepoLabel`, `limit` options | Small |
| `site/js/components/status-badge.js` | Accept `detectedAt` timestamp override | Small |
| `site/css/style.css` | Add `.repo-label`, `.staging-section` styles | Small |

## Validation

```bash
npm test && npm run lint
```

Then visually verify on each city tab:
1. Production section shows 5 non-bot PRs per repo
2. Staging section shows unified chronological list with `[core]`/`[wrapper]` labels
3. Awaiting deployment section shows unified chronological list
4. "Show dependency updates" toggle works across all sections
5. Status badge timestamps show detection times (compare with history view)
