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

| 2 | 2026-08-12T10:27:26Z | `d7e2b67b2be535c9ca13449f97f8f4585344030a` (`d7e2b67b2`) — `fix(workers): publish job executions to the durable stream on the job.execute trace (#1536)` | #1536 | **#1398** (auto-closed `COMPLETED` by the body's `Closes #1398`) | `slices/pre-merge-gate-1536.md` — all 7 checks PASS at head `f7d503fee` |

Both rows captured from `git log origin/main --first-parent -1` **after** each merge, per the
profile's merge-derived rule. Issue states re-read live: both `CLOSED` / `COMPLETED`, with
`status:shipped` applied to each issue and PR.

**Lane complete: both owned issues landed on `main`.**

## Re-planning events

| # | Date | Event | Decision |
| --- | --- | --- | --- |
| 1 | 2026-08-12 | #1536's head changed mid-flight, `e4319c685` → `f7d503fee` | The phase-eval dispatcher (#1524) merged **after** the branch's last `main` sync, so `openhands-phase-eval.yml` was absent from the PR's merge ref and no label cycling could trigger it. Owner approved syncing the branch, accepting a full CI re-run. All gate evidence was then re-read against the new head; no pre-sync evidence was carried forward. |
| 2 | 2026-08-12 | Evaluation route changed twice mid-run | D-3 removed formal IMPL-EVAL for the small deterministic class (after #1405 had already merged); D-4/D-5 moved phase evaluation to the automatic label-driven dispatcher. #1398's IMPL-EVAL consequently ran on the automatic route rather than a manual launch. |

## Failure modes that cost real time

| # | Date | Failure | Cost | Mitigation recorded |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |
