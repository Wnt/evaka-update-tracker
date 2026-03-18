# Feature Specification: Capture Views Tool

**Feature Branch**: `022-capture-views`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "implement the tool npm run capture-views that's mentioned in e.g. .specify/templates/plan-template.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Batch Capture All Dashboard Views (Priority: P1)

A developer or CI pipeline runs `npm run capture-views` to automatically generate screenshot images of every major dashboard view. The tool visits each route (overview, city detail pages, history pages, feature matrix) using test data, captures a screenshot of each, and saves them to a predictable output directory.

**Why this priority**: This is the core purpose of the tool — replacing manual one-at-a-time screenshot capture with a single command that covers all views.

**Independent Test**: Can be tested by running `npm run capture-views` and verifying that screenshot files are created for each expected view.

**Acceptance Scenarios**:

1. **Given** the project has test data generation and a local server available, **When** the user runs `npm run capture-views`, **Then** screenshots are generated for all major dashboard routes and saved to the output directory.
2. **Given** the tool is run with default settings, **When** it completes, **Then** each output file is named descriptively (e.g., `overview.png`, `city-tampere-region.png`, `city-tampere-region-history.png`, `features.png`).
3. **Given** the output directory does not exist, **When** the tool runs, **Then** it creates the directory automatically.

---

### User Story 2 - Selective View Capture (Priority: P2)

A developer wants to capture only specific views (e.g., just the overview, or just one city's detail page) without running the full batch. They pass a filter argument to capture only matching views.

**Why this priority**: Saves time during iterative development when only one view has changed.

**Independent Test**: Can be tested by running `npm run capture-views -- --filter overview` and verifying only the overview screenshot is generated.

**Acceptance Scenarios**:

1. **Given** the user passes `--filter overview`, **When** the tool runs, **Then** only the overview screenshot is generated.
2. **Given** the user passes `--filter city-tampere-region`, **When** the tool runs, **Then** only the Tampere region city detail screenshot is generated.
3. **Given** the user passes an invalid filter that matches no views, **When** the tool runs, **Then** it exits with a clear error message listing available view names.

---

### User Story 3 - Custom Output Directory (Priority: P3)

A developer or CI pipeline specifies a custom output directory for the captured screenshots, e.g., to store them alongside a pull request or documentation artifact.

**Why this priority**: Flexibility for CI/CD and documentation workflows.

**Independent Test**: Can be tested by running `npm run capture-views -- --output-dir ./my-screenshots` and verifying files appear in that directory.

**Acceptance Scenarios**:

1. **Given** the user passes `--output-dir ./custom-path`, **When** the tool runs, **Then** all screenshots are saved to `./custom-path/`.
2. **Given** no output directory is specified, **When** the tool runs, **Then** screenshots are saved to the default directory (`site/images/views/`).

---

### Edge Cases

- What happens when the local server fails to start? The tool exits with a clear error message.
- What happens when a view fails to render (e.g., missing data)? The tool logs a warning for that view and continues capturing remaining views, then exits with a non-zero code.
- What happens when Playwright/Chromium is not installed? The tool exits with a clear error suggesting `npx playwright install chromium`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture screenshots of all major dashboard routes: overview (`/`), features (`/features`), city detail (`/city/:id` for each city in test data), and city history (`/city/:id/history` for each city).
- **FR-002**: System MUST generate test data and start a local server before capturing (reusing existing E2E infrastructure).
- **FR-003**: System MUST save each screenshot with a descriptive filename that identifies the view (e.g., `overview.png`, `features.png`, `city-tampere-region.png`, `city-tampere-region-history.png`).
- **FR-004**: System MUST support a `--filter` argument to capture only views whose names match the given pattern.
- **FR-005**: System MUST support an `--output-dir` argument to specify where screenshots are saved, defaulting to `site/images/views/`.
- **FR-006**: System MUST support `--width` and `--height` arguments to control viewport size, with sensible defaults.
- **FR-007**: System MUST log progress as it captures each view (view name and output path).
- **FR-008**: System MUST exit with a non-zero code if any view fails to render, after attempting all remaining views.
- **FR-009**: System MUST be invocable via `npm run capture-views`.

### Key Entities

- **View**: A named dashboard route with a hash path, viewport dimensions, and a wait-for selector to ensure content is loaded before capture (e.g., `.city-grid` for overview, `.city-detail` for city pages).
- **View Registry**: The list of all views to capture, derived from the dashboard's routes and the cities present in the test data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running `npm run capture-views` produces a screenshot file for every major dashboard view (at least 4 categories: overview, features, city detail, city history).
- **SC-002**: The tool completes the full capture process in under 60 seconds for a typical set of test data.
- **SC-003**: Developers can selectively capture a single view in under 10 seconds using the `--filter` option.
- **SC-004**: The tool reuses existing E2E test infrastructure (test data generation, local server) without duplication.

## Assumptions

- The existing `npm run screenshot` script and its infrastructure (test data generation, local server) will be reused.
- The list of cities to capture is derived dynamically from the generated test data (not hardcoded).
- The tool is intended for developer and CI use, not for end users.
- Playwright and Chromium are expected to be installed (the tool does not install them automatically).
