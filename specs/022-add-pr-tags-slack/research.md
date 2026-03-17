# Research: Add PR Tags to Slack Announcements

**Feature**: 022-add-pr-tags-slack
**Date**: 2026-03-17

## R1: Tag Placement in Slack PR Lines

**Decision**: Place tags *after* the PR number and *before* the title.

**Rationale**: Format `• <url|#123> [Korjaus] Fix login bug — Author` keeps the PR number (most scannable element) first, then immediately categorizes the change. The title and author follow naturally. This mirrors how GitHub displays labels next to issue/PR titles.

**Alternatives considered**:
- Tags after title: `• <url|#123> Fix login bug [Korjaus] — Author` — harder to scan when titles vary in length
- Tags at end of line: `• <url|#123> Fix login bug — Author [Korjaus]` — buried after author, easy to miss

## R2: Shared vs. Separate Label Mapping

**Decision**: Create `src/config/label-map.ts` with the canonical mapping. Keep frontend `LABEL_MAP` as-is (vanilla JS can't import TypeScript). Add a cross-check test that reads both files and verifies they have identical text values.

**Rationale**: The frontend is vanilla JavaScript served as static files with no build step. A shared import is not possible without adding a build pipeline, which violates the minimal-dependencies principle. A cross-check test provides the same guarantee (SC-003) with zero infrastructure cost. If the mappings diverge, CI fails.

**Alternatives considered**:
- Shared JSON file imported by both: Would require dynamic `import()` or `fetch()` in frontend, adding complexity for a 11-entry constant
- Build step to generate frontend from TypeScript: Over-engineering for this use case
- Manual sync only: Violates DRY spirit; no CI safety net

## R3: Formatting Helper Design

**Decision**: Single pure function `formatLabelTags(labels: string[]): string` that returns a string like `[Korjaus] [Tekninen]` (space-separated) or empty string for no mapped labels. Exported from `src/config/label-map.ts`.

**Rationale**: Both `buildChangesSection` (Block Kit) and `buildChangeAnnouncement` (plain text) need the same tag formatting. A shared pure function avoids duplication and is trivially testable.

**Alternatives considered**:
- Inline formatting in each message builder: Violates DRY (same logic in 2 places)
- Separate formatting per message type: No difference in format needed — both use plain `[Tag]` text

## R4: Handling Missing/Empty Labels

**Decision**: `formatLabelTags` returns empty string `""` when labels array is empty, undefined, or contains only unmapped labels. Callers prepend the result to the title with a space only if non-empty.

**Rationale**: This keeps the caller logic simple (conditional space) and avoids trailing whitespace or empty brackets. Matches the frontend's `renderLabelBadges` pattern which returns empty string for no mapped labels.
