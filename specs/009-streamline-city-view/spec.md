# Feature Specification: Streamline City & Overview Page Layout

**Feature Branch**: `009-streamline-city-view`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Declutter city page for product owners/stakeholders by replacing commit IDs with PR descriptions, adding foldable sections, dynamic page titles, Finnish weekday dates, hidden author names, color-coded PR labels, and matching overview page updates"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Meaningful Deployment Summary at a Glance (Priority: P1)

A product owner opens a city page (e.g., Tampereen seutu) and immediately sees what the latest change deployed to production and staging is — described as a human-readable PR title instead of a cryptic commit hash. The date includes the Finnish weekday name for quick temporal orientation.

**Why this priority**: The commit SHA is the single most confusing element for non-technical stakeholders. Replacing it with the PR description provides immediate understanding of what's deployed, which is the primary reason stakeholders visit the page.

**Independent Test**: Can be tested by opening any city page and verifying that the "Tuotanto" and "Staging / Testi" lines show a PR title instead of a commit SHA, with a Finnish weekday in the date.

**Acceptance Scenarios**:

1. **Given** a city page with a production deployment, **When** the page loads, **Then** the "Tuotanto" line displays the title of the most recent non-bot merged PR instead of a commit SHA
2. **Given** a city page with a staging deployment, **When** the page loads, **Then** the "Staging / Testi" line similarly displays the latest non-bot PR title instead of a commit SHA
3. **Given** a deployment date, **When** displayed on the tuotanto or staging line, **Then** the date includes the Finnish weekday name (e.g., "ti 25.2. klo 14.47" for Tuesday)
4. **Given** the most recent merged PR was from a bot (e.g., dependabot), **When** the page loads, **Then** the system shows the title of the latest non-bot PR instead
5. **Given** the overview (Yleiskatsaus) page, **When** it loads, **Then** each city card also shows PR titles instead of commit SHAs for their environment statuses

---

### User Story 2 - Collapsible PR Detail Sections (Priority: P2)

A stakeholder visiting the city page sees a clean, uncluttered top section. The detailed PR lists ("Viimeisimmät muutokset tuotantoympäristössä", "Muutokset testauksessa", "Odottaa julkaisua") are inside collapsible/foldable sections. The production section is collapsed by default to reduce visual noise, while staging and pending sections remain expanded.

**Why this priority**: Reduces visual clutter so stakeholders can focus on the deployment summary. The detailed PR lists are still accessible when needed but don't overwhelm the initial view.

**Independent Test**: Can be tested by loading a city page and verifying sections are collapsible, with production collapsed by default.

**Acceptance Scenarios**:

1. **Given** a city page loads, **When** the production PR section is present, **Then** it is collapsed (folded) by default
2. **Given** a city page loads, **When** the staging and pending sections are present, **Then** they are expanded by default
3. **Given** a collapsed section, **When** the user clicks on the section header, **Then** the section expands to reveal its content
4. **Given** an expanded section, **When** the user clicks on the section header, **Then** the section collapses to hide its content
5. **Given** a collapsible section header, **When** displayed, **Then** it includes a visual indicator (e.g., chevron/arrow) showing the expand/collapse state

---

### User Story 3 - Color-Coded PR Labels (Priority: P3)

When viewing core PRs, a stakeholder sees small color-coded labels next to PR titles that indicate the type of change (bug fix, new feature, technical change, or breaking change). Labels use short Finnish terms and are visually distinct through color coding.

**Why this priority**: Labels help stakeholders quickly scan and identify breaking changes or new features without reading each PR title. This is high-value information but requires data pipeline changes to collect label data from GitHub.

**Independent Test**: Can be tested by viewing a city page with core PRs that have GitHub labels and verifying the label badges appear with correct colors and Finnish text.

**Acceptance Scenarios**:

1. **Given** a core PR with the "bug" label, **When** displayed in any PR list, **Then** it shows a compact badge with the text "Korjaus" in a warm/red-toned color
2. **Given** a core PR with the "enhancement" label, **When** displayed, **Then** it shows a badge with "Parannus" in a green-toned color
3. **Given** a core PR with the "tech" label, **When** displayed, **Then** it shows a badge with "Tekninen" in a blue/gray-toned color
4. **Given** a core PR with the "breaking" label, **When** displayed, **Then** it shows a badge with "Päivitystoimia" in a prominent red/dark color to draw attention
5. **Given** a PR with no recognized label, **When** displayed, **Then** no label badge is shown (no empty or default badge)
6. **Given** a PR with multiple recognized labels, **When** displayed, **Then** all matching label badges are shown

---

### User Story 4 - Dynamic Browser Tab Title (Priority: P4)

When a user navigates between city tabs, the browser tab/window title updates to reflect the currently active view, showing the finest-grained context first.

**Why this priority**: Helps users with multiple tabs open quickly identify which city they're viewing. Low effort but useful quality-of-life improvement.

**Independent Test**: Can be tested by navigating between tabs and checking the browser title.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Tampere tab, **When** the page renders, **Then** the browser title shows "Tampereen seutu - eVaka muutostenseuranta"
2. **Given** a user navigates to the Overview tab, **When** the page renders, **Then** the browser title shows "Yleiskatsaus - eVaka muutostenseuranta"
3. **Given** a user navigates to a city's history view, **When** the page renders, **Then** the browser title shows "Muutoshistoria - [City Name] - eVaka muutostenseuranta"

---

### User Story 5 - Hidden Author Names (Priority: P5)

Author names in PR lists are not visible by default, reducing visual noise. Users who want to see authors can reveal them by hovering over a PR row.

**Why this priority**: Author information is rarely needed by stakeholders but adds visual clutter to every PR row. Hiding it by default keeps the layout clean while still making it discoverable.

**Independent Test**: Can be tested by loading a PR list and verifying authors are hidden, then hovering to see them appear.

**Acceptance Scenarios**:

1. **Given** a PR list loads, **When** displayed, **Then** the author name is not visible by default
2. **Given** a PR row, **When** the user hovers over it, **Then** the author name becomes visible
3. **Given** a PR row the user previously hovered, **When** the mouse leaves, **Then** the author name hides again
4. **Given** a touch device where hover is not available, **When** a PR row is displayed, **Then** the author name is always visible as a fallback

---

### Edge Cases

- What happens when there are no non-bot PRs to display as the deployment description? Fall back to showing the commit SHA as currently done.
- What happens when a city has no PR tracks data? The environment status line shows just the status dot and date without a PR description.
- What happens when the label data is not yet available for a PR (e.g., older data without labels)? No label badge is shown — graceful degradation.
- What happens on very narrow screens with long PR titles as deployment descriptions? The text truncates with ellipsis to fit the available space.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display the title of the most recent non-bot merged PR on the "Tuotanto" and "Staging / Testi" status lines, replacing the current commit SHA display
- **FR-002**: The system MUST fall back to the commit SHA if no non-bot PR is available for a given deployment
- **FR-003**: The system MUST include the Finnish weekday name in dates on the tuotanto and staging status lines (e.g., "ti 25.2. klo 14.47" for Tuesday)
- **FR-004**: The production PR section ("Viimeisimmät muutokset tuotantoympäristössä") MUST be collapsible and collapsed by default
- **FR-005**: The staging PR section ("Muutokset testauksessa") MUST be collapsible and expanded by default
- **FR-006**: The pending deployment PR section ("Odottaa julkaisua") MUST be collapsible and expanded by default
- **FR-007**: Collapsible sections MUST have a visual affordance (e.g., chevron icon) indicating their state
- **FR-008**: The system MUST collect and store PR label data from GitHub (labels: bug, tech, enhancement, breaking) as part of the data pipeline
- **FR-009**: Core PRs with recognized labels MUST display color-coded badges with Finnish short names: "Korjaus" (bug), "Parannus" (enhancement), "Tekninen" (tech), "Päivitystoimia" (breaking)
- **FR-010**: The browser tab title MUST update when navigating between views, in the format "[View Name] - eVaka muutostenseuranta"
- **FR-011**: Author names in PR lists MUST be hidden by default and revealed on hover
- **FR-012**: On touch devices without hover capability, author names MUST remain visible as a fallback
- **FR-013**: The overview (Yleiskatsaus) page MUST display PR titles instead of commit SHAs for each city's environment status

### Key Entities

- **PR Label**: A categorization tag applied to pull requests in GitHub. Relevant labels are "bug", "tech", "enhancement", and "breaking". Each maps to a Finnish display name and a distinct color.
- **Deployment Description**: The user-facing text describing what is currently deployed, derived from the latest non-bot merged PR's title.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Stakeholders can identify what is deployed to production and staging within 3 seconds of page load, without needing to interpret commit hashes
- **SC-002**: The visible content above the fold on a city page is reduced by at least 40% through collapsed sections and hidden author names
- **SC-003**: 100% of core PRs with supported GitHub labels display the corresponding Finnish-language color-coded badge
- **SC-004**: The browser tab title correctly reflects the active view on every navigation event
- **SC-005**: All existing functionality remains intact — collapsing/expanding does not lose any PR data or navigation capability

## Assumptions

- The GitHub API provides label data for pull requests, and the data collection pipeline can be extended to include it without significant complexity.
- The most recent non-bot PR in the deployed list is a reliable proxy for "what was just deployed" and is meaningful to stakeholders.
- Finnish weekday abbreviations follow standard conventions: ma, ti, ke, to, pe, la, su.
- The hover interaction for revealing author names is familiar enough that stakeholders will discover it naturally; no explicit instruction is needed.
- The "bot" classification for PRs (already tracked via `isBot` field) correctly identifies all automated PRs that should be excluded from the deployment description.
