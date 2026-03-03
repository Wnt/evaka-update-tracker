# Data Model: Redesign City Deployment View

**Feature**: `005-redesign-deployment-view`
**Date**: 2026-03-03

## Existing Data (No Changes)

### PR Object (from `current.json`)

```
PR {
  number: integer
  title: string
  author: string
  mergedAt: ISO 8601 timestamp
  repository: string (e.g., "Tampere/trevaka")
  repoType: "core" | "wrapper"
  isBot: boolean
  url: string (GitHub PR URL)
}
```

### City Group PR Tracks (from `current.json`)

```
prTracks {
  wrapper: {
    repository: string
    deployed: PR[]          → used for production commits
    inStaging: PR[]         → used for staging changes
    pendingDeployment: PR[] → used for awaiting deployment
  } | null
  core: {
    repository: string
    deployed: PR[]          → used for production commits
    inStaging: PR[]         → used for staging changes
    pendingDeployment: PR[] → used for awaiting deployment
  } | null
}
```

### Version Detection Event (from `history.json`)

```
HistoryEvent {
  id: string
  environmentId: string (e.g., "tampere-prod", "tampere-test")
  cityGroupId: string
  detectedAt: ISO 8601 timestamp    ← THIS is the timestamp we display
  previousCommit: Commit
  newCommit: Commit                 ← matched by SHA to current env version
  includedPRs: PR[]
  repoType: "core" | "wrapper"
}
```

## Frontend View Transformations (New Logic)

### 1. Merged PR List (for staging & awaiting sections)

**Input**: `corePRs: PR[]`, `wrapperPRs: PR[]`, `showBots: boolean`
**Output**: `PR[]` — merged, filtered, sorted by `mergedAt` descending

```
mergeAndSortPRs(corePRs, wrapperPRs, { showBots }) → PR[]
  1. Concatenate corePRs + wrapperPRs
  2. If !showBots: filter where isBot === false
  3. Sort by mergedAt descending (newest first)
  4. Return sorted array
```

### 2. Version Detection Time Lookup

**Input**: `history: HistoryEvent[]`, `environmentId: string`, `commitSha: string`
**Output**: `string | null` — ISO timestamp of when this version was first detected

```
findDetectedAt(events, environmentId, commitSha) → string | null
  1. Filter events by environmentId
  2. Find event where newCommit.sha === commitSha
  3. Return event.detectedAt if found, null otherwise
```

### 3. Page Layout Data Flow

```
city-detail receives:
  - city: CityGroup (from current.json)
  - historyEvents: HistoryEvent[] (from history.json)
  - showBots: boolean (from query param)

Renders in order:
  1. Environment badges:
     For each env in city.environments:
       detectedAt = findDetectedAt(events, env.id, env.version.coreCommit?.sha || env.version.wrapperCommit?.sha)
       renderStatusBadge(env.version, { detectedAt })

  2. Bot toggle button

  3. Production commits (per repo, capped):
     wrapperDeployed = city.prTracks.wrapper?.deployed || []
     coreDeployed = city.prTracks.core?.deployed || []
     renderPRList(wrapperDeployed, { showBots, limit: 5 })  → "Wrapper" sub-header
     renderPRList(coreDeployed, { showBots, limit: 5 })     → "Core" sub-header

  4. Staging changes (unified):
     coreStaging = city.prTracks.core?.inStaging || []
     wrapperStaging = city.prTracks.wrapper?.inStaging || []
     merged = mergeAndSortPRs(coreStaging, wrapperStaging, { showBots })
     renderPRList(merged, { showBots, showRepoLabel: true })

  5. Awaiting deployment (unified):
     corePending = city.prTracks.core?.pendingDeployment || []
     wrapperPending = city.prTracks.wrapper?.pendingDeployment || []
     merged = mergeAndSortPRs(corePending, wrapperPending, { showBots })
     renderPRList(merged, { showBots, showRepoLabel: true })
```
