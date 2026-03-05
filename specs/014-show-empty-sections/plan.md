# Implementation Plan: Show Empty Sections

**Branch**: `014-show-empty-sections` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-show-empty-sections/spec.md`

## Summary

Replace conditional section rendering in the city detail view so that the three PR sections (production, staging, awaiting deployment) are always visible. When a section has no PRs, display the section heading with a Finnish empty-state message using the existing `.empty-state` CSS class.

## Technical Context

**Language/Version**: Vanilla JavaScript ES modules (frontend)
**Primary Dependencies**: None (pure DOM, no framework)
**Storage**: JSON data files (read-only from frontend) -- no changes needed
**Testing**: Manual visual verification; existing E2E tests via Playwright
**Target Platform**: Web browser (static site)
**Project Type**: Static web dashboard
**Performance Goals**: N/A (trivial DOM change)
**Constraints**: Page load under 2 seconds (constitution requirement -- unaffected)
**Scale/Scope**: Single file change (`site/js/components/city-detail.js`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality -- single responsibility | PASS | Change is contained within city-detail.js rendering logic |
| I. Code Quality -- DRY | PASS | Reuses existing `.empty-state` CSS class and pattern from pr-list.js |
| II. Pragmatic Testing | PASS | Frontend visual change; constitution states "Frontend components do NOT require automated tests unless they contain complex logic" |
| III. UX Consistency -- three states | PASS | This feature specifically adds the missing "empty" state to these sections |
| III. UX Consistency -- consistent patterns | PASS | Uses same empty-state styling already present in the app |
| CI/CD Gates | PASS | No TypeScript, no new deps, lint/format rules apply to JS |

**Pre-design gate: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/014-show-empty-sections/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
site/
├── js/
│   └── components/
│       └── city-detail.js   # Primary file to modify
└── css/
    └── style.css            # Already has .empty-state class (no changes needed)
```

**Structure Decision**: Frontend-only change. Single file modification in `site/js/components/city-detail.js`. The existing `.empty-state` CSS class (defined in `site/css/style.css` line 408) provides the visual styling -- no CSS changes required.

## Complexity Tracking

> No violations. No complexity tracking needed.
