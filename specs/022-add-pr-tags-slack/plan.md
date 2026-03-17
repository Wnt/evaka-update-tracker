# Implementation Plan: Add PR Tags to Slack Announcements

**Branch**: `022-add-pr-tags-slack` | **Date**: 2026-03-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/022-add-pr-tags-slack/spec.md`

## Summary

Add Finnish-translated PR label tags (e.g. `[Tekninen]`, `[Korjaus]`) to Slack deployment notifications (Block Kit) and change announcements (plain text). The label mapping already exists in the frontend (`LABEL_MAP` in `site/js/components/pr-list.js`); this plan creates a shared backend mapping and uses it in both Slack message formatters. A cross-check test ensures the backend and frontend mappings stay in sync.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (backend); vanilla JavaScript ES modules (frontend)
**Primary Dependencies**: axios (HTTP), nock (test HTTP mocking)
**Storage**: JSON files (`data/current.json`, `data/history.json`) — no changes needed
**Testing**: Jest (unit + integration), Playwright (E2E)
**Target Platform**: Linux server (GitHub Actions)
**Project Type**: Web service (data pipeline + static dashboard)
**Performance Goals**: N/A — no user-facing latency impact (Slack webhook messages)
**Constraints**: Slack mrkdwn does not support colored text; bracketed plain text tags only
**Scale/Scope**: 11 label mappings, 2 message formatters to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — DRY | ✅ Pass | Shared `src/config/label-map.ts` for backend; cross-check test ensures frontend stays in sync |
| I. Code Quality — Single responsibility | ✅ Pass | Label mapping is its own module; formatting helper is a pure function |
| I. Code Quality — Strict TypeScript | ✅ Pass | New module will use strict mode, no `any` types |
| I. Code Quality — Minimal dependencies | ✅ Pass | No new dependencies |
| II. Pragmatic Testing | ✅ Pass | Unit tests for label formatting, integration tests for Slack messages with labels, cross-check test for frontend sync |
| II. E2E tests | ✅ Pass | No frontend changes — E2E tests unaffected |
| III. UX Consistency | N/A | No dashboard UI changes |
| CI/CD Quality Gates | ✅ Pass | All existing gates apply; no new env vars needed |
| Development Workflow — GitHub Actions | ✅ Pass | No new env vars or secrets introduced |

## Project Structure

### Documentation (this feature)

```text
specs/022-add-pr-tags-slack/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── config/
│   └── label-map.ts          # NEW — shared GitHub label → Finnish name mapping
├── api/
│   └── slack.ts              # MODIFIED — add label tags to PR lines in Block Kit
└── services/
    └── change-announcer.ts   # MODIFIED — add label tags to PR lines in plain text

site/
└── js/
    └── components/
        └── pr-list.js        # UNCHANGED — existing LABEL_MAP stays (frontend is vanilla JS)

tests/
├── unit/
│   ├── label-map.test.ts     # NEW — unit tests for formatLabelTags + mapping completeness
│   └── change-announcer.test.ts  # MODIFIED — add tests for labels in change announcements
├── integration/
│   └── slack-api.test.ts     # MODIFIED — add tests for labels in deployment notifications
└── cross-check/
    └── label-map-sync.test.ts  # NEW — verifies backend and frontend mappings match
```

**Structure Decision**: Single project structure. New file `src/config/label-map.ts` follows the existing `src/config/` pattern (alongside `feature-labels.ts`, `slack-routing.ts`, `change-routing.ts`). Cross-check test in a new `tests/cross-check/` directory to separate concerns.

## Complexity Tracking

No constitution violations — no entries needed.
