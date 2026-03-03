# Tasks: Redesign City Deployment View

**Input**: Design documents from `/specs/005-redesign-deployment-view/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: No automated tests requested. Frontend visual components verified by manual review per constitution (Principle II).

**Organization**: Tasks grouped by user story. All changes are frontend-only (5 files modified, no new files).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US5) this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Component-level enhancements that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Extend `renderPRList()` with `limit` and `showRepoLabel` options in site/js/components/pr-list.js — add optional `limit` parameter (truncates list after bot filtering) and `showRepoLabel` flag (renders `<span class="repo-label">[core]</span>` or `[wrapper]` before PR title using each PR's existing `repoType` field)
- [x] T002 [P] Add `.repo-label` and `.staging-section` CSS styles in site/css/style.css — add `.repo-label` (inline badge, small font, muted color, monospace) and `.staging-section` (blue-tinted background analogous to existing `.pending-section` and `.production-section`)
- [x] T003 [P] Add `mergeAndSortPRs()` helper function in site/js/components/city-detail.js — takes `(corePRs, wrapperPRs, { showBots })`, concatenates arrays, filters by `isBot` if `!showBots`, sorts by `mergedAt` descending, returns sorted array. Used by US2 and US3 for unified lists.

**Checkpoint**: `renderPRList()` supports limit/label options, CSS for new sections exists, merge helper ready

---

## Phase 2: User Story 1 — View Recent Production Commits (Priority: P1) 🎯 MVP

**Goal**: Show last 5 non-bot PRs per repository (core + wrapper) in a "Recent Production Commits" section

**Independent Test**: Open any city page → verify production section shows up to 5 non-bot PRs per repo with "Wrapper" and "Core" sub-headers. Hidden repos (no PRs) omit their sub-header.

### Implementation

- [x] T004 [US1] Rewrite production section in `renderCityDetail()` in site/js/components/city-detail.js — replace the current split "Wrapper — In Production" / "Core — In Production" blocks with a single `.production-section` containing `<h4>Recent Production Commits</h4>`, then per-repo sub-sections with `.pr-track-header` ("Wrapper" / "Core") calling `renderPRList(deployed, { showBots, limit: 5 })`. Omit sub-section if repo has no deployed PRs. Keep existing `.production-section` CSS.

**Checkpoint**: Production section shows 5 non-bot PRs per repo. Bot PRs hidden by default.

---

## Phase 3: User Story 2 — View Unified Staging Changes (Priority: P1)

**Goal**: Show all in-staging PRs from both repos in a single chronological list with `[core]`/`[wrapper]` labels

**Independent Test**: Open a city page with PRs in staging → verify single list, newest first, each labeled with repo type. No grouping by repository.

### Implementation

- [x] T005 [US2] Rewrite staging section in `renderCityDetail()` in site/js/components/city-detail.js — replace separate "Wrapper — In Staging" / "Core — In Staging" blocks with a single `.staging-section` containing `<h4>Changes in Staging</h4>`. Merge `core.inStaging` + `wrapper.inStaging` using `mergeAndSortPRs()`, render with `renderPRList(merged, { showBots, showRepoLabel: true })`. Hide section if no PRs qualify.

**Checkpoint**: Staging section shows unified chronological list with [core]/[wrapper] labels. All items shown (no limit).

---

## Phase 4: User Story 3 — View Awaiting Deployment PRs (Priority: P1)

**Goal**: Show all merged-but-undeployed PRs from both repos in a unified chronological list with `[core]`/`[wrapper]` labels, positioned after staging

**Independent Test**: Open a city page with pending PRs → verify "Awaiting Deployment" section shows unified chronological list at the bottom, each labeled with repo type.

### Implementation

- [x] T006 [US3] Rewrite awaiting deployment section in `renderCityDetail()` in site/js/components/city-detail.js — replace the current grouped Wrapper/Core subsections inside `.pending-section` with a unified list: merge `core.pendingDeployment` + `wrapper.pendingDeployment` using `mergeAndSortPRs()`, render with `renderPRList(merged, { showBots, showRepoLabel: true })`. Keep `.pending-section` CSS (yellow). Hide section if no PRs qualify.
- [x] T007 [US3] Update final layout assembly in `renderCityDetail()` return template in site/js/components/city-detail.js — ensure sections appear in order per FR-015: (1) env badges, (2) bot toggle, (3) production section, (4) staging section, (5) awaiting deployment section. Remove old `wrapperStagingSection`/`coreStagingSection` variables.

**Checkpoint**: All three P1 stories complete. Page shows: env badges → toggle → production (5/repo) → staging (unified) → awaiting (unified). Layout order matches FR-015.

---

## Phase 5: User Story 4 — Toggle Dependency Updates Visibility (Priority: P2)

**Goal**: "Show dependency updates" toggle controls bot PR visibility across all three sections

**Independent Test**: Click toggle → bot PRs appear in production, staging, and awaiting sections. Click again → bot PRs hidden. URL param `showBots=true` persists across navigation.

### Implementation

- [x] T008 [US4] Verify and fix toggle behavior across all sections in site/js/components/city-detail.js — confirm `showBots` flows correctly to: (a) production `renderPRList()` calls with `limit: 5`, (b) staging `mergeAndSortPRs()` + `renderPRList()`, (c) awaiting `mergeAndSortPRs()` + `renderPRList()`. Ensure bot-toggle click triggers full re-render via `setQueryParam`. Update acceptance scenario text in toggle button if needed (e.g., "Hide dependency updates" when active).

**Checkpoint**: Toggle works across all three sections. Bot PRs appear/disappear consistently.

---

## Phase 6: User Story 5 — See Version Change Detection Times (Priority: P2)

**Goal**: Environment status badges show when the current version was first detected, not when the system last polled

**Independent Test**: Compare badge timestamp with `detectedAt` in history.json for the matching environment+commit. Verify fallback to `checkedAt` when no history match exists.

### Implementation

- [x] T009 [P] [US5] Modify `renderStatusBadge()` in site/js/components/status-badge.js — add optional second parameter `{ detectedAt }`. When `detectedAt` is provided and non-null, format and display it instead of `version.checkedAt`. Keep existing `formatTime()` for both. Rename CSS class from `.checked-at` to `.version-time` (or keep `.checked-at` for backward compat).
- [x] T010 [P] [US5] Load `history.json` in `handleCityDetail()` in site/js/app.js — fetch `data/history.json` (with error fallback to `{ events: [] }`), pass `historyEvents` array as third argument to `renderCityDetail(city, { showBots }, historyEvents)`
- [x] T011 [US5] Add `findDetectedAt()` helper and wire detection timestamps in `renderCityDetail()` in site/js/components/city-detail.js — add `findDetectedAt(events, environmentId, commitSha)` that finds the history event where `newCommit.sha === commitSha` and `environmentId` matches, returns `detectedAt` or `null`. Update `renderCityDetail()` signature to accept `historyEvents` parameter. In the env badge rendering loop, call `findDetectedAt()` for each environment and pass result to `renderStatusBadge(env.version, { detectedAt })`.

**Checkpoint**: Status badges show detection timestamps. Fallback to check time when no history match.

---

## Phase 7: Polish & Validation

**Purpose**: Final verification across all stories

- [x] T012 Run `npm test && npm run lint` to verify all changes pass CI gates
- [x] T013 Visual verification across all city tabs per quickstart.md validation checklist — check each city page: production (5/repo), staging (unified), awaiting (unified), toggle works, timestamps show detection times

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on T001 (`limit` option in pr-list.js)
- **US2 (Phase 3)**: Depends on T001 (`showRepoLabel`), T002 (CSS), T003 (`mergeAndSortPRs`)
- **US3 (Phase 4)**: Depends on T003 (`mergeAndSortPRs`); should follow US2 to avoid city-detail.js conflicts
- **US4 (Phase 5)**: Depends on US1+US2+US3 (all sections must exist to verify toggle)
- **US5 (Phase 6)**: Depends on Foundational only; can start in parallel with US1–US3 (different files: status-badge.js, app.js). T011 must follow T004–T007 (city-detail.js dependency).
- **Polish (Phase 7)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational
- **US2 (P1)**: Independent after Foundational; sequential with US1 in city-detail.js
- **US3 (P1)**: Independent after Foundational; sequential with US2 in city-detail.js
- **US4 (P2)**: Depends on US1+US2+US3 complete
- **US5 (P2)**: T009, T010 parallel with US1–US3 (different files); T011 sequential after US3

### Parallel Opportunities

```
Phase 1 (parallel):
  T001 (pr-list.js) | T002 (style.css) | T003 (city-detail.js)

Phase 2-4 (sequential in city-detail.js):
  T004 → T005 → T006 → T007

Phase 5 (after Phase 4):
  T008 (city-detail.js)

Phase 6 (T009+T010 parallel with Phases 2-5, T011 after Phase 4):
  T009 (status-badge.js) | T010 (app.js) — can start during Phase 2
  T011 (city-detail.js) — after T007

Phase 7 (after all):
  T012 → T013
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Foundational (T001–T003)
2. Complete Phase 2: US1 Production Commits (T004)
3. **STOP and VALIDATE**: Verify production section shows 5 non-bot PRs per repo
4. Other sections still render in old format until rewritten

### Incremental Delivery

1. Foundational → T001–T003
2. US1 → T004 → Validate production section
3. US2 → T005 → Validate staging section
4. US3 → T006–T007 → Validate awaiting + final layout order
5. US4 → T008 → Validate toggle across all sections
6. US5 → T009–T011 → Validate detection timestamps
7. Polish → T012–T013 → CI + visual verification

---

## Notes

- All changes are frontend-only — no backend or data file modifications
- city-detail.js is the primary file (touched by T003–T008, T011) — sequential within that file
- pr-list.js, status-badge.js, style.css, app.js are touched by one task each
- `mergeAndSortPRs()` is shared by US2 and US3 (DRY per constitution)
- `findDetectedAt()` is used only by US5 but placed in city-detail.js for locality
- Commit after each task or logical group (per constitution: atomic commits)
