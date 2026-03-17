# Tasks: Add PR Tags to Slack Announcements

**Input**: Design documents from `/specs/022-add-pr-tags-slack/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared label mapping module that both user stories depend on

- [ ] T001 Create label mapping module with `SLACK_LABEL_MAP` constant and `formatLabelTags()` function in `src/config/label-map.ts`
- [ ] T002 Create unit tests for `formatLabelTags()` covering: single label, multiple labels, no labels, unmapped labels, undefined/empty input in `tests/unit/label-map.test.ts`

**Checkpoint**: Shared label mapping is available and tested

---

## Phase 2: User Story 1 - PR Tags in Deployment Notifications (Priority: P1) 🎯 MVP

**Goal**: Display Finnish-translated label tags in Slack Block Kit deployment notifications

**Independent Test**: Trigger a deployment notification for PRs with known labels and verify tags appear in the Slack message body

### Implementation for User Story 1

- [ ] T003 [US1] Update `buildChangesSection()` in `src/api/slack.ts` to import `formatLabelTags` and prepend label tags to each PR line (after `#NUMBER`, before title)
- [ ] T004 [US1] Add integration tests for labels in deployment notifications in `tests/integration/slack-api.test.ts`: PR with single label, multiple labels, no labels, unmapped labels

**Checkpoint**: Deployment notifications show label tags — User Story 1 is complete and testable

---

## Phase 3: User Story 2 - PR Tags in Change Announcements (Priority: P2)

**Goal**: Display Finnish-translated label tags in plain-text Slack change announcements

**Independent Test**: Trigger a change announcement for PRs with labels and verify tags appear

### Implementation for User Story 2

- [ ] T005 [US2] Update `buildChangeAnnouncement()` in `src/services/change-announcer.ts` to import `formatLabelTags` and prepend label tags to each PR line (after `#NUMBER`, before title)
- [ ] T006 [US2] Add unit tests for labels in change announcements in `tests/unit/change-announcer.test.ts`: PR with single label, multiple labels, no labels

**Checkpoint**: Change announcements show label tags — User Story 2 is complete and testable

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Ensure backend-frontend mapping consistency (SC-003) and validate all tests pass

- [ ] T007 Create cross-check test in `tests/cross-check/label-map-sync.test.ts` that reads `SLACK_LABEL_MAP` from backend and `LABEL_MAP` from `site/js/components/pr-list.js`, verifying identical text values for all keys
- [ ] T008 Run full test suite (`npm test`) and fix any failures
- [ ] T009 Run lint (`npm run lint`) and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on Phase 1 (needs `formatLabelTags`)
- **User Story 2 (Phase 3)**: Depends on Phase 1 (needs `formatLabelTags`), independent of Phase 2
- **Polish (Phase 4)**: Depends on Phases 2 and 3

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Phase 1 — no dependency on US2
- **User Story 2 (P2)**: Depends only on Phase 1 — no dependency on US1
- User Stories 1 and 2 can run in parallel after Phase 1

### Parallel Opportunities

- T003 and T005 can run in parallel (different files: `slack.ts` vs `change-announcer.ts`)
- T004 and T006 can run in parallel (different test files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Create shared label mapping
2. Complete Phase 2: Add tags to deployment notifications
3. **STOP and VALIDATE**: Run tests, verify deployment notification format
4. Deploy if ready — change announcements can follow later

### Full Delivery

1. Phase 1: Shared mapping → Phase 2: Deployment notifications → Phase 3: Change announcements → Phase 4: Polish
2. Each phase adds value without breaking previous functionality

---

## Notes

- The label mapping in `src/config/label-map.ts` must exactly match the `text` values in `site/js/components/pr-list.js` `LABEL_MAP`
- Tag format: `[FinnishName]` with space separation for multiple tags
- Tag placement: after PR number link, before title (per research.md R1)
- Empty/missing labels produce empty string — no extra whitespace
