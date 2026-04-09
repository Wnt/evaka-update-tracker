# Feature Specification: More Informative Version Mismatch Indication

**Feature Branch**: `025-version-mismatch-info`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "make the \"Versioero havaittu instanssien välillä\" more informative: on \"Yleiskatsaus\" view it should show if it's a testing or production version mismatch and on the city details page it should show which sub cities have the version mismatch. I think the green dots should indicate the abnormal status: e.g. tampere one differs from all the rest in the details page and on main view Tampere region test env would have yellow dot"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator identifies which environment has a version mismatch from the overview (Priority: P1)

An eVaka operator scans the Yleiskatsaus (overview) page to check deployment health across all city groups. When a city group has a version mismatch between its sub-instances, the operator needs to instantly see **which** environment is affected — testing or production — without having to click into the city details page to find out.

**Why this priority**: The overview is the primary triage surface. Knowing that "testing" vs "production" is affected dramatically changes the urgency and the response (a production mismatch usually means an incomplete rollout or a failed deploy and is near-critical; a testing mismatch is less urgent). Today the warning is generic, so operators always have to drill in to understand severity. This is the single biggest information gap.

**Independent Test**: Prepare current data where one city group has a staging/testing mismatch and another has a production mismatch. Open the overview page. Verify that each affected city card clearly labels the mismatch with the correct environment type and visually highlights the specific environment row that is affected.

**Acceptance Scenarios**:

1. **Given** a city group with a version mismatch in its testing environment (production is healthy), **When** the operator views the Yleiskatsaus, **Then** the city card shows a warning that explicitly identifies the testing environment as the source of the mismatch, and the visual status indicator for the testing row of that card shows an abnormal (non-OK) state, while the production row remains in a normal OK state.
2. **Given** a city group with a version mismatch in its production environment (testing is healthy), **When** the operator views the Yleiskatsaus, **Then** the city card shows a warning that explicitly identifies the production environment as the source of the mismatch, and only the production row is visually marked as abnormal.
3. **Given** a city group with no version mismatches in either environment, **When** the operator views the Yleiskatsaus, **Then** no version mismatch warning is shown and both environment rows display their normal OK indicators.
4. **Given** a city group with version mismatches in both its testing and production environments, **When** the operator views the Yleiskatsaus, **Then** both environments are clearly marked as having a mismatch (each with its own warning text and abnormal indicator).

---

### User Story 2 - Operator identifies which sub-cities are out-of-sync on the city details page (Priority: P1)

Having identified from the overview that (for example) Tampereen seutu has a testing mismatch, the operator opens the Tampereen seutu details page. They need to immediately see **which** sub-city/instance is the odd one out — e.g., Tampere itself is running a different version than the other eight municipalities — so they can investigate the specific failing deployment.

**Why this priority**: The city details page is the natural drill-down target from the overview. Today the warning ("Versioero havaittu") is shown above a row of identical-looking green dots, so the operator has to manually compare short SHAs across nine chips to find the odd one out. Surfacing the abnormal sub-cities directly removes this manual effort and is the whole point of drilling in.

**Independent Test**: Prepare current data where the Tampereen seutu environment has nine instances, eight sharing one SHA and one (Tampere) with a different SHA. Open the Tampereen seutu details page. Verify that the mismatch warning names the abnormal sub-city and that its status indicator is visually distinct from the eight sub-cities that share the majority version.

**Acceptance Scenarios**:

1. **Given** a city group details page for an environment where 8 of 9 instances share one version and 1 instance (e.g., Tampere) runs a different version, **When** the operator views the page, **Then** the mismatch warning explicitly names the abnormal sub-city ("Tampere") and the visual indicator next to that single sub-city chip is rendered in the abnormal color while the other eight sub-cities keep their normal OK color.
2. **Given** a city group details page where multiple sub-cities (e.g., 2 of 9) run a minority version, **When** the operator views the page, **Then** the warning names all abnormal sub-cities and each of their status indicators is rendered in the abnormal color.
3. **Given** a city group details page where no mismatch is detected, **When** the operator views the page, **Then** no mismatch warning is shown and no sub-city is marked as abnormal. (Current behavior of hiding the sub-city chip list when there is no mismatch is preserved.)
4. **Given** a city group details page with both a testing and a production environment, only one of which has a mismatch, **When** the operator views the page, **Then** only the affected environment section shows the mismatch warning and abnormal-instance marking; the healthy environment shows no warning and no abnormal marking.

---

### Edge Cases

- **Three or more distinct versions in a single environment**: If the instances split across three or more different SHAs (e.g., 5 on A, 3 on B, 1 on C), the system must still be able to identify a "correct" majority and mark every other instance as abnormal. When there is a clear single largest group, that group is treated as the correct version and all other instances are abnormal.
- **Tied majority (no clear winner)**: If the instances split evenly across two or more SHAs with no single largest group (e.g., 4 on A and 4 on B, or 3 on A, 3 on B, 3 on C), the system cannot pick a "correct" version. In that case, every instance must be marked as abnormal, and the warning should indicate that all sub-cities disagree. The overview row indicator for such an environment must still show the abnormal state.
- **Single-instance environment**: For city groups with only one instance per environment (Espoo, Oulu, Turku in typical data), a mismatch is impossible by definition and no warning and no abnormal marking should ever appear.
- **Instance with a non-OK fetch status (unavailable / auth-error)**: Instances whose version could not be fetched at all must not be counted toward the "majority version" calculation (their SHA is unknown). They should continue to display their existing non-OK status color (unavailable / auth-error) — the new mismatch highlighting must not overwrite an already-abnormal fetch status.
- **Mismatch exists but only one instance has an OK status** (others are unavailable): In this situation there is effectively no disagreement among the OK instances, so no mismatch should be reported. The overview row and details page should show no mismatch warning. (This is consistent with current detection logic — kept explicit to avoid regressions.)
- **Warning label localisation**: All warning text must continue to be in Finnish, matching the rest of the UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On the Yleiskatsaus (overview) view, when a city group has a version mismatch, the mismatch warning text MUST identify the affected environment type (testing or production) in Finnish (e.g., "Versioero havaittu testauksessa" or "Versioero havaittu tuotannossa").
- **FR-002**: On the Yleiskatsaus view, each environment row (the one showing Tuotanto or Testaus with its status indicator) MUST visually indicate the abnormal state of its environment when that environment has a version mismatch. The indicator for the healthy environment in the same city card MUST remain in the normal OK state.
- **FR-003**: The abnormal visual indicator on the overview MUST be perceptually distinct from the normal OK indicator and from the existing unavailable/auth-error indicators (i.e., the user must be able to tell at a glance whether a row is OK, unreachable, or version-mismatched).
- **FR-004**: On the city details page, when a multi-instance environment has a version mismatch, the mismatch warning MUST name the sub-cities (instances) that are out-of-sync with the majority version.
- **FR-005**: On the city details page sub-city chip list, each sub-city chip whose version differs from the majority MUST visually mark its status indicator as abnormal, while sub-cities that share the majority version MUST keep their normal OK indicator.
- **FR-006**: The system MUST determine the "majority version" within an environment as the single SHA shared by the strictly largest number of OK-status instances. Instances with a non-OK fetch status MUST be excluded from the majority calculation and MUST keep their existing non-OK indicator (no mismatch marking is applied on top of an already-abnormal fetch status).
- **FR-007**: If the OK-status instances do not have a single strictly largest group (a tied split), the system MUST treat every OK-status instance as abnormal for the purposes of the sub-city indicators and the warning text must indicate that no sub-cities agree on a version.
- **FR-008**: When a city group has no version mismatch in an environment, no mismatch warning and no abnormal marking MUST appear for that environment (neither on the overview card nor on the details page).
- **FR-009**: The change MUST NOT alter the detection of *whether* a version mismatch exists — the existing rule (more than one distinct SHA among OK instances in the same environment) stays. Only the presentation of that information changes.
- **FR-010**: Warning and label text MUST be in Finnish, consistent with the rest of the UI.

### Key Entities *(include if feature involves data)*

- **City group**: A group of cities/municipalities shown as a single card on the overview and as a single details page (e.g., Espoo, Tampereen seutu, Oulu, Turku). Has one or more environments.
- **Environment**: A deployment target within a city group, of type "production" (Tuotanto) or "staging"/testing (Testaus / Staging / Testi). Contains one or more instances.
- **Instance (sub-city)**: A single deployed eVaka site for one municipality (e.g., Tampere, Kangasala, Nokia). Has a fetched version snapshot with a status (ok / unavailable / auth-error) and, when OK, a commit SHA identifying the deployed version.
- **Version mismatch**: A derived attribute of an environment indicating that its OK-status instances do not all share the same commit SHA. Requires distinguishing, for presentation, between (a) the single majority version (if any) and (b) the set of instances that do not match it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator looking at the Yleiskatsaus can correctly name the affected environment type (testing vs production) for every city card that has a mismatch without clicking into any details page, in 100% of cases.
- **SC-002**: On the city details page of a multi-instance city group with a mismatch, an operator can correctly name every out-of-sync sub-city within 5 seconds of the page loading, without having to read or compare SHAs manually.
- **SC-003**: When no mismatch exists, zero mismatch warnings and zero abnormal indicators appear anywhere in the UI for that city group — the new indication never produces false positives.
- **SC-004**: A healthy environment in a city group that also contains an unhealthy (mismatched) environment is never itself marked as abnormal on the overview.
- **SC-005**: Warning and indicator changes introduce no additional data-fetching work and no new blocking UI state — existing page-load behaviour (no extra spinner, no layout shift) is preserved.

## Assumptions

- The existing version mismatch detection logic (comparing unique SHAs among OK-status instances per environment) is correct and remains the basis of the warning. Only the presentation is changing.
- "Abnormal" highlight colour will reuse an existing UI colour already used elsewhere in the design (the warning/auth-error yellow is a natural choice because the mismatch-warning banner already uses a similar amber/yellow) rather than introducing a brand-new colour token. This keeps the visual language consistent.
- The majority-version concept is meaningful because in realistic operational data a single instance is usually the odd one out; the tied-split edge case is handled explicitly (FR-007) for completeness but is expected to be rare.
- The feature applies to both the current "4-card overview" layout shown in the screenshots and the Koko näyttö (fullscreen) overview layout, since they render the same city cards.
- No changes are expected in the underlying data format (`data/current.json`): the existing `versionMismatch` boolean and `mismatchDetails` instance list already contain enough information to drive the new presentation.
