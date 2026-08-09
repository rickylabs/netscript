FAIL_PLAN

## Cycle-1 finding dispositions

| Cycle-1 finding | Disposition | Evidence gathered |
| --- | --- | --- |
| BLOCKER 1 — false re-baseline and unmaintained cut trace | **PARTIAL** | After `git fetch origin main --prune`, `git rev-parse origin/main` returned `a6b2e4c31d80405d5225887cde7ab61baa2802f8`; live counts were 21 open 0.0.5 issues, four open 0.0.5 PRs (#1392–#1395), 31 open 0.0.6 issues, and 12 open 0.0.7 issues. `git log --first-parent fac9e3390..origin/main` returned exactly #1391, #1337, #1347, and #1215; `git show --name-only` confirmed only #1391 touches `packages/**`. This matches `plan.md:366-378`. `cut-trace.md:63-70` contains every first-parent commit from W1 through current main, so there is no commit gap, but it does not exactly match the live history: #1341/#1342/#1346/#1391 are one second later than Git's author/committer time and #1347/#1215 retain `~21:5x`/`~22:xx` instead of the live `21:35:34Z`/`21:43:52Z`. The required research input also still calls `2508eb8c9` authoritative (`research.md:3-10`). |
| BLOCKER 2 — W3-B clustering | **FIXED** | `plan.md:428-432` gives #1102, #1375, and #1376 separate PR groups and routes #1197 to the post-publish manifest. Live `gh issue view 1376 --json body` still says #1375 and #1376 must remain separable. Each implementation issue now has one PR-shaped acceptance surface. |
| BLOCKER 3 — closure manifest and #1126 | **NOT FIXED** | Moving #1126 is correct: live #1139/#1140 are open in 0.0.6 and `netscript-pr` forbids closing an epic before every child is done (`.agents/skills/netscript-pr/SKILL.md:106-107,229-237`). The manifest is still false for #1169 and #1004, and its scope total is wrong; see BLOCKER below. |
| HIGH 4 — sweep dispositions | **PARTIAL** | `git merge-base --is-ancestor 1455231b0 fac9e3390` exited 0, and the downloaded run-31201560939 artifact shows canary.16 used `jsr:@netscript/cli@0.0.5-canary.16` but generated under the checkout's `.llm/tmp`, so it does not already satisfy #1343's outside-checkout criterion. Live #1373 has twelve boxes; none requires a compiler, and the owner comment dated 2026-08-08T22:11:14Z assigns compilation to #1374. #1379 is bounded only after choosing one of two materially different lock policies; v4.1 still does not choose one. |
| HIGH 5 — briefs and slice tables | **NOT FIXED** | `find .../slices -name implement.md` returned only the two historical T1 files and the three W2 files. There are no v4.1 briefs or ordered commit-slice tables for W3–W5, including #1373, #1356, #1375, #1376, #1359, or #1379. `plan.md:512-520` defers their creation until before dispatch; Plan-Gate requires them before this evaluation (`plan-gate.md:26-27`; `plan-protocol.md:40`). |
| HIGH 6 — silently-doing-nothing gates | **PARTIAL** | The recorded expensive-gate practice is sufficient for this three-lane wave: one orchestrator-only holder, a grant row before execution, release before the next grant, and inadmissibility of an ungranted result make an ungranted or overlapping run distinguishable in `expensive-gate-log.md:10-31`. No tool is required. The milestone receipt's absence is visible in prose, but the live dispatch registry does not bind W3 to it: `phase-registry.md:15` still gates W3 only on W2-B and retains the v4 cluster. A skipped move would leave no receipt, but the artifact used to advance the run does not make that state a W3 predicate. |
| MEDIUM 7 — dependencies and canary rationale | **PARTIAL** | Locking `apps/<app>/lib/<service>.ts` is a valid decision dependency (`plan.md:449-455`; live #1373 comment lines 35-39). The W5-C constraint is consistent with the cycle-1 remedy: reuse W4-A's GLM-reviewed design and require a GLM 5.2 pass on departure (`plan.md:457-464`; `lane-policy.md:40-42,222-224`). Four declared wave-boundary canaries match `canary-cadence.md:37-58,154-163`, and C20's same-content cut rule matches `netscript-release`. These repaired decisions are not reflected in `phase-registry.md:15-20`, and no W5-C brief carries the constraint. |

## Surviving and new findings

### BLOCKER — The retained scope and closure manifest are not truthful

The arithmetic at `plan.md:406-415` is `21 - 1 + 5 + 2 = 27`, not 26. The group and manifest unions likewise identify 27 retained issues. The milestone width itself has no contract maximum and the PR groups are bounded; the defect is that the declared scope is not the scope the plan enumerates.

The missing move is #1169:

- Live `gh issue view 1169 --comments` shows the owner added #1175 as S8 and deferred it after the release activity. #1175 is still OPEN in milestone 0.0.6. #1169 carries `type:umbrella` and `epic:harness-v3`; the epic rule requires every child to be done before hand closure.
- #1169's live Definition of Done requires a clean, green **release cut** to reach publish in one pass. `plan.md:476` substitutes one-pass publication across C17–C20 and four canary receipts. Canary receipts are not the stable-cut event that the issue names.
- Live #1004 still has its second acceptance box unticked: the retry must publish only missing members and log already-published members. `plan.md:473` permits “a reasoned finding that the lane still lacks one” to close it. That is non-occurrence, not acceptance; the plan's own last column already supplies the correct result, move to 0.0.6.
- Although `plan.md:468-469` claims every manifest row names an authority, the table has no authority column and most rows do not identify who adjudicates the evidence.

Required change: move #1169 to 0.0.6 now with #1175, which makes the retained count 26; change #1004 so only a demonstrated same-semver recovery can close it and otherwise move it; make #1169's eventual evidence the one-pass stable cut; and add an explicit authority to every non-PR closure row. Recompute the exact retained set once and make the scope heading, groups, closure manifest, phase registry, and milestone receipt agree.

### HIGH — V4.1 still has no evaluable W3–W5 slice plan

Plan-Gate is before implementation and requires ordered slices, touched files, and proving gates (`.llm/harness/gates/plan-gate.md:17-34`; `.llm/harness/evaluator/plan-protocol.md:30-40`). V4.1 instead promises to create these later (`plan.md:512-520`). The existing files remain v3 artifacts: `phase-registry.md:15-20` combines the rejected W3 cluster, has only C17/C18, omits W4-D, retains #1126 in F, and has no milestone-move predicate. The slice tree has no v4.1 brief for any changed future group.

This also leaves the framework-wave `quality:gate`, `arch:check`, conditional doc lint, publish dry-run, negative cases, JSR surface scan, and the W5-C design constraint as generic prose rather than selected per-group gates. `_shared-brief-contract.md:21-47` does not supply files, applicability, or a commit order for any group.

Required change: before another PLAN-EVAL, create the v4.1 brief and ordered commit-slice table for every W3–W5 group; name files, per-slice claims, and proving gates; select archetype/overlay/JSR gates per touched surface; and update `phase-registry.md` to the same groups, four canaries, F manifest, and milestone-receipt predicate.

### HIGH — #1379 leaves a must-resolve lock decision open

Live #1379 permits either (a) deleting the private lock and repointing SDK imports to the workspace or (b) retaining the private lock and enforcing frozen-lock behavior plus regeneration guidance and a negative test. These choices change different files and migration behavior. `plan.md:392-397` cites both as proof of boundedness but selects neither.

Required change: select (a) or (b) in the wave plan with rationale, then bind the W4-D brief, files, red-first test, clean-worktree result, and rollback boundary to that decision. Deferring the choice to implementation fails the open-decision sweep.

### HIGH — The milestone-move gate is visible but not bound to dispatch state

`plan.md:485-491` defines a receipt and states W3 cannot dispatch without it. At the evaluated state, the pulled issues correctly remain in 0.0.6 and #1126 correctly remains in 0.0.5 because moves occur only after PASS; therefore receipt absence is currently expected and observable. However, `phase-registry.md:15` is the live W3 state row and names only W2-B as its gate. It neither enumerates the eight before/after results nor represents `NOT_RUN`/`MISMATCH`.

Required change: add the receipt as a required W3 predicate in `phase-registry.md`; after a future PASS, record all moves with exact before/after live queries and change the predicate to passed only if the set matches. This is a recorded practice, not a request for new tooling.

### MEDIUM — The live trace and research baseline retain inaccurate metadata

`git log --first-parent --format='%H %aI %cI %s'` gives exact UTC times of 06:53:29, 12:54:38, 17:12:32, 21:27:56, 21:35:34, and 21:43:52 for the affected rows. `cut-trace.md:63-70` records four of those one second late and leaves the last two approximate. `milestone-run.md:36-41` requires the trace to record each merge's time. `research.md:3-10` still declares the 2026-08-06 SHA authoritative, contrary to the current plan and worklog.

Main did not move during this evaluation, so this is not a live-race exception. A running milestone cannot prevent a concurrent merge, but it can make staleness explicit: record an evaluated-through SHA/time, append any later first-parent rows before each dispatch/canary/cut, and have the pre-dispatch and pre-cut checks fail closed when `origin/main` differs.

Required change: replace the approximate/inaccurate trace timestamps from live Git data; append a current re-baseline section to `research.md`; and state the recurring evaluated-through-SHA check rather than treating re-baselining as a one-off repair.

### MEDIUM — W3 has no three-lane dispatch order

V4.1 defines five W3 PR groups (`plan.md:428-432`) but caps the run at three active supervisors (`plan.md:446`). Unlike W4, it does not state which three start or what completion releases lanes for the remaining two. W4's four-group/three-lane sequencing is coherent: W4-D can start with W4-B/W4-C, and W4-A enters the lane released by W4-D. The 26-issue milestone is not too wide solely by count; the missing W3 sub-order is the execution ambiguity.

Required change: state the W3 dispatch batches or lane-release order while preserving W3-A's W2-B dependency and the declared independence of B1/B2/B3/C.

## Plan-Gate checklist result

| Plan-Gate item | Result | Evidence |
| --- | --- | --- |
| Research present and current | **FAIL** | `research.md:3-10` still freezes `2508eb8c9`; the trace has complete commit membership but inaccurate/approximate times. |
| Decisions locked | **FAIL** | #1379's root/private-lock policy is unresolved. |
| Open-decision sweep | **FAIL** | The #1379 choice is not classified must-resolve-now, and it changes the implementation and tests. |
| Commit slices (<30, gate + files each) | **FAIL** | No v4.1 W3–W5 briefs or commit-slice tables exist; `plan.md:512-520` defers them. |
| Risk register | **FAIL** | No v4.1 register covers the selected #1379 policy, false closure paths, W3 five-group lane order, or registry/plan drift. |
| Gate set selected | **FAIL** | The shared generic contract is not a per-group applicability/files/negative-proof selection. |
| Deferred scope explicit | **FAIL** | #1169 remains scheduled for closure with open child #1175; #1004 has a false closing event; retained scope is miscounted. |
| jsr-audit surface scan | **FAIL** | No v4.1 scan is tied to the newly pulled Fresh-UI/CLI/MCP/publishable surfaces and their slices. |

Plan-Gate result: **FAIL_PLAN**. This is the second `FAIL_PLAN` cycle; `.llm/harness/gates/plan-gate.md:40` and `.llm/harness/evaluator/plan-protocol.md:52-55` require escalation to the user.
