# Research: Show Empty Sections

**Feature**: 014-show-empty-sections
**Date**: 2026-03-05

## Summary

No NEEDS CLARIFICATION items in the technical context. This is a straightforward frontend change with no unknowns.

## Decisions

### 1. Empty-state message pattern

- **Decision**: Reuse the existing `.empty-state` CSS class and `<div class="empty-state">` pattern already used in `pr-list.js`
- **Rationale**: Consistent with existing UI patterns; no new CSS needed
- **Alternatives considered**: Custom styling for section-level empty states -- rejected because the existing pattern is visually appropriate and matches constitution principle III (UX Consistency)

### 2. Finnish empty-state message text

- **Decision**: Use section-specific Finnish messages:
  - Production: "Ei viimeaikaisia tuotantomuutoksia" (No recent production changes)
  - Staging: "Ei muutoksia testauksessa" (No changes in testing)
  - Pending: "Ei odottavia muutoksia" (No pending changes)
- **Rationale**: Contextual messages are more informative than a generic "no data" message; consistent with existing Finnish UI text
- **Alternatives considered**: Single generic message for all sections -- rejected because contextual messages better communicate the specific status

### 3. Section wrapper structure

- **Decision**: Always render the section `<div>` with `<h4>` heading, and place either the PR list or empty-state div inside
- **Rationale**: Removes conditional section rendering; the section container is always present
- **Alternatives considered**: Keep conditional rendering but add a separate "all clear" summary -- rejected because it doesn't fulfill the spec requirement of always showing each section
