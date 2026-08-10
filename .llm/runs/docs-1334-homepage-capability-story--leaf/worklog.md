# Worklog: homepage capability story

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1334-homepage-capability-story--leaf` |
| Branch | `docs/1334-homepage-capability-story` |
| Archetype | N/A — docs-only |
| Scope overlays | `SCOPE-docs.md` |

## Design

### Public Surface

- `docs/site/index.vto` — rendered documentation homepage.
- Canonical task routes — one-click continuation surface; no new route is introduced.

### Domain Vocabulary

- **Capability outcome** — a concrete “what you get” statement backed by a current seam.
- **Canonical task page** — the first page that teaches the named outcome.
- **Destination lane** — the existing five-item role/intent selector, unchanged.
- **Substantiation** — current export, executable snippet, existing diagram, or authoritative task page.

### Ports

- Vento component contracts — existing `cardsGrid`, diagram, and tab rendering.
- Lume output — semantic and link evidence in `_site/index.html`.
- Playwright browser — viewport, theme, semantics, rendering, and overflow evidence.

### Constants

- `CAPABILITY_DESTINATIONS` — the F1 canonical URL inventory recorded in research/evidence.
- `VIEWPORTS` — 390, 1024, 1600 CSS px.
- `THEMES` — light and dark.
- `DESTINATION_COUNT` — 5, unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 2.1 | Prove harness baseline, identity, and locked scope | baseline/issue/branch inspection | run artifacts |
| 2.2 | Prove concise outcome-led capability routes | source format, build, no nested card anchor | `index.vto`, run artifacts |
| 2.3 | Prove current exports and claim substantiation | `deno doc`; scratch `deno check --unstable-kv` | `index.vto` if needed, run artifacts |
| 2.4 | Prove rendered semantics without checker relaxation | `check:rendered-output`; source diff | run artifacts |
| 2.5 | Prove full acceptance, browser matrix, links, accuracy, caveats, locks | full prescribed sweep | run artifacts |

### Deferred Scope

- #1277 design/layout polish — backlog owner; this leaf only validates existing responsive system.
- Detailed API and capability inventory — canonical reference/catalog pages own it.
- Package/plugin doctrine remediation — no framework source changes.

### Contributor Path

Add or revise a homepage outcome in `docs/site/index.vto`, point it to its canonical task page,
verify named exports with `deno doc`, build, inspect rendered anchors/semantics, then run the browser
matrix without altering the five-item destination lane.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-10 | 2.1 | Bootstrap | Baseline `714a4ef9b`, live issue, overlay, doctrine boundary, lane identity, and locked plan recorded. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL: N/A | Owner supplied a complete, mechanically constrained plan with no material open decision. | issue brief + run-loop §4 |
| Keep five destinations | The checker and destination lane serve a separate role from capability cards. | F3 / D12 |
| No nested card-body links | Linked cards are outer anchors. | `cardsGrid.vto` / D13 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None | — | yes |

## Gate Results

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `git fetch origin && git log --oneline -3 origin/main` | PASS | head `714a4ef9b` |
| L1 inspection | `git show 714a4ef9b --stat` and focused hunks | PASS | acceptance-critical content understood and excluded from edit scope |

## Handoff Notes

- IMPL-EVAL is mandatory and must be performed by a separate supervisor-selected session.
