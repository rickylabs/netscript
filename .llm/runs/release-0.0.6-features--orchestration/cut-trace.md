# Cut trace — 0.0.6 runtime / public-surface lane

Merge-derived record. Every row is captured **from `git log origin/main` after the merge**, never
from recollection or from the dispatch plan. This lane does not cut or publish; root orchestration
owns the canary and the stable cut.

## Baseline

| Field | Value |
| --- | --- |
| Lane opened | 2026-08-12 |
| `origin/main` at open | `01aa12b67` — `docs(harness): record FILING-LOG -- board migration executed once (#1523)` |
| Owned issues | #1405, #1398 |

## Merges

| # | UTC | Merge commit on `origin/main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-12T08:20:29Z | `8ff1bcb8fc741db17a765a1965861828e0ae6171` (`8ff1bcb8f`) — `fix(streams): distinguish producer refusal reasons (#1528)` | #1528 | **#1405** (auto-closed `COMPLETED` by the body's `Closes #1405`) | `slices/pre-merge-gate-1528.md` — all 7 checks PASS |

Row 1 captured from `git log origin/main --first-parent -1` **after** the merge, per the profile's
merge-derived rule. Issue state re-read live: `CLOSED` / `COMPLETED`, `status:shipped` applied to
both issue and PR.

## Re-planning events

| # | Date | Event | Decision |
| --- | --- | --- | --- |
| _(none yet)_ | | | |

## Failure modes that cost real time

| # | Date | Failure | Cost | Mitigation recorded |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |
