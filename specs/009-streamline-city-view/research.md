# Research: Streamline City & Overview Page Layout

## R1: How to fetch PR labels from GitHub API

**Decision**: Extend the existing `GitHubPR` interface in `src/api/github.ts` to include the `labels` array from the GitHub REST API response. The `GET /repos/{owner}/{repo}/pulls/{number}` endpoint already returns a `labels` field containing an array of `{ name, color, ... }` objects — no additional API call needed.

**Rationale**: The existing `getPullRequest()` function already fetches the full PR object. Labels are part of the standard response payload. We only need to read the field that's already being returned but currently ignored.

**Alternatives considered**:
- Separate `GET /repos/{owner}/{repo}/issues/{number}/labels` endpoint — unnecessary extra API call since labels are already in the PR response.
- GraphQL API — would require a new client; overkill for adding one field.

## R2: Backfill strategy for existing history data

**Decision**: Create a TypeScript script at `scripts/backfill-labels.ts` that:
1. Reads `data/history.json` and `data/current.json`
2. Collects all unique `(repository, number)` pairs from all PR objects
3. Fetches labels for each PR via `getPullRequest()` (reusing the existing GitHub client)
4. Updates all matching PR objects in-place with the `labels` string array
5. Writes the updated files back to disk
6. Add as `npm run backfill-labels` in `package.json`

**Rationale**: A standalone script is the cleanest approach — it runs once, enriches all existing data, and the ongoing pipeline handles new PRs automatically. Reusing the existing GitHub client gets ETag caching and retry logic for free.

**Rate limit consideration**: With ~300 unique PRs across history, and each needing one API call, this fits well within the 5000/hr rate limit. The ETag cache means re-running the script is cheap.

**Alternatives considered**:
- Inline migration in the main pipeline — too complex, mixes concerns.
- Manual JSON editing — error-prone and doesn't scale.
- Fetching labels only for core PRs — simpler, but wrapper PRs might gain labels in the future. Better to collect all labels now.

## R3: Which labels to display and how to map them

**Decision**: Map these GitHub label names to Finnish short names with colors:

| GitHub Label | Finnish Display | Color | Rationale |
|-------------|----------------|-------|-----------|
| `bug` | Korjaus | `#ef4444` (red) | Bug fixes need attention |
| `enhancement` | Parannus | `#22c55e` (green) | New features are positive |
| `tech` | Tekninen | `#6b7280` (gray) | Technical, low stakeholder impact |
| `breaking` | Päivitystoimia | `#dc2626` (dark red, bold) | Critical — requires action during update |

**Rationale**: The user specified these exact labels and Finnish translations. Colors follow common conventions (red=bugs/breaking, green=features, gray=technical). "Päivitystoimia" is short for "Vaatii toimia päivityksen yhteydessä" as requested.

**Storage**: Labels are stored as `string[]` on the `PullRequest` interface (just the label names). The display mapping (name → Finnish text + color) lives in the frontend only. This keeps the data layer clean and allows display changes without re-fetching.

## R4: Collapsible sections — implementation approach

**Decision**: Use native HTML `<details>` and `<summary>` elements for collapsible sections. Production section renders with no `open` attribute (collapsed by default). Staging and pending sections render with `open` attribute (expanded by default).

**Rationale**: Native `<details>`/`<summary>` provides:
- Zero-JS collapse/expand behavior
- Built-in keyboard accessibility (Enter/Space to toggle)
- Built-in screen reader support
- No framework dependencies
- Chevron indicator provided by the browser (customizable via CSS `::marker` or `list-style`)

**Alternatives considered**:
- Custom JS toggle with `display:none` — more code, less accessible, reinvents the wheel.
- CSS-only `:target` hack — fragile, pollutes URL hash.

## R5: Replacing commit SHA with PR title on status lines

**Decision**: The `renderStatusBadge()` function in `status-badge.js` will accept an optional `latestPR` parameter containing the title of the most recent non-bot PR. When provided, it replaces the commit SHA link text. The link still goes to the GitHub commit URL (for developers who want to inspect the commit).

**Finding the latest non-bot PR**: The city detail view already has access to PR track data (`city.prTracks.core.deployed`, etc.) and history events. For production, use the first non-bot PR from deployed history events. For staging, use the first non-bot PR from `inStaging`. The overview page similarly uses `city.prTracks.core.deployed[0]` (already filtered to non-bot).

**Fallback**: If no non-bot PR is available (e.g., only bot PRs exist, or no PR data), fall back to displaying the commit SHA as currently done.

## R6: Finnish weekday in dates

**Decision**: Use `toLocaleDateString('fi', { weekday: 'short', ... })` which produces abbreviated Finnish weekday names. The Finnish `Intl` locale produces: "ma", "ti", "ke", "to", "pe", "la", "su".

**Format**: The status line date changes from "maaliskuuta 3 klo 14.47" to "ti 25.2. klo 14.47" — more compact and includes the weekday.

**Rationale**: `Intl.DateTimeFormat` with Finnish locale handles weekday names correctly without a manual lookup table.

## R7: Author name visibility

**Decision**: Hide `.pr-author` via `opacity: 0` by default, show on `.pr-item:hover` with `opacity: 1` and a smooth transition. Use `@media (hover: none)` to always show author on touch devices.

**Rationale**: CSS-only solution is simplest. Opacity (not `display:none`) preserves layout stability — no content jumping on hover. The `hover: none` media query correctly targets touch devices.

**Alternatives considered**:
- Toggle button — adds UI complexity; hover is more discoverable for this use case.
- `visibility: hidden` — similar to opacity but less smooth for transitions.
- `display: none` — causes layout shift on hover.

## R8: Dynamic page title

**Decision**: Set `document.title` in each route handler in `app.js`. Format: `"[View] - eVaka muutostenseuranta"`.

- Overview: `"Yleiskatsaus - eVaka muutostenseuranta"`
- City detail: `"${city.name} - eVaka muutostenseuranta"`
- City history: `"Muutoshistoria - ${city.name} - eVaka muutostenseuranta"`

**Rationale**: Simplest approach — 3 lines of code, one per route handler. No router changes needed.
