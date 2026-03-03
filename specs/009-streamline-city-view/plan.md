# Implementation Plan: Streamline City & Overview Page Layout

**Branch**: `009-streamline-city-view` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-streamline-city-view/spec.md`

## Summary

Declutter the city and overview pages for non-technical stakeholders by: (1) replacing commit SHAs with the latest non-bot PR title on environment status lines, (2) adding Finnish weekday names to dates, (3) making PR detail sections collapsible with production collapsed by default, (4) hiding author names behind hover, (5) adding color-coded Finnish label badges for core PRs, (6) setting dynamic browser tab titles, and (7) building a backfill script to enrich existing history/current data with GitHub PR labels.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (data pipeline & scripts); vanilla JavaScript ES modules (frontend)
**Primary Dependencies**: axios (HTTP), nock (test mocking), Playwright (E2E)
**Storage**: JSON files (`data/current.json`, `data/history.json`, `data/previous.json`)
**Testing**: Jest (unit/integration), Playwright (E2E)
**Target Platform**: Static site served via GitHub Pages; data pipeline runs in GitHub Actions
**Project Type**: Web dashboard (static frontend + scheduled data fetcher)
**Performance Goals**: Page load < 2 seconds; backfill script must handle ~300 unique PRs with GitHub API rate limits
**Constraints**: GitHub API rate limit (5000 req/hr with PAT); no new runtime dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — strict TS, single responsibility, explicit errors, DRY | PASS | New `labels` field added to existing interfaces; backfill script reuses existing GitHub client; label mapping defined once as shared constant |
| I. Code Quality — minimal dependencies | PASS | No new dependencies needed; `<details>`/`<summary>` is native HTML |
| II. Pragmatic Testing — services tested, API mocked, frontend visual review | PASS | Backfill script gets unit tests; PR collector label changes covered by existing tests (extended); frontend changes verified visually + E2E |
| III. UX Consistency — loading/populated/empty states, deep-bookmarkable, keyboard-accessible | PASS | Collapsible sections use native `<details>` (keyboard-accessible); collapse state is not URL-persisted (ephemeral UI state, acceptable) |
| III. UX Consistency — page load < 2s, minimal assets | PASS | No new JS libraries; labels are pre-computed in data files |
| CI/CD Quality Gates — lint, type, test, build | PASS | All changes go through existing CI pipeline |

**Pre-design gate: PASSED** — no constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-streamline-city-view/
├── plan.md              # This file
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: data model changes
├── quickstart.md        # Phase 1: implementation quickstart
├── contracts/           # Phase 1: interface contracts
│   └── pr-label-mapping.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── types.ts                          # Add labels field to PullRequest interface
├── api/
│   └── github.ts                     # Extend GitHubPR interface with labels; add getPRLabels()
├── services/
│   └── pr-collector.ts               # Extract labels during PR collection
└── utils/
    └── pr-classifier.ts              # (no changes needed)

scripts/
└── backfill-labels.ts                # NEW: One-time script to add labels to history + current data

site/
├── index.html                        # (no changes)
├── css/
│   └── style.css                     # Add: collapsible section styles, label badge styles, author hover styles
└── js/
    ├── app.js                        # Set document.title in route handlers
    ├── router.js                     # (no changes)
    └── components/
        ├── status-badge.js           # Replace commit SHA with PR title; add weekday to date
        ├── city-detail.js            # Wrap sections in <details>; pass PR data to status badge
        ├── overview.js               # Replace commit SHA with PR title
        ├── pr-list.js                # Add label badges; hide author by default
        ├── city-tabs.js              # (no changes)
        └── history-view.js           # (no changes)

tests/
├── unit/
│   └── backfill-labels.test.ts       # NEW: tests for backfill logic
└── (existing tests updated for labels field)
```

**Structure Decision**: This follows the existing project structure exactly. The only new file is `scripts/backfill-labels.ts` following the established pattern from `scripts/screenshot.ts`. All other changes are modifications to existing files.

## Complexity Tracking

No constitution violations — this section is intentionally empty.
