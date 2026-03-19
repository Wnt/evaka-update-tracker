# Tasks: Slack Staging Details

**Input**: Design documents from `/specs/023-slack-staging-details/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Tests are included — extending existing integration test file with new scenarios.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Shared type definition needed by both user stories

- [ ] T001 Add `StagingContext` interface to `src/types.ts` with fields `inStagingCount: number` and `productionAvailable: boolean`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the staging context data from the pipeline to the Slack notification call site

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add optional `stagingContext` parameter to `sendSlackNotification()` in `src/api/slack.ts` and forward it to `buildSlackMessage()` — both functions get `stagingContext?: StagingContext` as a new last parameter. No behavioral changes yet; just pass the value through.
- [ ] T003 Compute `StagingContext` at the Slack notification call site in `src/index.ts`: when sending notifications for a non-production environment, look up the city group's `prTracks` from `cityGroupsData`, sum `core.inStaging` + `wrapper?.inStaging` (filtering out `isHidden` PRs), check if a production environment exists for the city group, and pass the resulting `StagingContext` to `sendSlackNotification()`. For production environment notifications, do not pass `stagingContext`.

**Checkpoint**: Foundation ready — `buildSlackMessage()` receives `stagingContext` but doesn't use it yet

---

## Phase 3: User Story 1 — Production Comparison Count in Staging Notifications (Priority: P1) 🎯 MVP

**Goal**: When a staging environment is updated, the Slack notification shows how many additional PRs exist compared to production.

**Independent Test**: Trigger a staging deployment notification for a city group with known staging/production differences and verify the message includes the correct comparison count text.

### Tests for User Story 1

- [ ] T004 [P] [US1] Add test in `tests/integration/slack-api.test.ts`: staging notification with `stagingContext { inStagingCount: 5, productionAvailable: true }` includes `+5 muutosta verrattuna tuotantoon` in the context block
- [ ] T005 [P] [US1] Add test in `tests/integration/slack-api.test.ts`: staging notification with `stagingContext { inStagingCount: 1, productionAvailable: true }` includes `+1 muutos verrattuna tuotantoon` (singular form)
- [ ] T006 [P] [US1] Add test in `tests/integration/slack-api.test.ts`: staging notification with `stagingContext { inStagingCount: 0, productionAvailable: true }` includes `Sama versio kuin tuotannossa`
- [ ] T007 [P] [US1] Add test in `tests/integration/slack-api.test.ts`: staging notification with `stagingContext { inStagingCount: 0, productionAvailable: false }` omits the comparison text entirely from the context block
- [ ] T008 [P] [US1] Add test in `tests/integration/slack-api.test.ts`: production notification (no `stagingContext`) has no comparison text — context block contains only the dashboard link (verifies FR-006)

### Implementation for User Story 1

- [ ] T009 [US1] Implement staging comparison text in `buildSlackMessage()` in `src/api/slack.ts`: when `stagingContext` is provided and `productionAvailable` is true, add a `mrkdwn` element to the context block (before the dashboard link) with the comparison text. Use `+N muutosta verrattuna tuotantoon` for N > 1, `+1 muutos verrattuna tuotantoon` for N = 1, and `Sama versio kuin tuotannossa` for N = 0. When `productionAvailable` is false or `stagingContext` is undefined, do not add the element.

**Checkpoint**: User Story 1 complete — staging notifications show comparison count, production notifications unchanged

---

## Phase 4: User Story 2 — Descriptive Dashboard Link Text (Priority: P2)

**Goal**: The dashboard link in staging notifications uses descriptive, city-name-aware text instead of the generic "Ympäristöjen tiedot".

**Independent Test**: Trigger a staging deployment notification and verify the link text includes the city name and is more descriptive than the current generic label.

### Tests for User Story 2

- [ ] T010 [P] [US2] Add test in `tests/integration/slack-api.test.ts`: staging notification for city group `espoo` has link text `Katso Espoo ympäristöjen tilanne` instead of `Ympäristöjen tiedot`
- [ ] T011 [P] [US2] Add test in `tests/integration/slack-api.test.ts`: production notification for city group `espoo` still uses the original `Ympäristöjen tiedot` link text (verifies FR-006)

### Implementation for User Story 2

- [ ] T012 [US2] Update the context block in `buildSlackMessage()` in `src/api/slack.ts`: for non-production notifications, change the dashboard link text from `Ympäristöjen tiedot` to `Katso ${cityName} ympäristöjen tilanne`. Keep the existing generic link text for production notifications.

**Checkpoint**: Both user stories complete — staging notifications have comparison count and descriptive link text

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation and cleanup

- [ ] T013 Run `npm test` to verify all existing and new tests pass
- [ ] T014 Run `npm run lint` to verify no linting errors
- [ ] T015 Run quickstart.md validation: execute `DRY_RUN=true npx ts-node src/index.ts` and verify staging notifications in console output mention the staging context

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion — can run in parallel with US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — no dependencies on US1, touches same file (`src/api/slack.ts`) but different code section (context block link text vs. context block comparison element)

### Within Each User Story

- Tests FIRST → implementation → verify tests pass
- All test tasks marked [P] can run in parallel within a story

### Parallel Opportunities

- T004, T005, T006, T007, T008 can all run in parallel (independent test cases in same file)
- T010, T011 can run in parallel
- US1 and US2 can potentially be implemented in parallel (different sections of `buildSlackMessage()`)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together:
Task: T004 "Test staging context with 5 PRs shows plural form"
Task: T005 "Test staging context with 1 PR shows singular form"
Task: T006 "Test staging context with 0 PRs shows in-sync message"
Task: T007 "Test staging context with unavailable production omits comparison"
Task: T008 "Test production notification has no comparison text"

# Then implement:
Task: T009 "Implement comparison text in buildSlackMessage()"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003)
3. Complete Phase 3: User Story 1 (T004-T009)
4. **STOP and VALIDATE**: Run `npm test` — all staging comparison scenarios pass
5. Deploy if ready — staging notifications now show comparison count

### Incremental Delivery

1. Setup + Foundational → Types and wiring ready
2. Add User Story 1 → Comparison count in staging notifications (MVP!)
3. Add User Story 2 → Descriptive link text
4. Polish → Full validation

---

## Notes

- [P] tasks = different files or independent test cases, no dependencies
- [Story] label maps task to specific user story for traceability
- All changes confined to 4 existing files: `src/types.ts`, `src/api/slack.ts`, `src/index.ts`, `tests/integration/slack-api.test.ts`
- No new dependencies, no new env vars, no workflow YAML changes needed
- Finnish text must use correct singular/plural: `muutos` (1) vs `muutosta` (2+)
