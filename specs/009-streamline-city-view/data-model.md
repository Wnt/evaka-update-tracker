# Data Model: Streamline City & Overview Page Layout

## Entity Changes

### PullRequest (modified)

**Current fields** (unchanged):
- `number: number` — PR number
- `title: string` — PR title
- `author: string` — GitHub username
- `mergedAt: string` — ISO 8601 timestamp
- `repository: string` — e.g., "espoon-voltti/evaka"
- `repoType: 'core' | 'wrapper'`
- `isBot: boolean`
- `url: string` — GitHub PR URL

**New field**:
- `labels: string[]` — Array of GitHub label names (e.g., `["bug"]`, `["enhancement", "breaking"]`). Empty array if no labels.

**Validation rules**:
- `labels` must be an array (never `undefined` or `null`)
- Each element is a non-empty string matching a GitHub label name
- For backward compatibility: if a PR object from old data lacks `labels`, the frontend treats it as `[]`

### Label Display Mapping (frontend-only, not persisted)

This mapping lives only in the frontend rendering code:

| Label Name | Finnish Text | Background Color | Text Color |
|-----------|-------------|-----------------|------------|
| `bug` | Korjaus | `#fef2f2` | `#dc2626` |
| `enhancement` | Parannus | `#f0fdf4` | `#16a34a` |
| `tech` | Tekninen | `#f3f4f6` | `#4b5563` |
| `breaking` | Päivitystoimia | `#fef2f2` | `#991b1b` |

Unknown labels are not displayed.

## Data File Impact

### data/current.json

PR objects within `cityGroups[].prTracks.{core,wrapper}.{deployed,inStaging,pendingDeployment}[]` gain the `labels` field.

**Before**:
```json
{
  "number": 8632,
  "title": "Ei avoimia tuloselvityksiä -hakuehdon kuuluisi huomioida myös käsittelyssä olevat",
  "author": "Joosakur",
  "mergedAt": "2026-03-03T17:07:58Z",
  "repository": "espoon-voltti/evaka",
  "repoType": "core",
  "isBot": false,
  "url": "https://github.com/espoon-voltti/evaka/pull/8632"
}
```

**After**:
```json
{
  "number": 8632,
  "title": "Ei avoimia tuloselvityksiä -hakuehdon kuuluisi huomioida myös käsittelyssä olevat",
  "author": "Joosakur",
  "mergedAt": "2026-03-03T17:07:58Z",
  "repository": "espoon-voltti/evaka",
  "repoType": "core",
  "isBot": false,
  "url": "https://github.com/espoon-voltti/evaka/pull/8632",
  "labels": ["bug"]
}
```

### data/history.json

PR objects within `events[].includedPRs[]` gain the same `labels` field. The backfill script updates these in-place.

### data/previous.json

No changes — this file tracks commit SHAs only, no PR data.

## Migration

The `scripts/backfill-labels.ts` script handles the one-time migration:

1. Read `data/history.json` and `data/current.json`
2. Collect unique `(owner/repo, prNumber)` pairs from all PR objects across both files
3. For each unique PR, call `getPullRequest()` and extract `.labels[].name`
4. Update every matching PR object with the `labels` array
5. Write updated files back

After running the backfill script and deploying the updated pipeline, all new PRs automatically include labels via the modified `pr-collector.ts`.
