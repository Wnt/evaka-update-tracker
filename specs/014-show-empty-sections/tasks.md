# Tasks: Show Empty Sections

**Input**: Design documents from `/specs/014-show-empty-sections/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Not requested. Frontend visual change; constitution permits manual verification for frontend components without complex logic.

**Organization**: Single user story, single file change. Minimal phase structure.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - Empty Sections Show Informative Messages (Priority: P1) MVP

**Goal**: Always render all three PR sections (production, staging, awaiting deployment) on the city detail page, showing a Finnish empty-state message when no PRs exist instead of hiding the section entirely.

**Independent Test**: Open a city detail page where one or more sections have no PRs. Verify all three section headings are visible and empty sections display contextual Finnish messages.

### Implementation for User Story 1

- [x] T001 [US1] Refactor production section rendering to always show the section container with heading in `site/js/components/city-detail.js`. When both `wrapperProdList` and `coreProdList` are empty, render `<div class="empty-state">Ei viimeaikaisia tuotantomuutoksia</div>` inside the `production-section` div instead of omitting the section entirely.

- [x] T002 [US1] Refactor staging section rendering to always show the section container with heading in `site/js/components/city-detail.js`. When `mergedStaging` is empty, render `<div class="empty-state">Ei muutoksia testauksessa</div>` inside the `staging-section` div instead of omitting the section entirely.

- [x] T003 [US1] Refactor pending deployment section rendering to always show the section container with heading in `site/js/components/city-detail.js`. When `mergedPending` is empty, render `<div class="empty-state">Ei odottavia muutoksia</div>` inside the `pending-section` div instead of omitting the section entirely.

- [x] T004 [US1] Verify lint passes by running `npm run lint` and fix any formatting issues in `site/js/components/city-detail.js`.

**Checkpoint**: All three sections visible on every city detail page. Empty sections show contextual Finnish messages. Sections with data render identically to before.

---

## Phase 2: Polish & Cross-Cutting Concerns

- [x] T005 Run full validation per `specs/014-show-empty-sections/quickstart.md`: build site, open city detail pages, confirm all acceptance scenarios from spec.md pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies -- can start immediately (single file, no setup needed)
- **Phase 2 (Polish)**: Depends on Phase 1 completion

### Within Phase 1

- T001, T002, T003 modify the same file (`city-detail.js`) and should be executed sequentially
- T004 depends on T001-T003 completion

### Parallel Opportunities

- T001, T002, T003 are logically independent changes but target the same file, so they must be sequential
- In practice, all three changes are small enough to be done in a single editing pass

---

## Implementation Strategy

### MVP (Complete Feature)

1. Edit `site/js/components/city-detail.js` -- refactor all three sections (T001-T003)
2. Lint check (T004)
3. Manual verification (T005)

This feature is small enough that the MVP is the complete feature.

---

## Notes

- Single file change: `site/js/components/city-detail.js`
- No CSS changes needed -- reuses existing `.empty-state` class
- No data model changes -- same data, different rendering logic
- Finnish messages decided in research.md
