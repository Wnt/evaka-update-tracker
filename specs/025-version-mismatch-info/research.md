# Phase 0 — Research: More Informative Version Mismatch Indication

**Feature**: 025-version-mismatch-info
**Date**: 2026-04-09

## R1. Where is the current mismatch warning rendered?

- **Overview card** — `site/js/components/overview.js:139-141` inside `renderCityCard()`. A single `<div class="mismatch-warning">Versioero havaittu instanssien välillä</div>` is appended inside every `env-section` whose `env.versionMismatch` flag is true.
- **City detail page** — `site/js/components/city-detail.js:149-159` inside `renderCityDetail()`. Renders the same banner plus a chip list built from `env.mismatchDetails`, each chip using `<span class="status-dot ${v.status}"></span>` where `v.status` is the VersionSnapshot fetch status (always `ok` in a mismatch case because only OK snapshots are compared).
- **Shared environment-row badge** — `site/js/components/status-badge.js:6` renders the green/red/yellow dot plus commit link shown on every `Tuotanto` / `Testaus` row of both the overview and the detail page. This dot's class is `ok`/`unavailable`/`auth-error` and is the only visual indicator of a mismatch's existence today (i.e., today there is **no** visual distinction on the row itself — the row is always green if the representative snapshot was OK).

**Decision**: All changes are confined to these three component files plus `site/css/style.css`. No backend change.

---

## R2. What data is already available to the frontend?

- `data/current.json` — `cityGroups[].environments[]` each have `versionMismatch: boolean` and `mismatchDetails: VersionSnapshot[]`. When `versionMismatch` is false, `mismatchDetails` is an empty array. When true, it contains every OK-status instance's snapshot (with `coreCommit.sha`, `wrapperCommit.sha`, `instanceDomain`, `status`, `checkedAt`).
- **Set by backend** at `src/index.ts:157-163` from `resolveEnvironment()` in `src/services/version-resolver.ts:90-103`. Detection rule: `uniqueShas.size > 1` across `okVersions`.
- **Conclusion**: The existing payload is sufficient for the frontend to derive (a) the majority SHA, (b) the set of abnormal instances, and (c) whether the split is tied. **No backend change is needed.** This matches the spec's Assumption that the data contract is unchanged.

**Decision**: Derive "abnormal instances" purely on the frontend via a new helper module.

---

## R3. Where to extract the majority/abnormal-set logic?

**Options considered**:

1. **Inline inside `overview.js` and `city-detail.js`** — simple but duplicates the tallying logic in two files, violating the constitution's DRY principle (§I).
2. **Add to `status-badge.js`** — misfit; `status-badge` is about rendering a single row, not reasoning about a set of instances.
3. **New small helper module `site/js/lib/mismatch-classifier.js`** ← **Chosen**. Single responsibility: given `mismatchDetails`, return `{ hasMismatch, majoritySha, abnormalInstances, isTied }`. Both components import it.

**Decision**: New file `site/js/lib/mismatch-classifier.js` exporting a single pure function `classifyMismatch(mismatchDetails)`. Testable in isolation; called from both overview and detail components.

### Majority selection algorithm

1. Count OK-status snapshots grouped by (`coreCommit.sha ?? wrapperCommit.sha ?? ''`). Non-OK instances are ignored per FR-006.
2. If there are zero or one groups → `hasMismatch = false`, return early.
3. Find the group with the strictly largest count.
4. If exactly one group has the largest count → that's the `majoritySha`. Every instance not in that group is `abnormal`. `isTied = false`.
5. If two or more groups share the largest count → `isTied = true`, `majoritySha = null`, **every** OK instance is `abnormal` (per FR-007).

This is an O(n) pass with n ≤ ~10 in practice (multi-instance environments are small).

---

## R4. Warning text decisions (Finnish copy)

Per FR-001, FR-004, FR-007, FR-010. Text is Finnish, matches existing style:

| Location | Case | Text |
|----------|------|------|
| Overview card | Mismatch in production env | `Versioero havaittu tuotannossa` |
| Overview card | Mismatch in staging env | `Versioero havaittu testauksessa` |
| City detail | Single abnormal instance (1 odd) | `Versioero havaittu: <instanceLabel>` |
| City detail | Multiple abnormal instances (minority group of N) | `Versioero havaittu: <label1>, <label2>, …` |
| City detail | Tied split (no majority) | `Versioero havaittu — instanssit eivät ole yksimielisiä` |

`<instanceLabel>` follows the existing convention in `city-detail.js:153`: `v.instanceDomain.split('.')[0]`. Improving instance labels to use real city names (e.g., "Nokia" instead of "evaka") is out of scope — it is a pre-existing labelling choice.

**Decision**: Copy defined as above. Only one localisation (Finnish), so strings live inline in the component files next to existing Finnish strings (consistent with the rest of the codebase which does not use a separate i18n module).

---

## R5. Abnormal colour for the status dot

**Constraint**: FR-003 — abnormal indicator must be perceptually distinct from `ok` (green `#22c55e`), `unavailable` (red `#ef4444`), and `auth-error` (dark yellow `#eab308`). Per spec Assumptions, reuse an existing UI colour rather than introducing a new token.

**Candidate**: `#fcd34d` — the exact amber already used as the **border** of the existing `.mismatch-warning` banner (`site/css/style.css:230`). This value is:

- Already in the design system (not a new token per se, but a pre-existing hex literal already used in the file).
- Visibly lighter than `#eab308` auth-error (distinguishable at a glance even when adjacent) while still reading as "yellow/amber".
- Semantically linked to the mismatch banner itself, reinforcing the meaning.

**Decision**: Add a new CSS class `.status-dot.mismatch { background: #fcd34d; }` next to the existing three status-dot variants. The hex literal `#fcd34d` is reused from the mismatch-warning border, not a new token. (If future design work introduces a `--color-mismatch` token, both places can migrate together — out of scope here.)

---

## R6. How to paint the overview env-row dot yellow

`renderStatusBadge(version, ...)` in `status-badge.js:11` hard-codes `<span class="status-dot ${version.status}">...`. Three options for injecting the mismatch override:

1. **Add an optional parameter** `{ mismatchOverride?: boolean }` that, when true AND `version.status === 'ok'`, replaces the dot class with `mismatch`. Non-OK statuses keep their existing class (per FR-006: don't overwrite unavailable/auth-error).
2. **Post-process the returned HTML string** in overview.js/city-detail.js via regex. Fragile; rejected.
3. **Wrap status-badge in a new function** that renders mismatch variants. Adds a new component; overkill.

**Decision**: Option 1. Add a third options field to `renderStatusBadge`. Default is `false` so all existing callers keep current behaviour. Only the overview's environment row passes `true` when `env.versionMismatch` is true.

The city-detail **chip list** (not the row badge) already renders its own dots directly in `city-detail.js:153` — no signature change needed there; just compute the correct class per-chip from the classifier result.

---

## R7. E2E test infrastructure

- Playwright with shared global setup (`tests/e2e/global-setup.ts`) that runs `generateTestData()` once, starts a local HTTP server (`tests/e2e/helpers/server.ts`), and writes `.server-info.json` consumed by `tests/e2e/fixtures.ts`.
- Tests run in parallel against the same server — direct mutation of `tests/e2e/test-data/current.json` would cause flakiness.
- Existing tests live in `tests/e2e/*.spec.ts`. Example: `tests/e2e/overview.spec.ts` (city card rendering), `tests/e2e/production-prs.spec.ts` (city detail).
- **No existing tests exercise `versionMismatch` / `mismatchDetails` rendering.**
- NPM script: `npm run test:e2e` (package.json:10), confirmed by constitution §II.

### Per-test mismatch scenario injection

**Option A**: Modify `generate-test-data.ts` to include a mismatch by default. **Rejected**: affects every existing test's assertions and fixture expectations.

**Option B**: Write scenario-specific `current.json` files to a separate directory and point the test at them. Requires extending the server. **Rejected**: complex.

**Option C** ← **Chosen**: Playwright's `page.route('**/data/current.json', route => route.fulfill({ body: JSON.stringify(scenario) }))` intercepts the fetch per-test and returns a constructed JSON body. No server changes, no cross-test pollution, runs in parallel safely.

**Helper**: Add `tests/e2e/helpers/mismatch-fixtures.ts` exporting factory functions:

- `buildNoMismatchData()` — baseline
- `buildStagingOnlyMismatchData()` — 1 odd staging instance in Tampereen seutu
- `buildProductionOnlyMismatchData()` — 1 odd production instance in Tampereen seutu
- `buildBothEnvMismatchData()` — both envs mismatched in Tampereen seutu
- `buildTiedSplitMismatchData()` — staging 4/4 tied split
- `buildMixedStatusMismatchData()` — 1 odd + 1 unavailable instance (FR-006 regression)

Each factory returns a fully-formed `CurrentData` object; the test file injects it via `page.route()` before `page.goto('#/')`.

### NPM script for running just this test

Existing `npm run test:e2e` runs all E2E tests. For faster local iteration, Playwright supports `npx playwright test tests/e2e/version-mismatch.spec.ts`. No new npm script needed.

---

## R8. Unit-test coverage for the classifier

- Constitution §I requires DRY extraction of shared logic. The classifier is pure and non-trivial — it qualifies for dedicated unit tests.
- No existing frontend unit test harness. Two options:
  1. **E2E-only coverage** (rely on the `buildTiedSplitMismatchData` E2E test). Rejected — E2E tests each scenario via a full browser round trip, which is slow and over-kill for verifying tally logic edge cases like 3-way splits, empty arrays, etc.
  2. **Add Node-level unit tests** for the classifier using the existing Jest infrastructure. ← **Chosen**. The classifier is a vanilla-JS ES module that can be `import`ed by a `.test.ts` file in `tests/unit/`. This matches the existing `tests/unit/version-resolver.test.ts` pattern.

**Decision**: Add `tests/unit/mismatch-classifier.test.ts` with cases for: no mismatch, 1 odd / majority, multi-odd / majority, 3-way split with clear majority, tied 4/4 split, tied 3/3/3 split, empty array, single OK instance with others unavailable, non-OK instances excluded.

---

## R9. Before/after mockup capture (constitution §Development Workflow)

- `npm run capture-views` (`scripts/capture-views.ts`) runs against the default E2E test fixture, which currently has **no** mismatch — so it cannot capture the "before mismatch warning" state out-of-the-box.
- **Decision**: Write manual ASCII/markdown mockups for the "before" state in `specs/025-version-mismatch-info/mockups-before.md`, based on the user-provided screenshots. These show:
  - Overview: Tampereen seutu card with the generic `Versioero havaittu instanssien välillä` banner.
  - City detail: Tampereen seutu staging section with 9 all-green chips under a `Versioero havaittu` banner.
- **After** mockups will be produced by modifying `scripts/capture-views.ts` (or a new one-off helper) to inject a mismatch scenario via the same `page.route()` trick during capture, then run `npm run capture-views -- --filter version-mismatch` (or similar). Alternatively, regenerate manually — acceptable per the constitution. This is a post-implementation task and is deferred to the tasks phase.

---

## R10. Regression surface

Files this feature touches and the tests that already exercise them:

| File | Existing tests (will re-run unchanged) |
|------|----------------------------------------|
| `site/js/components/overview.js` | `tests/e2e/overview.spec.ts`, `tests/e2e/auto-refresh.spec.ts` |
| `site/js/components/city-detail.js` | `tests/e2e/production-prs.spec.ts`, `tests/e2e/history.spec.ts` |
| `site/js/components/status-badge.js` | transitively via both of the above |
| `site/css/style.css` | any Playwright assertion on `.status-dot` classes |

Risk: the new optional `mismatchOverride` parameter on `renderStatusBadge` is opt-in (default `false`), so all existing call sites remain unchanged in behaviour. No backend changes, no data-format changes.

---

## Summary of decisions

1. **Frontend-only change.** No edits to `src/services/version-resolver.ts`, `src/index.ts`, or `data/*.json`.
2. **New helper module** `site/js/lib/mismatch-classifier.js` encapsulates the majority/abnormal tallying (DRY, testable).
3. **New CSS class** `.status-dot.mismatch { background: #fcd34d; }` reusing the mismatch-warning banner's existing amber colour.
4. **Small extension** to `renderStatusBadge` (new `mismatchOverride` option) so the overview env row dot can be painted abnormal without duplicating badge markup.
5. **Finnish warning copy** defined in R4, inlined in components (consistent with codebase convention).
6. **E2E coverage** via a new `tests/e2e/version-mismatch.spec.ts` that uses `page.route()` to inject scenario-specific `current.json` payloads — no backend fixture changes, parallel-safe.
7. **Unit coverage** for the classifier in `tests/unit/mismatch-classifier.test.ts` to nail the edge cases cheaply.
8. **Before mockups** written manually from screenshots; after mockups captured post-implementation.
