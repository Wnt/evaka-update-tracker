# Before Mockups — 025-version-mismatch-info

**Captured**: 2026-04-09 (manually, pre-implementation)

These "before" mockups show the current state of the two affected views when a version mismatch exists. They are written manually (not via `npm run capture-views`) because the default E2E test fixture does not include a mismatch scenario — see `research.md` §R9. Content is reproduced from the user-provided screenshots attached to the feature request.

Two views are affected:

1. Overview card for `Tampereen seutu` (with a staging-env mismatch)
2. City detail page for `Tampereen seutu` (same mismatch)

"After" mockups will be produced post-implementation and attached to the PR description alongside these, per constitution §Development Workflow.

---

## Overview page — Tampereen seutu card (BEFORE)

Current behaviour: a single generic warning banner appears inside the affected environment's section. The warning text does **not** say which environment is affected, and the TUOTANTO / TESTAUS row dots are both the normal green OK colour regardless of the mismatch.

```text
┌──────────────────────────────────────────────────────────┐
│ Tampereen seutu                                          │
│                                                          │
│  [ 3 Testauksessa ]  [ 1 Julkaisematta ]                 │
│                                                          │
│  TUOTANTO  ● Korjataan Spring component -ko…  ke 8.4. 14.09
│  TESTAUS   ● Lisätään check constraint citizenMo… to 9.4. 09.23
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Versioero havaittu instanssien välillä             │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Legend:

- `●` = green status dot (`.status-dot.ok`, `#22c55e`), identical on both rows.
- The warning banner background is `#fef3c7` with border `#fcd34d` — unchanged by this feature; only the text inside it changes.

**Problems**:

- From the overview alone, the operator cannot tell whether the mismatch is in production or testing. Severity is ambiguous.
- The TESTAUS row visually looks identical to a healthy row — the row-level status dot gives no hint that the environment is in an abnormal state.

---

## City detail page — Tampereen seutu (BEFORE)

Current behaviour: a generic `Versioero havaittu` banner above a nine-chip instance list. Every chip has a green dot regardless of which instance is the odd one out. The operator must manually compare the 7-char SHA strings to find the mismatch.

```text
Tampereen seutu

Muutoshistoria

TUOTANTO          ● Korjataan Spring component -konfliktit    ke 8.4. 14.09
STAGING / TESTI   ● Lisätään check constraint citizenModifiedAt kolumnille  to 9.4. 09.23

┌────────────────────────────────────────────────────────────────┐
│ Versioero havaittu                                             │
└────────────────────────────────────────────────────────────────┘

  ● test-varhaiskasvatus (07eb452)   ● test-evaka (5bceaea)
  ● test-evaka (5bceaea)             ● test-evaka (5bceaea)
  ● test-evaka (5bceaea)             ● test-evaka (5bceaea)
  ● test-evaka (5bceaea)             ● test-evaka (5bceaea)
  ● test-evaka (5bceaea)

> Näytä riippuvuuspäivitykset

▼ Viimeisimmät muutokset tuotantoympäristössä
▼ Muutokset testauksessa
  [core] Lisätään check constraint citizenModifiedAt kolumnille      Tekninen 8.4.
  [core] Korjataan flaky e2e                                         Tekninen 8.4.
  [core] Korjataan tyyppivirheet frontticustomoinneissa              Tekninen 8.4.
▼ Odottaa julkaisua
  [core] Korjataan sandbox-ympäristön kotihakemisto                  Tekninen 9.4.
▶ Ominaisuudet
```

Legend:

- Every `●` chip dot is green (`.status-dot.ok`, `#22c55e`) even though `test-varhaiskasvatus (07eb452)` is the odd one out versus the eight `test-evaka (5bceaea)` chips. The only way to spot the mismatch is to compare the parenthesised short SHAs by eye.

**Problems**:

- The warning says "Versioero havaittu" but does not name the offending sub-city.
- Visual indication is identical across all nine instances — all green dots — so spotting the odd one out requires reading every short SHA.

---

## Reference: current source of the rendering

- Overview card generic warning: `site/js/components/overview.js:139-141`
- City-detail chip list and warning: `site/js/components/city-detail.js:149-159`
- Status-dot CSS classes: `site/css/style.css:184-193`

These are the exact lines that will change. See `plan.md` → "Source Code" for the full file list.
