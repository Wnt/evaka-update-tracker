# Research: Redesign City Deployment View

**Feature**: `005-redesign-deployment-view`
**Date**: 2026-03-03

## R1: Can the layout redesign be done without backend data changes?

**Decision**: Yes — frontend-only changes.

**Rationale**: The existing `current.json` already provides all required data:
- `prTracks.{core,wrapper}.deployed` → production commits (already has `repoType` field)
- `prTracks.{core,wrapper}.inStaging` → staging changes (already has `repoType` field)
- `prTracks.{core,wrapper}.pendingDeployment` → awaiting deployment (already has `repoType` field)
- Each PR object has `mergedAt` for chronological sorting and `isBot` for filtering

The `history.json` provides `detectedAt` timestamps per version change event, keyed by `environmentId` and `newCommit.sha`.

**Alternatives considered**:
- Backend pre-computes merged/sorted lists → rejected (unnecessary coupling, user constraint to avoid backend changes)
- Backend adds `detectedAt` to `current.json` version objects → rejected (would require backend change; frontend can look up from history.json)

## R2: How to resolve version detection timestamps from history data?

**Decision**: Frontend loads `history.json` and looks up the most recent event where `environmentId` matches and `newCommit.sha` matches the current environment's commit SHA.

**Rationale**:
- `history.json` is already fetched by the history view component
- Loading it globally in `app.js` enables reuse without duplication
- Lookup is O(n) over events but the dataset is small (hundreds of events max)
- Graceful fallback to `checkedAt` when no matching event exists

**Alternatives considered**:
- Add `detectedAt` to `current.json` in the backend data collector → cleaner but requires backend change (user constraint)
- Cache history lookups in a Map → unnecessary optimization given small dataset, but could be added later if needed

## R3: How to merge and sort PRs from two repositories into a unified list?

**Decision**: Create a shared helper function `mergeAndSortPRs(corePRs, wrapperPRs, { showBots })` that:
1. Concatenates arrays from both repos
2. Filters by `isBot` based on `showBots` flag
3. Sorts by `mergedAt` descending (newest first)
4. Returns the sorted array (each PR already has `repoType` field)

**Rationale**: Same logic needed for both staging and awaiting deployment sections. DRY principle from constitution requires extraction. The `repoType` field is already present on every PR object — no enrichment needed.

**Alternatives considered**:
- Inline sorting in city-detail.js for each section → violates DRY (constitution I)
- Add to pr-list.js → pr-list.js is a rendering component, merging is data logic. Keep separation.

## R4: How to display repository labels (`[core]`/`[wrapper]`) in PR items?

**Decision**: Add an optional `showRepoLabel` flag to `renderPRList()`. When true, each PR item renders a `<span class="repo-label">` before the PR title, using the PR's existing `repoType` field.

**Rationale**: Minimal change to existing component. The `repoType` field is already on every PR object. Adding a CSS class allows consistent styling across staging and awaiting sections.

**Alternatives considered**:
- Create a separate render function for unified lists → unnecessary duplication of PR item rendering logic
- Add label in city-detail.js outside pr-list → breaks encapsulation, harder to style consistently

## R5: How to limit production commits to 5 per repo?

**Decision**: Add an optional `limit` parameter to `renderPRList()`. When provided, the list is truncated after filtering (bot filtering applied first, then limit).

**Rationale**: The 5-item limit applies after bot filtering per FR-002. Adding to `renderPRList` keeps rendering logic centralized.

**Alternatives considered**:
- Slice the array before passing to renderPRList → works but scatters responsibility; less clear what "5 after filtering" means at call site
