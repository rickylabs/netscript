# Cut Trace — 0.0.6 chores/internals lane

The instrumented merge record for this lane, captured **during the run from `git log origin/main`**,
never reconstructed. This lane is topical: it records its own four PRs, not the whole 0.0.6 milestone.
Root 0.0.6 orchestration owns canary payload computation and the stable cut.

## Merge record

| # | Merged (UTC) | Commit on `origin/main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| 5 | 2026-08-12 ~16:12Z | `eb373db29` | **#1585** | **#1380** (`CLOSED/COMPLETED`) | 7/7 — `pr-checks` **26 checks, 0 current failures** at `0b34371c2`; **13/13** boxes mirrored; `review-threads` PASS. Verified on merged main: **`arch:check:repo` exit 0**, closing an entry `DEBT_ACCEPTED` red since **2026-06-21**. Two eval cycles: `FAIL_FIX` on a false-done provenance claim the orchestrator **wrongly rebutted** from a shallow clone, then `PASS` at `0b34371c2` after correction. |
| 4 | 2026-08-12 ~14:33Z | `e391f3aec` | **#1570** | **#1403** (`CLOSED/COMPLETED`) | 7/7 — `pr-checks` **22 checks, 0 current failures** at `807d29003`; `close-gate` green after label + workflow re-run; **8/8** issue boxes mirrored from `box-index` evidence; `review-threads` PASS. Verified **on merged main**: `arch:check` exit 0 **at 36 roots** (was green only at 16), `quality:scan:repo` exit 0. Evaluator provenance preserved on proof: `PASS` at `c740ff6e0`, head moved to `807d29003` by another lane's `update-branch`, owned-path diff **empty**, so the evaluated implementation is the shipped implementation. |
| 3 | 2026-08-12 13:40Z | `b79eca5d6` | **#1567** | **#1566** (`CLOSED/COMPLETED`) | 7/7 — `pr-checks` 0 current failures at `f6def9946`; `close-gate` PASS; 6/6 issue boxes mirrored; the one PR-body DoD box untickable at hand-off ticked by the orchestrator with run identities as evidence; `review-threads` PASS. **Merged by the release coordinator during a Claude 529 outage**, independently re-verified here: main contains it, `phase-eval-status.mjs` is present on trusted main, both items `status:shipped`. Verdict was head-matched to `f6def9946` before consumption (one trigger `gen=29340872564`, one verdict run `31599209037`). |
| 2 | 2026-08-12 ~12:24Z | `e67c1ba13` | **#1560** | **#1530** (auto-closed `COMPLETED`) | 7/7 pass — `pr-checks` **23 checks, 0 current failures** at `28fc1b423`; `close-gate` green after label + workflow **re-run** (not a push); boxes 1–6 mirrored, box 7 `[post-merge]` verified after merge and ticked with evidence; `review-threads` PASS. **Two IMPL-EVAL verdicts:** `PASS` at `49e2b86e9` (pre barrel fix) then **`FAIL_FIX`** at `9ab361440` on a real close-gate defect, then `PASS` at `28fc1b423`. Consuming the first would have merged a red gate. |
| 1 | 2026-08-12 ~08:31Z | `63cd1cd58` | **#1527** | **#1436**, **#1415** (both auto-closed `COMPLETED`) | 7/7 pass — full record in the PR's `[PRE-MERGE GATE]` comment. `pr-checks` **15/15 `current-pass`, 0 current failures** at `dfda54a16`; `close-gate` green; #1415 4/4 boxes mirrored with linked evidence; #1436 has 0 boxes so the PR body is its record; no new ignores/casts, no lock churn; both probes re-run independently by the orchestrator; `review-threads` PASS (0 threads). |

## Wave clustering as dispatched

| Wave | PR | Issues | Lane | Status |
| --- | --- | --- | --- | --- |
| 1 | PR-A `fix/1436-1415-close-gate-trust` → **PR #1527** | #1436, #1415 | Sol · low | **MERGED** `63cd1cd58` — thread `019ff4f4-1fce-7253-a7e0-d718c65b39cc`, worktree `/home/codex/repos/ns006-gatetrust`, 7 commits |
| 2 | PR-E `fix/1530-type-fixture-scan-scope` → **PR #1560** | #1530 | Sol · low | **MERGED** `e67c1ba13` — thread `019ff5b2-7d02-…`, worktree `/home/codex/repos/ns006-typefixtures`, 6 commits. Restored `main`'s blocking `code-quality-repo` job: first green in **nine** consecutive push-to-main runs. |
| 2 | PR-B `fix/1403-quality-gate-coverage` → **PR #1570** | #1403 | Sol · low | **MERGED** `e391f3aec` — absorbed rail `R-5` (A14 origin-awareness) after the implementer caught the plan's incoherent split; 3 defects fixed on one gate |
| 2 | PR-C `fix/1380-doctrine-verdict-and-repo-gate` → **PR #1585** | #1380 | Sol · medium | **MERGED** `eb373db29` — verdict table restored to 36 units; `arch:check:repo` green after 7 weeks accepted-red; RFC location resolved; shallow-clone diagnostic recorded |
| 2 | PR-D `fix/1549-quality-scan-provable-half` | **#1549** | Sol · medium | **dispatched** — consumes #1537's `extractFencedBlocks`; last open issue in the lane |

## Re-planning events

| # | When | Event | Effect on the plan | Effect on the record |
| --- | --- | --- | --- | --- |
| 1 | 2026-08-12, during PR-A impl | **Scope added then withdrawn by the owner.** #1529 (p0) was added to the lane as a separate leaf PR, then closed as not-planned with the observed CI skip declared intended. | Worktree `ns006-cigate`, branch `fix/1529-required-lane-visibility` and its brief were created, then removed. No workflow behaviour changed. Wave structure unaffected — nothing had been dispatched. | `drift.md` D-6; two incidental observations parked unacted in D-7. |
| 2 | 2026-08-12, stage B measurement | **Defect filed from inside the run**: `quality:scan:repo` red on `main` for 7 consecutive pushes because negative type fixtures are scanned as production source. Filed as #1530. | New PR-E inserted **before** PR-D: #1378's `gate:` box requires `quality:scan:repo` green and cannot be truthfully ticked until #1530 lands (rail R-1). | `drift.md` D-5. This is the scope-drift checkpoint, taken explicitly rather than discovered at cut time. |
| 4 | 2026-08-12, stage B (rail) | **Rail plan failed its PLAN-EVAL** (`FAIL_PLAN`, 6 blocking). Two locked decisions withdrawn (R-6, R-9), the A14 baseline corrected, six acceptance boxes routed, two protocol artifacts added, and the #1374 extractor collision resolved. | No rail PR dispatched; plan revised and re-submitted as cycle 2 of a two-cycle limit. Wave 2 order unchanged. | `drift.md` D-11, `plan-eval.md`, `plan-quality-rail.md` § Revision 2. |
| 5 | 2026-08-12, stage B (rail) | **An acceptance criterion was amended on a live issue** — #1380 box 2, with owner authorization, to admit "never present under that name" and to require per-row git evidence. | PR-C can now close #1380 with an accurate provenance record instead of an unticked box. | Issue #1380 comment `5264580324`; `research.md`. The amended box is strictly harder than the original, which required only a label. |
| 6 | 2026-08-12, stage B (rail) | **Cross-lane dependency accepted**: #1374 owns the `docs/site/**` fenced-TS extractor; #1378's PR-D consumes it. | PR-D sequences after PR #1537. Stated fallback: if that surface stays private, slice D5 and #1378 box 3 move with the issue rather than being forked or ticked. | PR #1537 comment `5264583905`; rail `R-10`. |
| 3 | 2026-08-12, during PR-A impl | **Orchestrator brief error corrected mid-slice.** Gate 1 omitted `--allow-write`; the agent escalated instead of idling. | Gate 1 amended for PR-A and the permission requirement carried into the rail plan's validation table. | `drift.md` D-8. |

## Failure modes that cost real time

| # | When | Symptom | Root cause | Cost | Recorded where |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-12 08:14–08:21Z | `status:ready-merge` applied; nothing happened. `close-gate` stayed red on its pre-label result, #1415's boxes stayed unticked. | `labeled` is absent from `ci.yml:41` and `e2e-cli.yml` `pull_request.types`, yet both `netscript-pr` and `check-close-gate.ts`'s repair hint claim the label triggers a run. | ~7 min, one wasted verification cycle | `drift.md` D-10. Fix is label-then-**push**; the one-line workflow/doc repair is raised to the owner, not taken by this lane. |
| 2 | 2026-08-12 ~09:56Z | Attached Codex launch received SIGTERM (exit 143) from a shell `timeout 580` wrapper. | The orchestrator wrapped an attached launch/resume in `timeout` to avoid blocking its own turn. The wrapper's SIGTERM kills the attached slice at expiry. | none this time — the thread survived and produced 5 further commits — but the practice is unsafe and was initially mis-recorded as harmless | `drift.md` D-9. Attached launch/resume now run unwrapped; bounded observation uses `agentic:codex-watch --timeout-seconds`. |
| 3 | 2026-08-12 08:00Z | `codex exec resume` refused with `thread-store conflict: … already has an active writer`. | Steering was attempted mid-turn instead of at a turn boundary. | ~2 min | `drift.md` D-9. That error is the mechanical signal for "not at a turn boundary"; steer on `codex-watch --mode turn` completion. |

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
| A-6 | A `cancelled` expensive gate on a PR means the gate did not run | pre-merge gate check 4 read naively | **falsified, and it nearly manufactured a false red** | `scaffold-runtime` and `scaffold-runtime-sqlite` first evaluated as `cancelled`. Applying the #1142 rule — only the latest run per check name — resolved both to real `success` (`08:26:44Z`, `08:22:52Z`). Blocking on the cancelled pair would have been the mirror image of check 4's false greens. |
| A-5 | The escalate-don't-idle brief instruction changes behaviour | `agent-milestone-orchestrator` § Delegation (4 idle-at-red-gate occurrences in 0.0.4) | **confirmed** | PR-A's agent hit a red Gate 1, diagnosed it as a pre-existing permission gap, refused to weaken unrelated tests, recorded it, escalated, and continued unblocked work. `drift.md` D-8. |
