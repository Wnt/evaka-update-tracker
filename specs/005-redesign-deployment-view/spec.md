# Feature Specification: Redesign City Deployment View

**Feature Branch**: `005-redesign-deployment-view`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Redesign per-city deployment page layout to show recent production commits first, then a unified chronological list of staging changes, with improved timestamp semantics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Recent Production Commits (Priority: P1)

A developer opens a city page (e.g., "Tampereen seutu") and immediately sees the most recent meaningful commits deployed to production. The page displays the last 5 non-bot commits from the core repository and the last 5 non-bot commits from the wrapper repository. Each commit is shown as a PR with its number, title, author, and merge date. This gives a quick overview of what's currently running in production.

**Why this priority**: This is the primary information users need — understanding what's currently deployed in production is the most frequent use case.

**Independent Test**: Can be fully tested by navigating to any city page and verifying that production commits from both repositories are displayed, limited to 5 per repo, with bot PRs excluded by default.

**Acceptance Scenarios**:

1. **Given** a city page with production deployment data, **When** the user opens the page, **Then** they see up to 5 non-bot PRs from the core repository and up to 5 non-bot PRs from the wrapper repository in a "Recent Production Commits" section.
2. **Given** a city with fewer than 5 non-bot deployed PRs in one repository, **When** the user views the page, **Then** all available non-bot PRs are shown for that repository (no padding or placeholder).
3. **Given** a city with no deployed PRs for a repository, **When** the user views the page, **Then** that repository sub-section is omitted from the production commits area.

---

### User Story 2 - View Unified Staging Changes (Priority: P1)

A developer wants to see what changes are in the staging/test environment that haven't reached production yet. The page displays all such changes in a single chronological list (newest first), regardless of whether they come from the core or wrapper repository. Each item is labeled with `[core]` or `[wrapper]` to indicate its origin. All items are shown — there is no limit on the number displayed.

**Why this priority**: Equally critical to production view — developers need to see what's queued for production promotion in a unified, time-ordered view.

**Independent Test**: Can be fully tested by verifying the staging section shows all in-staging PRs from both repos merged into a single chronological list with repository labels.

**Acceptance Scenarios**:

1. **Given** a city with PRs in staging from both core and wrapper, **When** the user views the page, **Then** all PRs appear in a single list sorted by merge date (newest first), each prefixed with `[core]` or `[wrapper]`.
2. **Given** a city with 15 PRs in staging, **When** the user views the page, **Then** all 15 are displayed (no truncation or pagination).
3. **Given** a city with no PRs in staging newer than production, **When** the user views the page, **Then** the staging section is either empty with a "No pending changes" message or hidden entirely.

---

### User Story 3 - View Awaiting Deployment PRs (Priority: P1)

A developer wants to track PRs that have been merged (task marked Complete on the kanban board) but haven't been deployed to any environment yet. The page displays all such PRs in a unified chronological list (newest first), with `[core]` or `[wrapper]` labels. This section appears after the staging changes, representing the earliest stage of the deployment pipeline.

**Why this priority**: This is the primary tracking purpose of the tool — seeing how completed tasks progress from merge to deployment. Without this, developers lose visibility into the gap between task completion and first deployment.

**Independent Test**: Can be fully tested by verifying merged-but-undeployed PRs from both repos appear in a single chronological list at the bottom of the page.

**Acceptance Scenarios**:

1. **Given** a city with merged PRs not yet deployed to staging or production, **When** the user views the page, **Then** all such PRs appear in an "Awaiting Deployment" section as a unified chronological list with `[core]`/`[wrapper]` labels.
2. **Given** no PRs are awaiting deployment, **When** the user views the page, **Then** the "Awaiting Deployment" section is hidden or shows an empty state message.
3. **Given** PRs from both core and wrapper are awaiting deployment, **When** the user views the page, **Then** they are interleaved chronologically (newest first) in a single list, not grouped by repository.

---

### User Story 4 - Toggle Dependency Updates Visibility (Priority: P2)

A developer wants to see or hide bot-authored PRs (dependency updates, automated maintenance). A "Show dependency updates" toggle controls visibility of these PRs across the production commits, awaiting deployment, and staging changes sections.

**Why this priority**: Secondary to core viewing — most users want the filtered (non-bot) view by default, but need the ability to inspect bot changes when investigating dependency issues.

**Independent Test**: Can be fully tested by toggling the button and verifying bot PRs appear/disappear in all three sections.

**Acceptance Scenarios**:

1. **Given** the toggle is off (default), **When** the user views the page, **Then** bot PRs are hidden from the production commits, staging changes, and awaiting deployment sections.
2. **Given** the toggle is off, **When** the user clicks "Show dependency updates", **Then** bot PRs become visible in all three sections, interleaved in their chronological position. The production section still shows 5 commits per repo (now potentially including bots among those 5). The staging and awaiting deployment sections show all items including bots.
3. **Given** the toggle is on, **When** the user clicks the toggle again, **Then** bot PRs are hidden again and the view returns to the filtered state.

---

### User Story 5 - See Version Change Detection Times (Priority: P2)

A developer looks at the environment status badges (production SHA, staging SHA) and sees the timestamp of when that version change was first detected by the system — not when the system last polled the environment. This helps understand when deployments actually happened.

**Why this priority**: Improves accuracy of deployment timeline understanding, but is secondary to the core layout redesign.

**Independent Test**: Can be fully tested by comparing displayed timestamps against historical version change detection records.

**Acceptance Scenarios**:

1. **Given** a production environment running commit `abc1234` that was first detected at 14:30, **When** the user views the page, **Then** the production status badge shows "14:30" (the detection time), not the time of the most recent poll.
2. **Given** a fresh deployment with no prior history for the current commit, **When** the user views the page, **Then** the system falls back to displaying the current check time (since no earlier detection record exists).

---

### Edge Cases

- What happens when production and staging are on the same commit? The staging section should show no pending changes (empty or hidden).
- What happens when version history has no record for the current commit? Fall back to the check timestamp.
- What happens when a repository has only bot PRs in production? With toggle off, the repo sub-section in production shows no items and can be hidden. With toggle on, the 5 most recent (all bots) are shown.
- What happens when the same PR appears in multiple data categories? Each PR should appear only once, in its most relevant section.
- What happens when no PRs are awaiting deployment? The "Awaiting Deployment" section is hidden or shows an empty state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The city detail page MUST display a "Recent Production Commits" section showing up to 5 PRs per repository (core and wrapper) that are deployed to production.
- **FR-002**: By default, the production commits section MUST exclude bot-authored PRs (dependency updates). The 5-item limit applies after filtering.
- **FR-003**: The city detail page MUST display a "Changes in Staging" section listing all PRs present in staging that are not yet in production.
- **FR-004**: The staging changes list MUST combine PRs from both core and wrapper repositories into a single list, sorted chronologically (newest first).
- **FR-005**: Each item in the staging changes list MUST display a repository label (`[core]` or `[wrapper]`) indicating its origin.
- **FR-006**: The staging changes list MUST show all qualifying PRs with no count limit.
- **FR-007**: The "Show dependency updates" toggle MUST control visibility of bot-authored PRs across the production, awaiting deployment, and staging sections.
- **FR-008**: The toggle state MUST persist across tab/page navigation within the same session.
- **FR-009**: Environment status badges MUST display the timestamp when the current version was first detected (version change detection time), not the most recent poll time.
- **FR-010**: When no historical detection record exists for the current version, the system MUST fall back to displaying the poll/check timestamp.
- **FR-011**: The city detail page MUST display an "Awaiting Deployment" section listing PRs that have been merged but not yet deployed to any environment (staging or production).
- **FR-012**: The "Awaiting Deployment" list MUST combine PRs from both core and wrapper repositories into a single list, sorted chronologically (newest first), with each item labeled `[core]` or `[wrapper]`.
- **FR-013**: The "Awaiting Deployment" list MUST show all qualifying PRs with no count limit.
- **FR-015**: The page layout order MUST be: (1) environment status badges, (2) "Show dependency updates" toggle, (3) Recent Production Commits, (4) Changes in Staging, (5) Awaiting Deployment.
- **FR-014**: Each PR item MUST display: PR number (linked to source), title, author, and merge date.

### Key Entities

- **Production Commit**: A PR that has been deployed to the production environment. Displayed in the "Recent Production Commits" section, limited to 5 per repository.
- **Staging Change**: A PR deployed to staging/test but not yet in production. Displayed in the unified "Changes in Staging" list with a repository label.
- **Awaiting Deployment PR**: A PR that has been merged but not yet deployed to any environment (staging or production). Displayed in the unified "Awaiting Deployment" list with a repository label.
- **Version Detection Event**: A historical record of when a specific commit was first observed as the active version for an environment. Used to display accurate deployment timestamps.

## Clarifications

### Session 2026-03-03

- Q: Should "Awaiting Deployment" use the same unified chronological format as the staging section? → A: Yes, unified chronological list with `[core]`/`[wrapper]` labels (same format as staging).
- Q: Where should "Awaiting Deployment" appear in the page layout? → A: After staging (layout order: production → staging → awaiting deployment) — pipeline proximity order.

## Assumptions

- "5 commits of both core and wrapper" means 5 from core AND 5 from wrapper (up to 10 total in the production section), displayed as separate sub-lists within the same section.
- The "Awaiting deployment" section (PRs merged but not yet deployed to staging or production) is retained, as this tool's primary purpose is tracking how updates land into environments after tasks are marked Complete on the team kanban board.
- "Chronological order" for staging changes means newest first (most recent merges at top), matching the convention for deployment trackers.
- The environment status header (showing production SHA, staging SHA with status indicators) is retained, but timestamps change to detection times.
- The Deployment History link remains available.
- The city tab navigation and overall page structure outside the city detail content area remain unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the 5 most recent production changes per repository within 5 seconds of opening a city page.
- **SC-002**: Users can see all staging changes not yet in production in a single unified view without scrolling between separate sections or switching between repository filters.
- **SC-003**: The "Show dependency updates" toggle correctly shows or hides bot-authored PRs across all sections of the page within 1 second of clicking.
- **SC-004**: Environment status timestamps reflect actual deployment detection times (within the accuracy of the polling interval) rather than last-check times.
