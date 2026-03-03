# Implementation Plan: Redesign City Deployment View

**Branch**: `005-redesign-deployment-view` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-redesign-deployment-view/spec.md`

## Summary

Redesign the per-city detail page to show: (1) last 5 non-bot production commits per repo, (2) unified chronological staging changes with `[core]`/`[wrapper]` labels, (3) unified chronological awaiting deployment section. Replace `checkedAt` timestamps in status badges with version change `detectedAt` timestamps from history data. All changes are frontend-only — no backend data structure modifications required.

## Technical Context

**Language/Version**: Vanilla JavaScript ES modules (frontend)
**Primary Dependencies**: None (no framework, pure DOM)
**Storage**: JSON data files (`data/current.json`, `data/history.json`) — read-only from frontend
**Testing**: Manual visual verification; existing CI lint/type/build gates
**Target Platform**: Modern browsers (static site hosted via GitHub Pages)
**Project Type**: Static web dashboard
**Performance Goals**: Page load under 2 seconds, toggle response under 100ms
**Constraints**: No backend data structure changes (user constraint). Frontend-only modifications.
**Scale/Scope**: 5 frontend files modified, ~200 lines changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality — strict mode | PASS | Frontend is vanilla JS (no TS strict), matches existing pattern |
| I. Code Quality — single responsibility | PASS | Each component file retains single responsibility |
| I. Code Quality — error handling | PASS | Fallback to `checkedAt` when no history event found |
| I. Code Quality — DRY | PASS | Shared `mergeAndSortPRs()` helper used for both staging and awaiting lists |
| II. Pragmatic Testing | PASS | Frontend visual components — manual review per constitution |
| III. UX Consistency — three states | PASS | Each section handles populated, empty, and loading states |
| III. UX Consistency — deep-bookmarkable | PASS | `showBots` query param preserved; no new URL state |
| III. UX Consistency — keyboard accessible | PASS | Toggle remains a `<button>`, links remain `<a>` |
| CI/CD gates | PASS | Lint, build gates apply; no TypeScript in frontend |

No violations. No Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-redesign-deployment-view/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (view models only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
site/
├── js/
│   ├── app.js                      # MODIFY: load history.json, pass to city detail
│   └── components/
│       ├── city-detail.js           # MODIFY: new layout rendering logic (major)
│       ├── pr-list.js               # MODIFY: add repoLabel support, limit option
│       └── status-badge.js          # MODIFY: accept detectedAt override
├── css/
│   └── style.css                    # MODIFY: add .repo-label, .staging-section styles
└── index.html                       # NO CHANGE
```

**Structure Decision**: Existing web application structure. All changes within `site/` directory. No new files created — only modifications to 5 existing files.

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. DRY | PASS | `mergeAndSortPRs()` shared between staging and awaiting sections. `findDetectedAt()` centralized lookup. No duplication. |
| I. Single responsibility | PASS | `city-detail.js` = layout orchestration, `pr-list.js` = PR rendering, `status-badge.js` = status display. Each stays focused. |
| I. Error handling | PASS | `findDetectedAt()` returns null → fallback to `checkedAt`. Missing prTracks → empty arrays. |
| I. Dependencies | PASS | No new dependencies added. |
| III. Three states | PASS | Production: shows items or hides sub-header. Staging/Awaiting: shows items or hides section. Badges: detectedAt or checkedAt fallback. |
| III. Deep-bookmarkable | PASS | No new URL state. `showBots` param unchanged. |

All gates pass. Plan is ready for `/speckit.tasks`.
