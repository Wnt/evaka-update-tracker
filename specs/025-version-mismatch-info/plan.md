# Implementation Plan: More Informative Version Mismatch Indication

**Branch**: `025-version-mismatch-info` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-version-mismatch-info/spec.md`

## Summary

Enhance how the dashboard surfaces "version mismatch between instances" in two places:

1. **Yleiskatsaus (overview) card** — identify whether the affected environment is *testing* (`Versioero havaittu testauksessa`) or *production* (`Versioero havaittu tuotannossa`), and tint only the affected environment row's status dot amber while the healthy row stays green.
2. **City detail page** — name the specific sub-cities whose version differs from the majority, and tint only those sub-city chips' status dots amber (majority chips stay green).

**Technical approach**: Frontend-only change. Introduce a new pure helper module `site/js/lib/mismatch-classifier.js` that derives the majority/abnormal split from the existing `env.mismatchDetails` payload (no backend changes, no data-format changes). Overview and city-detail components import the classifier and branch their rendering on its output. A new CSS class `.status-dot.mismatch` (reusing the mismatch-warning banner's existing amber `#fcd34d`) paints the abnormal dots. `renderStatusBadge()` gains one optional `mismatchOverride` parameter so the shared env-row badge can flip its dot class without duplicating markup. All call sites default to the existing behaviour so non-mismatched rendering is untouched. The feature is covered by new Jest unit tests for the classifier and new Playwright E2E tests that inject scenario-specific `current.json` payloads via `page.route()` — no shared fixture changes, parallel-safe.

## Technical Context

**Language/Version**: Vanilla JavaScript ES modules (frontend, no build step); TypeScript 5.x on Node.js 20+ (tests).
**Primary Dependencies**: None added. Existing: Playwright (E2E), Jest (unit tests).
**Storage**: JSON files (`data/current.json`) — **read-only, no schema change**.
**Testing**: Jest for the pure classifier (`tests/unit/mismatch-classifier.test.ts`); Playwright for end-to-end user story coverage (`tests/e2e/version-mismatch.spec.ts`). Run via `npm test` and `npm run test:e2e`.
**Target Platform**: Evergreen browsers (same as the rest of the dashboard).
**Project Type**: Web application — existing `site/` (vanilla JS frontend) + `src/` (TypeScript data pipeline) + `tests/` layout.
**Performance Goals**: No measurable regression. Classifier is O(n) over `env.mismatchDetails` with n ≤ ~10 in realistic data. No extra network I/O.
**Constraints**: Must keep existing page-load behaviour (no new blocking state, no new fetch). Must stay consistent with the existing Finnish-language UI copy. Must not alter detection logic in `src/services/version-resolver.ts` (FR-009).
**Scale/Scope**: ~60 lines of new frontend logic (classifier + edits to overview/city-detail), ~1 line of CSS, ~200 lines of new test code.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Code Quality — single responsibility, DRY** | ✅ | Majority/abnormal tallying is extracted into its own helper module (`mismatch-classifier.js`) used by both overview and city-detail components — no duplicated logic. |
| **I. Code Quality — strict TS, no `any`** | ✅ | New TypeScript test files use strict types. Frontend JS module uses JSDoc typedefs (consistent with the rest of `site/js/`, which has no `.ts` files). |
| **I. Code Quality — explicit error handling** | ✅ | Classifier is a pure function that never throws; defensive handling of nullish `mismatchDetails` is documented in the contract. |
| **I. Code Quality — minimal dependencies** | ✅ | Zero new runtime or dev dependencies. |
| **II. Pragmatic Testing — unit tests for non-trivial logic** | ✅ | `tests/unit/mismatch-classifier.test.ts` covers 14 cases (C1–C14) from the contract — no mismatch, single instance, clear majority, multi-abnormal, 3-way split with majority, tied 2-way/3-way, non-OK filtering, empty input, fallback grouping. |
| **II. Pragmatic Testing — E2E as first-class** | ✅ | New `tests/e2e/version-mismatch.spec.ts` covers six user-visible scenarios (staging-only, production-only, both envs, tied, no-mismatch regression, mixed status). Existing E2E tests re-run unchanged to catch regressions. |
| **II. Pragmatic Testing — E2E tests updated with frontend changes** | ✅ | This feature explicitly adds a new E2E spec file alongside the DOM/CSS changes. |
| **III. UX Consistency — three states handled** | ✅ | "No mismatch" (status quo), "mismatch detected" (new), and "mismatch with non-OK instances" (FR-006) are all covered. |
| **III. UX Consistency — consistent status patterns** | ✅ | Reuses the existing `status-dot` class family; new `mismatch` variant reuses the amber hex already used by the mismatch-warning banner border. |
| **III. UX Consistency — deep-bookmarkable URLs** | ✅ | No URL changes; the feature only affects rendering of existing routes. |
| **III. UX Consistency — <2s page load** | ✅ | Classifier adds O(n≤10) work per env and no network I/O. No impact on load time. |
| **CI/CD Gates** | ✅ | Feature is additive; lint, typecheck, unit, E2E, and build gates all remain applicable and will be exercised by the task-level validation loop. |
| **Dev Workflow — before mockups captured first** | ✅ | `mockups-before.md` is listed in Phase 1 artifacts and is authored manually from user screenshots before any source file is touched. See `research.md` §R9. |
| **Dev Workflow — README screenshot** | N/A | This is a small visual refinement (dot colour + warning text), not a layout redesign. No new sections, no restructured components. The existing screenshot remains accurate — per constitution "Minor tweaks (color adjustments, small text changes) do NOT require a screenshot update". |
| **Dev Workflow — workflow YAML env vars** | N/A | No new `process.env.*` references. |
| **Dev Workflow — before/after mockups in PR** | ✅ | PR description will include both. "After" mockups captured post-implementation. |

**Result**: PASS — no constitutional violations. The Complexity Tracking section is empty.

**View Mockup Capture**: This feature affects two user-facing views (overview card, city detail page). "Before" mockups MUST be captured before implementation begins. They will be saved to `specs/025-version-mismatch-info/mockups-before.md` (manual markdown — see `research.md` §R9 for rationale).

## Project Structure

### Documentation (this feature)

```text
specs/025-version-mismatch-info/
├── plan.md                                 # This file
├── spec.md                                 # Feature specification
├── research.md                             # Phase 0 — design decisions (R1–R10)
├── data-model.md                           # Phase 1 — existing fields consumed + new derived MismatchClassification
├── quickstart.md                           # Phase 1 — local dev loop + validation checklist
├── contracts/
│   └── mismatch-classifier.md              # Phase 1 — public API and behavioural contract for the new helper
├── checklists/
│   └── requirements.md                     # Spec quality checklist (from /speckit.specify)
├── mockups-before.md                       # Created before implementation starts (constitution §Dev Workflow)
└── tasks.md                                # Phase 2 — created by /speckit.tasks (NOT by /speckit.plan)
```

### Source Code (repository root)

```text
site/                                       # Vanilla JS ES modules, served statically
├── css/
│   └── style.css                           # EDIT — add `.status-dot.mismatch { background: #fcd34d; }`
└── js/
    ├── lib/
    │   └── mismatch-classifier.js          # NEW — exports classifyMismatch(mismatchDetails)
    └── components/
        ├── status-badge.js                 # EDIT — add optional mismatchOverride parameter
        ├── overview.js                     # EDIT — call classifier; pick env-type-specific warning; pass mismatchOverride
        └── city-detail.js                  # EDIT — call classifier; name abnormal sub-cities; paint chip dots per abnormal set

src/                                        # TypeScript data pipeline
└── services/
    └── version-resolver.ts                 # UNCHANGED (FR-009 — detection logic stays)

tests/
├── unit/
│   └── mismatch-classifier.test.ts         # NEW — Jest tests for classifier contract C1–C14
└── e2e/
    ├── helpers/
    │   └── mismatch-fixtures.ts            # NEW — factory functions building scenario-specific CurrentData
    └── version-mismatch.spec.ts            # NEW — Playwright tests for six user scenarios
```

**Structure Decision**: Existing web-application layout — vanilla JS frontend under `site/`, TypeScript data pipeline under `src/`, tests under `tests/`. The feature fits entirely within the frontend and test layers; no new directories beyond `site/js/lib/` (created alongside the classifier file to give small pure helpers a clear home — consistent with other `lib/` conventions if they appear in the future).

## Complexity Tracking

*No constitutional violations. Section intentionally left empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
