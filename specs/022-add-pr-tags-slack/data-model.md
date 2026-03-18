# Data Model: Add PR Tags to Slack Announcements

**Feature**: 022-add-pr-tags-slack
**Date**: 2026-03-17

## Entities

### SlackLabelMap (NEW)

A static mapping from GitHub label names to Finnish display text. No persistence — compiled into the application.

| Field | Type | Description |
|-------|------|-------------|
| key | string | GitHub label name (e.g. `"bug"`, `"tech"`) |
| text | string | Finnish display name (e.g. `"Korjaus"`, `"Tekninen"`) |

**Canonical entries** (11 total):

| GitHub Label | Finnish Text |
|-------------|-------------|
| bug | Korjaus |
| enhancement | Parannus |
| tech | Tekninen |
| breaking | Päivitystoimia |
| dependencies | Riippuvuus |
| frontend | Käyttöliittymä |
| java | Java |
| javascript | JavaScript |
| service | Palvelu |
| submodules | Alimoduuli |
| apigw | API-yhdyskäytävä |

### PullRequest (EXISTING — no changes)

The `labels: string[]` field on `PullRequest` (defined in `src/types.ts`) already carries GitHub label names. No schema changes needed.

## Relationships

- `PullRequest.labels[]` → looked up in `SlackLabelMap` to produce display tags
- `SlackLabelMap` entries are a subset of the frontend `LABEL_MAP` (text values must match; frontend also has `cssClass` which is irrelevant for Slack)

## State Transitions

None — this is a stateless formatting transformation applied at message-build time.
