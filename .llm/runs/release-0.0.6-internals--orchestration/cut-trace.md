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
| 1 | PR-A `fix/1436-1415-close-gate-trust` → **PR #1527** | #1436, #1415 | Sol · low | **dispatched** — thread `019ff4f4-1fce-7253-a7e0-d718c65b39cc`, worktree `/home/codex/repos/ns006-gatetrust`; S1–S4 landed |
| 2 | PR-E `fix/1530-type-fixture-scan-scope` | #1530 | Sol · low | not yet dispatched (inserted; gates PR-D per rail R-1) |
| 2 | PR-B `fix/1403-quality-gate-coverage` | #1403 | Sol · low | not yet dispatched |
| 2 | PR-C `fix/1380-doctrine-verdict-and-repo-gate` | #1380 | Sol · medium | not yet dispatched |
| 2 | PR-D `fix/1378-quality-scan-rule-power` | #1378 | Sol · high | not yet dispatched |

## Re-planning events

| # | When | Event | Effect on the plan | Effect on the record |
| --- | --- | --- | --- | --- |
| 1 | 2026-08-12, during PR-A impl | **Scope added then withdrawn by the owner.** #1529 (p0) was added to the lane as a separate leaf PR, then closed as not-planned with the observed CI skip declared intended. | Worktree `ns006-cigate`, branch `fix/1529-required-lane-visibility` and its brief were created, then removed. No workflow behaviour changed. Wave structure unaffected — nothing had been dispatched. | `drift.md` D-6; two incidental observations parked unacted in D-7. |
| 2 | 2026-08-12, stage B measurement | **Defect filed from inside the run**: `quality:scan:repo` red on `main` for 7 consecutive pushes because negative type fixtures are scanned as production source. Filed as #1530. | New PR-E inserted **before** PR-D: #1378's `gate:` box requires `quality:scan:repo` green and cannot be truthfully ticked until #1530 lands (rail R-1). | `drift.md` D-5. This is the scope-drift checkpoint, taken explicitly rather than discovered at cut time. |
| 3 | 2026-08-12, during PR-A impl | **Orchestrator brief error corrected mid-slice.** Gate 1 omitted `--allow-write`; the agent escalated instead of idling. | Gate 1 amended for PR-A and the permission requirement carried into the rail plan's validation table. | `drift.md` D-8. |

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
| A-3 | An issue's measured counts stay valid for the few days between filing and implementation | implicit in working from an issue body | **falsified, twice** | `arch:check:repo` FAIL moved 53 → **55** in four days, and `quality:scan:repo` moved from green to **RED exit 1** — the latter making one of #1378's own acceptance boxes unsatisfiable as written. Both found by executing, neither visible in the issue. |
| A-4 | A doctrine verdict row that names a missing directory was renamed or deleted | #1380 D6 ("plausibly renamed into the `plugin-*-core` tier") | **falsified for 5 of 6 rows** | `git log --all --diff-filter=A` shows `packages/{streams,triggers,workers,sagas}` and `plugins/hello-world` **never existed** in this repo; only `@netscript/shared` ever did (`0ef13de35 chore: genesis eject`). A third state — *authored against a layout that never landed* — is required, and a rename note would have fabricated provenance. |
| A-5 | The escalate-don't-idle brief instruction changes behaviour | `agent-milestone-orchestrator` § Delegation (4 idle-at-red-gate occurrences in 0.0.4) | **confirmed** | PR-A's agent hit a red Gate 1, diagnosed it as a pre-existing permission gap, refused to weaken unrelated tests, recorded it, escalated, and continued unblocked work. `drift.md` D-8. |
