# Cut Trace — 0.0.6 chores/internals lane

The instrumented merge record for this lane, captured **during the run from `git log origin/main`**,
never reconstructed. This lane is topical: it records its own four PRs, not the whole 0.0.6 milestone.
Root 0.0.6 orchestration owns canary payload computation and the stable cut.

## Merge record

| # | Merged (UTC) | Commit on `origin/main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | *no merges yet* |

## Wave clustering as dispatched

| Wave | PR | Issues | Lane | Status |
| --- | --- | --- | --- | --- |
| 1 | PR-A `fix/1436-1415-close-gate-trust` | #1436, #1415 | Sol · low | not yet dispatched |
| 2 | PR-B `fix/1403-quality-gate-coverage` | #1403 | Sol · low | not yet dispatched |
| 2 | PR-C `fix/1380-doctrine-verdict-and-repo-gate` | #1380 | Sol · medium | not yet dispatched |
| 2 | PR-D `fix/1378-quality-scan-rule-power` | #1378 | Sol · high | not yet dispatched |

## Re-planning events

| # | When | Event | Effect on the plan | Effect on the record |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Failure modes that cost real time

| # | When | Symptom | Root cause | Cost | Recorded where |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## Falsified / confirmed assumptions

Rules this run tested, per `agent-milestone-orchestrator` § Evidence discipline. An orchestrator who
patches over a falsified assumption instead of recording it destroys the evidence the next milestone
needed.

| # | Assumption | Source | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| A-1 | An issue's prescribed fix can be implemented as written | #1436 "Fix" section | **falsified** | `\b` already present at `acceptance-evidence.ts:43`; the prescribed patch is a no-op. `drift.md` D-4. |
| A-2 | Re-baselining an issue body against HEAD is ceremony for mechanical issues | implicit in "mechanical ⇒ no plan needed" | **falsified** | The re-baseline is what caught A-1, on the smallest issue in the lane (p2, 2-line fix). |
