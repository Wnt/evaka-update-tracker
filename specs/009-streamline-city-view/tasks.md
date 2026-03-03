# Tasks: Streamline City & Overview Page Layout

**Input**: Design documents from `/specs/009-streamline-city-view/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Data Pipeline — Labels Support)

**Purpose**: Extend the data pipeline to collect and store PR labels from GitHub. These changes modify shared types and must be complete before running the backfill script (US3) and before the ongoing pipeline can collect labels for new PRs.

- [x] T001 [P] Add `labels: string[]` field to the `PullRequest` interface in `src/types.ts`
- [x] T002 [P] Add `labels: Array<{ name: string }>` field to the `GitHubPR` interface in `src/api/github.ts`
- [x] T003 Map `ghPR.labels.map(l => l.name)` into the PR object in `extractPRsFromCommits()` in `src/services/pr-collector.ts` (depends on T001, T002)
- [x] T004 Update existing test fixtures to include `labels: []` on all PullRequest objects across test files (run `npm test` to find all affected fixtures)

**Checkpoint**: Pipeline now collects labels for new PRs. Existing data still lacks labels. `npm run typecheck && npm test` should pass.

---

## Phase 2: User Story 1 — Meaningful Deployment Summary (Priority: P1) 🎯 MVP

**Goal**: Replace commit SHAs with the latest non-bot PR title on the "Tuotanto" and "Staging / Testi" lines. Include Finnish weekday name in the dates.

**Independent Test**: Open any city page and verify the status lines show a human-readable PR title (e.g., "Korjataan lähetetyn tuloselvityksen muokkaustilan datan päivittäminen") instead of a commit SHA (e.g., "8216e17"), and dates include weekday (e.g., "ti 25.2. klo 14.47").

### Implementation for User Story 1

- [x] T005 [US1] Modify `renderStatusBadge()` in `site/js/components/status-badge.js` to accept an optional `latestPRTitle` parameter in the options object. When provided and non-empty, display the PR title text instead of the commit `shortSha`. Keep the link pointing to the GitHub commit URL. Add `text-overflow: ellipsis` and `max-width` for truncation on long titles. Fall back to `shortSha` when `latestPRTitle` is null/empty.
- [x] T006 [US1] Update `formatTime()` in `site/js/components/status-badge.js` to include the Finnish weekday. Change the `toLocaleString` options to produce format like "ti 25.2. klo 14.47" by adding `weekday: 'short'` and adjusting month/day formatting to use numeric with dot separator.
- [x] T007 [US1] Update `renderCityDetail()` in `site/js/components/city-detail.js` to find the latest non-bot PR title for each environment and pass it to `renderStatusBadge()` as `latestPRTitle`. For production environments: use the first non-bot PR from `getRecentProductionPRs()` results (core preferred, then wrapper). For staging environments: use the first non-bot PR from `city.prTracks.core.inStaging` or `city.prTracks.wrapper.inStaging`.
- [x] T008 [US1] Update `renderCityCard()` in `site/js/components/overview.js` to find the latest non-bot PR title for each environment and pass it to `renderStatusBadge()` as `latestPRTitle`. For production: use first item from `city.prTracks.core.deployed` (already filtered to non-bot). For staging: use first non-bot from `city.prTracks.core.inStaging`.
- [x] T009 [P] [US1] Add CSS in `site/css/style.css` for the PR title display in status badges: `.status-badge .pr-description` class with `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`, and appropriate `max-width` to prevent overflow.

**Checkpoint**: City and overview pages show PR titles instead of commit SHAs, with Finnish weekday dates. Verify fallback to SHA when no PR data exists.

---

## Phase 3: User Story 2 — Collapsible PR Detail Sections (Priority: P2)

**Goal**: Make the production, staging, and pending PR sections collapsible using native `<details>`/`<summary>` elements. Production collapsed by default, staging and pending expanded by default.

**Independent Test**: Open a city page. The production section header is visible but content is hidden. Click it to expand. Staging and pending sections are already expanded. Click them to collapse.

### Implementation for User Story 2

- [x] T010 [US2] Wrap the production, staging, and pending PR sections in `renderCityDetail()` in `site/js/components/city-detail.js` with `<details>` and `<summary>` elements. The production `<details>` has no `open` attribute (collapsed by default). The staging and pending `<details>` have the `open` attribute (expanded by default). Move the `<h4>` heading text into the `<summary>` element.
- [x] T011 [P] [US2] Add CSS in `site/css/style.css` for the collapsible sections: style `details` within `.production-section`, `.staging-section`, `.pending-section` with appropriate padding/margins. Style `summary` elements with cursor pointer, and customize the disclosure triangle via `summary::marker` or `details > summary { list-style: ... }`. Ensure the section background colors and borders are preserved on the `<details>` wrapper.

**Checkpoint**: All three PR sections are collapsible. Production is collapsed by default. Staging and pending are expanded. Visual styling matches the existing section appearance.

---

## Phase 4: User Story 3 — Color-Coded PR Labels (Priority: P3)

**Goal**: Display color-coded Finnish-language label badges on core PRs. Create and run a backfill script to add labels to existing history and current data.

**Independent Test**: Open a city page and verify that core PRs with known labels (bug, enhancement, tech, breaking) show compact colored badges with Finnish text (Korjaus, Parannus, Tekninen, Päivitystoimia). PRs without labels show no badge.

### Implementation for User Story 3

- [x] T012 [US3] Create `scripts/backfill-labels.ts` that: (1) initializes the GitHub client using `GH_TOKEN` from env/`.env`, (2) reads `data/history.json` and `data/current.json`, (3) collects all unique `(repository, prNumber)` pairs from every PR object in both files, (4) for each unique PR calls `getPullRequest()` and extracts `labels[].name`, (5) updates all matching PR objects in both files with the `labels: string[]` array, (6) writes the updated files back. Include progress logging (e.g., "Fetching labels for PR #8632 from espoon-voltti/evaka... [15/300]"). Reuse `initGitHubClient()` from `src/api/github.ts`.
- [x] T013 [US3] Add `"backfill-labels"`: "npx tsx scripts/backfill-labels.ts"` to the `scripts` section of `package.json`
- [x] T014 [US3] Run `npm run backfill-labels` (BLOCKED: requires GH_TOKEN — run manually) to enrich `data/history.json` and `data/current.json` with label data. Verify by spot-checking a few PRs in the JSON (e.g., search for known labeled PRs in the core repo).
- [x] T015 [P] [US3] Add label badge rendering to `renderPRList()` in `site/js/components/pr-list.js`. Define a `LABEL_MAP` constant mapping GitHub label names to `{ text, cssClass }`: `bug` → `{ text: 'Korjaus', cssClass: 'label-bug' }`, `enhancement` → `{ text: 'Parannus', cssClass: 'label-enhancement' }`, `tech` → `{ text: 'Tekninen', cssClass: 'label-tech' }`, `breaking` → `{ text: 'Päivitystoimia', cssClass: 'label-breaking' }`. For each PR, iterate over `pr.labels || []`, look up the map, and render `<span class="pr-label ${cssClass}">${text}</span>` for each match. Place badges between the PR title and the bot label/author.
- [x] T016 [P] [US3] Add CSS in `site/css/style.css` for label badges: `.pr-label` base styles (font-size: 0.7rem, padding: 1px 6px, border-radius: 3px, font-weight: 500, white-space: nowrap). Color variants: `.label-bug` (background: #fef2f2, color: #dc2626), `.label-enhancement` (background: #f0fdf4, color: #16a34a), `.label-tech` (background: #f3f4f6, color: #4b5563), `.label-breaking` (background: #fef2f2, color: #991b1b, font-weight: 600).

**Checkpoint**: Label badges appear on PRs that have labels. Data files contain labels. Pipeline collects labels for new PRs going forward.

---

## Phase 5: User Story 4 — Dynamic Browser Tab Title (Priority: P4)

**Goal**: Browser tab/window title updates to reflect the current view when navigating.

**Independent Test**: Navigate between Overview, a city detail, and a city history view. The browser tab title should update each time (e.g., "Tampereen seutu - eVaka muutostenseuranta").

### Implementation for User Story 4

- [x] T017 [US4] Set `document.title` in each route handler in `site/js/app.js`: In `handleOverview()` set title to `"Yleiskatsaus - eVaka muutostenseuranta"`. In `handleCityDetail()` set title to `"${city.name} - eVaka muutostenseuranta"` (using the resolved city group's name). In `handleCityHistory()` set title to `"Muutoshistoria - ${city.name} - eVaka muutostenseuranta"`.

**Checkpoint**: Browser tab title updates on every navigation. Verify all three views.

---

## Phase 6: User Story 5 — Hidden Author Names (Priority: P5)

**Goal**: Author names in PR lists are hidden by default and revealed on hover. Touch devices show authors always.

**Independent Test**: Open a city page with PR lists. Author names should not be visible. Hover over a PR row — the author name fades in. Move away — it fades out. On mobile/touch, authors should always be visible.

### Implementation for User Story 5

- [x] T018 [US5] Add CSS in `site/css/style.css` for author hover behavior: `.pr-author { opacity: 0; transition: opacity 0.2s ease; }` and `.pr-item:hover .pr-author { opacity: 1; }`. Add touch device fallback: `@media (hover: none) { .pr-author { opacity: 1; } }`.

**Checkpoint**: Authors hidden by default, visible on hover, always visible on touch devices. No layout shifts.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all stories.

- [x] T019 Run full CI validation: `npm run typecheck && npm test && npm run lint`
- [ ] T020 Visual verification: serve the site locally and check all city pages, overview page, and history view for correct rendering of all changes (PR titles on status lines, weekday dates, collapsible sections, label badges, hidden authors, dynamic tab title)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS Phase 4 (US3 backfill script).
- **US1 (Phase 2)**: No dependencies on Phase 1 — can start immediately in parallel with Foundational.
- **US2 (Phase 3)**: No dependencies — can start immediately.
- **US3 (Phase 4)**: Depends on Phase 1 (Foundational) completion for backfill script. Frontend tasks (T015, T016) can start in parallel once T014 is complete.
- **US4 (Phase 5)**: No dependencies — can start immediately.
- **US5 (Phase 6)**: No dependencies — can start immediately.
- **Polish (Phase 7)**: Depends on ALL user stories being complete.

### User Story Independence

All user stories are fully independent of each other:

- **US1** modifies `status-badge.js`, `city-detail.js` (env sections), `overview.js` (env sections)
- **US2** modifies `city-detail.js` (PR sections — different code from US1), CSS
- **US3** modifies `pr-list.js`, CSS, creates `scripts/backfill-labels.ts`
- **US4** modifies `app.js` only
- **US5** modifies CSS only

No two user stories modify the same function or DOM structure. CSS additions are additive and non-conflicting.

### Parallel Opportunities

```
Time →
───────────────────────────────────────────────────
Phase 1: T001 ─┬─ T002 (parallel) → T003 → T004
               │
Phase 2: T005 ─┤─ T006 → T007 → T008     T009 (parallel w/ T005-T008)
               │
Phase 3: T010 ─┤──────────────────────── T011 (parallel)
               │
Phase 4:       └─ (after T004) → T012 → T013 → T014 → T015 + T016 (parallel)
               │
Phase 5: T017 ─┤  (can start immediately)
               │
Phase 6: T018 ─┘  (can start immediately)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational (T001–T004) — pipeline starts collecting labels
2. Complete Phase 2: User Story 1 (T005–T009) — PR titles replace SHAs, Finnish weekdays
3. **STOP and VALIDATE**: Verify city and overview pages show meaningful text instead of commit hashes
4. This single change delivers the highest stakeholder value

### Incremental Delivery

1. US1: PR titles + weekdays → immediate stakeholder clarity (highest value)
2. US2: Collapsible sections → decluttered layout
3. US3: Label badges + backfill → stakeholders can scan PR types at a glance
4. US4: Dynamic titles → multi-tab usability
5. US5: Hidden authors → final visual polish
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- CSS tasks are additive — all CSS changes in `style.css` target different selectors and can be done in any order
- The backfill script (T012) must be run once (T014) before label badges will appear on existing data
- Frontend handles missing `labels` field gracefully (`pr.labels || []`) for backward compatibility
