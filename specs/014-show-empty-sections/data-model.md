# Data Model: Show Empty Sections

**Feature**: 014-show-empty-sections
**Date**: 2026-03-05

## Summary

No data model changes required. This feature modifies only the rendering logic in the frontend. The existing data structures (city groups, PR tracks, history events) remain unchanged.

## Existing Entities (read-only, no modifications)

### PR Track (from `current.json`)
- `city.prTracks.core.inStaging` -- array of PRs in staging (may be empty)
- `city.prTracks.core.pendingDeployment` -- array of PRs pending deployment (may be empty)
- `city.prTracks.wrapper.inStaging` -- array of PRs in staging (may be empty)
- `city.prTracks.wrapper.pendingDeployment` -- array of PRs pending deployment (may be empty)

### History Events (from `history.json`)
- Used to derive recent production PRs via `getRecentProductionPRs()`
- May return empty arrays for core and wrapper

## State Transitions

No state transitions. Empty arrays are already a valid state in the data model; the change is purely in how the UI renders that state.
