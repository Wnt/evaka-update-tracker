# Quickstart — More Informative Version Mismatch Indication

**Feature**: 025-version-mismatch-info

This document is the shortest path to running, iterating on, and validating the feature locally. It complements `research.md`, `data-model.md`, and `contracts/mismatch-classifier.md`.

---

## 1. Understand the problem in 30 seconds

Current state: a generic `Versioero havaittu instanssien välillä` banner appears when any environment has multiple SHAs. It does not say which environment is affected or which sub-city is the odd one out.

Target state:
- Overview card: `Versioero havaittu tuotannossa` or `Versioero havaittu testauksessa` and the affected row's dot turns amber.
- City detail: warning names the abnormal sub-cities; only their chips' dots turn amber; majority sub-cities stay green.

---

## 2. Files you will touch

| File | Change |
|------|--------|
| `site/js/lib/mismatch-classifier.js` | **NEW** — exports `classifyMismatch()` (see `contracts/mismatch-classifier.md`) |
| `site/js/components/status-badge.js` | Add `mismatchOverride` option to `renderStatusBadge()` |
| `site/js/components/overview.js` | Call classifier; choose warning text per `env.type`; pass `mismatchOverride` to badge |
| `site/js/components/city-detail.js` | Call classifier; name abnormal sub-cities in warning; paint chip dots per abnormal set; pass `mismatchOverride` to badge |
| `site/css/style.css` | Add `.status-dot.mismatch { background: #fcd34d; }` |
| `tests/unit/mismatch-classifier.test.ts` | **NEW** — covers contract rules C1–C14 |
| `tests/e2e/helpers/mismatch-fixtures.ts` | **NEW** — factory functions for scenario-specific `CurrentData` |
| `tests/e2e/version-mismatch.spec.ts` | **NEW** — Playwright tests using `page.route()` injection |
| `specs/025-version-mismatch-info/mockups-before.md` | **NEW** — manual ASCII mockups of current state (per constitution §Development Workflow) |

---

## 3. Local dev loop

```bash
# 1. Serve the static site locally (reads test data from tests/e2e/test-data)
CLEAR_PROXY_FOR_TESTS=1 npx tsx tests/e2e/helpers/generate-test-data.ts
# (Generates tests/e2e/test-data/current.json from mocked backend run.)

# 2. Open the overview
npx http-server site -p 8080 -c-1
# Then browse http://localhost:8080/#/ and http://localhost:8080/#/city/tampere-region

# Iterate on site/js/components/overview.js and site/js/components/city-detail.js
# and reload. No build step required — site is served as vanilla JS ES modules.
```

For a realistic mismatch scenario in the browser while iterating, temporarily edit `tests/e2e/test-data/current.json` by hand: flip `versionMismatch: true` on `tampere-staging` and append a non-matching synthetic snapshot to `mismatchDetails`. Revert before running the test suite.

---

## 4. Validation checklist before committing

Run in order. Each step must pass.

```bash
# 1. Lint + typecheck (fast)
npm run lint
npx tsc --noEmit

# 2. Unit tests (covers the classifier)
npm test -- mismatch-classifier

# 3. Full unit test suite (regression)
npm test

# 4. E2E tests (the authoritative check per constitution §II)
npm run test:e2e

# 5. (Optional) capture "after" mockups for the PR description
npm run capture-views
# See notes in research.md R9 — capture requires temporarily injecting
# a mismatch scenario into the test data.
```

### What each phase validates

| Phase | What it catches |
|-------|-----------------|
| Lint/typecheck | Syntax, unused imports, TS errors in the new test files |
| `mismatch-classifier.test.ts` | Contract rules C1–C14: majority/tied/edge cases, non-OK filtering, coreCommit preference |
| Existing unit tests | No regression in `version-resolver` (unchanged) or other services |
| `version-mismatch.spec.ts` | User stories 1 & 2 end-to-end: warning text, row dot colour, chip dot colour, abnormal sub-city naming, healthy-env-stays-green |
| Existing E2E tests (`overview.spec.ts`, `production-prs.spec.ts`, `auto-refresh.spec.ts`, …) | Regression on the files we edited (overview, city-detail, status-badge) — none of them pass `mismatchOverride` so behaviour should be unchanged |

---

## 5. The exact scenarios the E2E test covers

Each scenario is a standalone test case in `version-mismatch.spec.ts`, set up via `page.route('**/data/current.json', …)` before `page.goto(…)`:

| Test case | Scenario builder | Overview assertion | Detail assertion |
|-----------|------------------|-------------------|------------------|
| `staging-only mismatch` | `buildStagingOnlyMismatchData()` | Tampereen seutu card shows `Versioero havaittu testauksessa`; TESTAUS row dot has class `mismatch`; TUOTANTO row dot has class `ok` | Tampereen seutu staging section warning text contains the abnormal sub-city label; abnormal chip has `status-dot.mismatch`; other chips have `status-dot.ok` |
| `production-only mismatch` | `buildProductionOnlyMismatchData()` | Tampereen seutu card shows `Versioero havaittu tuotannossa`; TUOTANTO row dot has class `mismatch`; TESTAUS row dot has class `ok` | Production section on detail page reflects the mismatch |
| `both envs mismatched` | `buildBothEnvMismatchData()` | Both env warning lines appear; both row dots have class `mismatch` | Both env sections on the detail page each show their own abnormal-sub-city warning |
| `tied 4/4 split` | `buildTiedSplitMismatchData()` | TESTAUS row shows `mismatch` dot; warning text mentions the tied-split fallback copy | Detail page chip list has `mismatch` class on **every** OK chip; warning text uses the tied-split copy |
| `no mismatch` (regression) | `buildNoMismatchData()` | No warning banner present on any city card; all row dots `ok` | No warning on detail page; chip list not rendered |
| `mixed status` (FR-006) | `buildMixedStatusMismatchData()` | Warning present; row dot `mismatch` | Abnormal OK chip has `mismatch` class; `unavailable` chip keeps `unavailable` class (NOT overridden) |

Run just the new spec:

```bash
CLEAR_PROXY_FOR_TESTS=1 npx playwright test tests/e2e/version-mismatch.spec.ts
```

---

## 6. "Before" mockups

Before implementation begins, capture the current state per constitution §Development Workflow → save to `specs/025-version-mismatch-info/mockups-before.md`. See `research.md` R9 — these mockups are written manually from the user-provided screenshots because the default test fixture does not include a mismatch scenario. Two views are required:

1. **Overview — Tampereen seutu card** showing the current generic banner.
2. **City detail — Tampereen seutu** showing the current all-green chip row under the generic banner.

"After" mockups are captured once implementation is done, either via `npm run capture-views` (with temporary test-data injection) or by hand — and the PR description must include both.

---

## 7. Done criteria

All of the following must be true before the PR is ready for review:

- [ ] `mismatch-classifier.js` exists and exports `classifyMismatch` per contract.
- [ ] `overview.js` and `city-detail.js` both call the classifier and branch on its output.
- [ ] `status-badge.js` accepts and honours `mismatchOverride`.
- [ ] `.status-dot.mismatch` CSS class is defined.
- [ ] `mismatch-classifier.test.ts` covers every contract rule (C1–C14) and all tests pass.
- [ ] `version-mismatch.spec.ts` exists and all six scenarios pass.
- [ ] `npm run test:e2e` passes the full suite (no regression in other E2E tests).
- [ ] `npm run lint` and `npx tsc --noEmit` pass.
- [ ] `specs/025-version-mismatch-info/mockups-before.md` exists.
- [ ] "After" mockups generated and attached to the PR description alongside "before" per constitution.
- [ ] PR description includes before/after mockups labelled per view name.
