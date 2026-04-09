# Contract: `mismatch-classifier` module

**Feature**: 025-version-mismatch-info
**File**: `site/js/lib/mismatch-classifier.js`
**Exports**: `classifyMismatch`

This contract is what the unit test (`tests/unit/mismatch-classifier.test.ts`) and the two consumer components (`overview.js`, `city-detail.js`) may rely on. Changes to this contract require updating the unit tests in the same commit.

---

## Public API

```js
/**
 * Classify a list of VersionSnapshot objects into a majority/abnormal split.
 *
 * @param {VersionSnapshot[] | undefined | null} mismatchDetails
 *   The value of env.mismatchDetails from current.json. May be empty, null, or undefined.
 * @returns {MismatchClassification}
 *   Always returns a fully-populated object (never null). See data-model.md.
 */
export function classifyMismatch(mismatchDetails) { ... }
```

## Behavioural contract

### Input contract

- `mismatchDetails` is an array of `VersionSnapshot` objects, or nullish. Nullish is treated as `[]`.
- Each snapshot has at minimum a `status` field (`"ok" | "unavailable" | "auth-error"`).
- OK snapshots have at least one of `coreCommit.sha` or `wrapperCommit.sha`. If neither, the snapshot is still consumed (grouped under key `""`).

### Output contract

See `data-model.md` → `MismatchClassification` typedef.

### Determinism

- Pure function. No side effects, no I/O, no randomness, no `Date.now()`.
- The ordering of `abnormalInstances` follows the original input array order (stable).

### Rules (authoritative — tests assert each)

| # | Input shape | Expected output |
|---|-------------|-----------------|
| C1 | `[]` or `null` or `undefined` | `hasMismatch=false`, `isTied=false`, `majoritySha=null`, `majorityCount=0`, `abnormalInstances=[]`, `okInstanceCount=0` |
| C2 | 1 OK snapshot (SHA A) | `hasMismatch=false`, `okInstanceCount=1`, everything else empty/null |
| C3 | 2 OK snapshots, both SHA A | `hasMismatch=false`, `okInstanceCount=2` |
| C4 | 8 OK snapshots SHA A + 1 OK snapshot SHA B | `hasMismatch=true`, `isTied=false`, `majoritySha=A`, `majorityCount=8`, `abnormalInstances=[B]` (1 element), `okInstanceCount=9` |
| C5 | 5 OK SHA A + 3 OK SHA B + 1 OK SHA C | `hasMismatch=true`, `isTied=false`, `majoritySha=A`, `majorityCount=5`, `abnormalInstances=[B×3, C×1]` (4 elements, in input order), `okInstanceCount=9` |
| C6 | 4 OK SHA A + 4 OK SHA B (tied) | `hasMismatch=true`, `isTied=true`, `majoritySha=null`, `majorityCount=0`, `abnormalInstances=[all 8]`, `okInstanceCount=8` |
| C7 | 3 OK SHA A + 3 OK SHA B + 3 OK SHA C (tied 3-way) | `hasMismatch=true`, `isTied=true`, `majoritySha=null`, `abnormalInstances=[all 9]`, `okInstanceCount=9` |
| C8 | 1 OK SHA A + 1 `unavailable` + 1 `auth-error` | `hasMismatch=false` (only one OK → no mismatch possible), `okInstanceCount=1`, `abnormalInstances=[]`. Non-OK entries are NEVER in `abnormalInstances`. |
| C9 | 7 OK SHA A + 1 OK SHA B + 1 `unavailable` | `hasMismatch=true`, `majoritySha=A`, `majorityCount=7`, `abnormalInstances=[B]` (1 element — the unavailable snapshot is NOT included), `okInstanceCount=8` |
| C10 | 1 OK with `coreCommit=null` and `wrapperCommit={sha:"X"}` + 1 OK with `coreCommit={sha:"Y"}` | `hasMismatch=true`, uses wrapperSha for the first and coreSha for the second as grouping keys. Both are singletons → tied. `isTied=true`, `abnormalInstances=[both]` |
| C11 | Each `AbnormalInstance.label` equals `instanceDomain.split('.')[0]` | Verified alongside any mismatch case (C4 and up). |
| C12 | Each `AbnormalInstance.sha` equals `coreCommit?.sha ?? wrapperCommit?.sha ?? null`, `shortSha` equals the same commit object's `shortSha` (7 chars) | Verified alongside any mismatch case. |

### Rule C13 — coreCommit preference

When both `coreCommit` and `wrapperCommit` are present on a snapshot, the grouping key is `coreCommit.sha` (not wrapperCommit). This mirrors how the existing chip renderer resolves SHAs in `city-detail.js:151` (`v.coreCommit?.shortSha || v.wrapperCommit?.shortSha`).

### Rule C14 — unknown-SHA grouping

A snapshot with `status === 'ok'` but neither `coreCommit` nor `wrapperCommit` (theoretically possible, never observed in practice) is grouped under key `""`. It participates in the tally like any other group. Defensive behaviour — no errors thrown.

---

## Consumer expectations

### `overview.js` (environment row badge + warning text)

Given the city's environment:

```js
import { classifyMismatch } from '../lib/mismatch-classifier.js';

const classification = classifyMismatch(env.mismatchDetails);

if (classification.hasMismatch) {
  // 1. Paint the row dot as mismatch (override)
  const badge = renderStatusBadge(env.version, { latestPRTitle, detectedAt, mismatchOverride: true });

  // 2. Warning text per env.type
  const warningText = env.type === 'production'
    ? 'Versioero havaittu tuotannossa'
    : 'Versioero havaittu testauksessa';
  const mismatchBanner = `<div class="mismatch-warning">${warningText}</div>`;
}
```

### `city-detail.js` (chip list + warning text)

```js
import { classifyMismatch } from '../lib/mismatch-classifier.js';

const classification = classifyMismatch(env.mismatchDetails);

if (classification.hasMismatch) {
  // Row badge override (same as overview)
  const badge = renderStatusBadge(env.version, { detectedAt, latestPRTitle, mismatchOverride: true });

  // Warning text: name the abnormal sub-cities, or tied fallback
  let warningText;
  if (classification.isTied) {
    warningText = 'Versioero havaittu — instanssit eivät ole yksimielisiä';
  } else {
    const labels = classification.abnormalInstances.map(i => i.label).join(', ');
    warningText = `Versioero havaittu: ${labels}`;
  }

  // Chip list: majority instances keep status class, abnormal ones get 'mismatch' class
  const abnormalSet = new Set(classification.abnormalInstances.map(i => i.instanceDomain));
  const chips = env.mismatchDetails.map(v => {
    const sha = v.coreCommit?.shortSha || v.wrapperCommit?.shortSha || '?';
    // Non-OK entries keep their status class (unavailable / auth-error)
    // OK entries: 'mismatch' if abnormal, else 'ok'
    const dotClass = v.status !== 'ok'
      ? v.status
      : abnormalSet.has(v.instanceDomain) ? 'mismatch' : 'ok';
    return `<span class="instance-chip"><span class="status-dot ${dotClass}"></span>${escapeHtml(v.instanceDomain.split('.')[0])} (${sha})</span>`;
  });
}
```

### `status-badge.js` (renderStatusBadge signature extension)

```js
/**
 * @param {VersionSnapshot|null} version
 * @param {Object} [options]
 * @param {string|null} [options.detectedAt]
 * @param {string|null} [options.latestPRTitle]
 * @param {boolean} [options.mismatchOverride=false]
 *   When true AND version.status === 'ok', the dot class becomes 'mismatch'
 *   instead of 'ok'. Non-OK statuses (unavailable, auth-error) are never overridden.
 */
export function renderStatusBadge(version, { detectedAt = null, latestPRTitle = null, mismatchOverride = false } = {}) { ... }
```

**Backwards compatibility**: all existing call sites omit `mismatchOverride`, so they default to `false` and behave exactly as before.
