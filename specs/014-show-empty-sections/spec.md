# Feature Specification: Show Empty Sections

**Feature Branch**: `014-show-empty-sections`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "if there are no changes waiting deployment or no changes between prod and test/staging, that should not skip the section, but instead show the section with an informative message"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Empty Sections Show Informative Messages (Priority: P1)

A user navigates to a city detail page where there are no changes waiting for deployment. Instead of the "Odottaa julkaisua" section being completely absent, the section heading is still visible with a message like "Ei odottavia muutoksia" (No pending changes). This helps the user understand that data was checked and nothing is pending, rather than wondering if the section failed to load or was forgotten.

**Why this priority**: Core value of the feature -- all three PR sections (production, staging, awaiting deployment) must always be visible so users can confidently assess the deployment status at a glance.

**Independent Test**: Navigate to a city detail page where one or more sections have no PR data and verify section headings and informative messages appear.

**Acceptance Scenarios**:

1. **Given** a city with no PRs awaiting deployment, **When** the user views the city detail page, **Then** the "Odottaa julkaisua" section is displayed with the heading and a message indicating there are no pending changes.
2. **Given** a city with no PRs in staging/testing, **When** the user views the city detail page, **Then** the "Muutokset testauksessa" section is displayed with the heading and a message indicating there are no changes in testing.
3. **Given** a city with no recent production deployment PRs, **When** the user views the city detail page, **Then** the "Viimeisimmät muutokset tuotantoympäristössä" section is displayed with the heading and a message indicating no recent production changes are available.
4. **Given** a city with PRs in all three sections, **When** the user views the city detail page, **Then** PR lists are shown as before with no behavioral change.

---

### Edge Cases

- What happens when a section has PRs but all are bot PRs and the bot toggle is off? The existing "Ei viimeaikaisia manuaalisia PR:ia" message in the PR list component already handles this; the section heading should still be visible.
- What happens when data is loading or unavailable? The existing empty-state handling for missing data remains unchanged; this feature only affects sections where data was successfully fetched but contains zero items.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The city detail page MUST always display the "Viimeisimmät muutokset tuotantoympäristössä" (Recent production changes) section heading, even when no production PRs exist.
- **FR-002**: The city detail page MUST always display the "Muutokset testauksessa" (Changes in testing) section heading, even when no staging PRs exist.
- **FR-003**: The city detail page MUST always display the "Odottaa julkaisua" (Awaiting deployment) section heading, even when no pending PRs exist.
- **FR-004**: When a section has no items to display, the system MUST show a contextually appropriate empty-state message beneath the section heading (in Finnish, consistent with the existing UI language).
- **FR-005**: The empty-state messages MUST be visually consistent with the existing empty-state styling used elsewhere in the application.
- **FR-006**: Sections with PR data MUST continue to display as they do currently, with no change in behavior.

## Assumptions

- Empty-state messages will be in Finnish, matching the current UI language.
- The overview/card view is not in scope -- only the city detail page sections are affected.
- The existing `empty-state` CSS class and pattern (already used in the PR list component) will be reused for consistency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three PR sections (production, staging, awaiting deployment) are visible on every city detail page, regardless of whether they contain PR data.
- **SC-002**: Users can distinguish between "no data available" and "section not applicable" -- the message clearly communicates that no changes exist in that category.
- **SC-003**: Existing pages with PR data in all sections display identically to before the change.
