# Contract: PR Label Mapping

## Data Layer Contract

### PullRequest.labels field

**Location**: `src/types.ts` — `PullRequest` interface

```typescript
interface PullRequest {
  // ... existing fields ...
  labels: string[];  // GitHub label names, e.g., ["bug", "enhancement"]
}
```

**Invariants**:
- Always an array (never `undefined` or `null` in new data)
- Contains raw GitHub label name strings
- Empty array `[]` when PR has no labels
- Frontend must handle missing `labels` field from pre-migration data (treat as `[]`)

### GitHub API Response

**Endpoint**: `GET /repos/{owner}/{repo}/pulls/{number}`

**Relevant response field**:
```json
{
  "labels": [
    { "id": 123, "name": "bug", "color": "d73a4a", "description": "..." },
    { "id": 456, "name": "enhancement", "color": "a2eeef", "description": "..." }
  ]
}
```

Only the `name` field is extracted and stored.

## Display Layer Contract

### Label Badge Mapping

**Location**: Frontend JS (rendered in `pr-list.js`)

| GitHub Label Name | Display Text | CSS Class | Background | Text Color |
|------------------|-------------|-----------|------------|------------|
| `bug` | Korjaus | `.label-bug` | `#fef2f2` | `#dc2626` |
| `enhancement` | Parannus | `.label-enhancement` | `#f0fdf4` | `#16a34a` |
| `tech` | Tekninen | `.label-tech` | `#f3f4f6` | `#4b5563` |
| `breaking` | Päivitystoimia | `.label-breaking` | `#fef2f2` | `#991b1b` |

**Rendering rules**:
- Labels not in the mapping table are silently ignored (not rendered)
- Multiple labels render left-to-right in the order they appear in the array
- Badge is a small inline `<span>` element with rounded corners, placed between the PR title and the author
- Badge font size is smaller than the PR title text

### Status Badge Contract

**Location**: `site/js/components/status-badge.js`

The `renderStatusBadge()` function signature changes:

```javascript
// Before
renderStatusBadge(version, { detectedAt = null } = {})

// After
renderStatusBadge(version, { detectedAt = null, latestPRTitle = null } = {})
```

**Behavior**:
- When `latestPRTitle` is provided and non-empty: display the PR title instead of the commit SHA (the link still points to the GitHub commit URL)
- When `latestPRTitle` is `null` or empty: fall back to displaying the commit SHA (current behavior)
- The title text truncates with ellipsis if it exceeds available width

### Date Format Contract

**Location**: `site/js/components/status-badge.js` — `formatTime()` function

**Before**: `"maaliskuuta 3, 14:30"` (month + day + time)
**After**: `"ti 25.2. klo 14.47"` (weekday + day.month. + klo + time)

Uses `Intl.DateTimeFormat('fi', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })`.
