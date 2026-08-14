# Drift — NetScript 0.0.7 features lane

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 — attached thread lacks remote-control proof (significant)

**Date:** 2026-08-13. `agentic:launch-codex-slice` created daemon-managed, steerable thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683` with matched route and exact worktree identity, but its live
startup stream reported `remoteControl/status=disabled`. A read-only `agentic:runtime repair
codex-remote --dry-run` observed `disconnected` and refused repair because the leaf turn/child
commands are active. Per the Tier-D truth rule, mobile visibility is **not claimed**. Continue the
safe turn, then re-check/repair only at an idle boundary; never interrupt this or sibling work.

No scope or `main` drift was found. Live `origin/main` still matches the immutable dispatch base and
the approved #1348/#1502 contracts remain current.

## D-2 — #1502 contract evidence scope was omitted from the leaf plan (significant)

**Date:** 2026-08-13. PLAN-EVAL cycle 1 found that the RFC-only author plan did not cite the
coordinator-approved `rfc-plugin-cli-contribution` leaf contract, waived four of its six proving
gates, and deferred its applicable JSR audit. The user's dispatch remains authoritative that this
leaf authors the RFC and proposes a separate later implementation epic, with no CLI seam
implementation now. The topic resolution therefore keeps package/plugin paths as inspection and
audit surfaces while restoring every selected gate and JSR obligation. Any package/plugin mutation
would be a scope expansion requiring coordinator amendment and a new plan.

The requested Fable 5 / medium evaluator route was unavailable because its recorded allowance was
exhausted. Cycle 1 used the approved opposite-family native Claude Opus 5 / medium fallback and
recorded both requested and observed routes; no route match is claimed.

**2026-08-15 status update.** The reset supersedes this entry's route tension rather than resolving
it retroactively: `briefs/reset-gates/dispatch.json` order 3 now *assigns* native Claude Opus 5 /
medium as the authorized cycle-2 route, and Fable 5 is unassigned pending a coordinator amendment.
Cycle 2 will therefore record a route **match**, not a fallback.

**2026-08-15 status update to D-1.** Still open; mobile visibility for the #1502 leaf remains **not
claimed**. `agentic:runtime status` and `doctor` are `no_change` with 0 sessions and a running
managed daemon (Codex `0.147.0`), but neither reports remote-control connectivity, and `codex
remote-control` exposes no read-only status subcommand — only `start`, which is a mutation whose
blast radius covers the three sibling topic lanes. At an idle boundary with siblings live, the safe
choice is to leave it unrepaired and report. This does not affect the Claude supervisor lane, whose
Remote Control attachment is proven independently (`supervisor.md` § Controller reset).

## D-3 — Claude CLI version differs from the reset context pack (minor)

**Date:** 2026-08-15. The coordinator `context-pack.md` specifies launching topic supervisors through
"native Claude 2.1.231". The observed binary is `/home/codex/.local/share/claude/versions/2.1.233`.
The load-bearing launch identity — `--model claude-opus-5`, `--effort high`, `--remote-control`,
bypass permissions, exact initial brief — matches the contract exactly, and Remote Control attached.
Recorded because the contract named a version literal; no lane, route, or authority deviation.

## D-4 — issue #1502 lifecycle label lags PR #1651 (minor)

**Date:** 2026-08-15. PR #1651 carries exactly one lifecycle label, `status:plan-eval`. Live issue
#1502 still carries `status:research`, which was accurate at dispatch but not after the plan and its
cycle-1 gate landed. `netscript-pr` requires one accurate `status:` per open item, so the board view
under-reports this leaf's phase. The reset contract denies this orchestrator relabel authority, so
the correction is **reported, not applied**: the coordinator (or the leaf under a later grant) should
move #1502 to `status:plan-eval`. No merge or close-gate consequence today — #1651 is draft and
plan-phase, and `status:` on the *issue* is not a close-gate input.

## D-5 — #1502 author thread has no terminal `task_complete` record (minor)

**Date:** 2026-08-15. Leaf Codex thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` holds exactly one
`task_complete` record, for the S0 slice at `a02f9690…`. The plan-fix turn that produced
`12276e6d8…` emitted its final `agent_message` at `2026-08-13T21:14:22Z` — reporting local head,
remote branch, draft PR, and single PLAN-UPDATE comment all reconciled — and the rollout then ends on
a `reasoning` record at `21:14:52Z` with no end-of-turn marker.

The *work* is complete and independently verified: remote branch, PR head, and leaf worktree all
resolve to `12276e6d8…`, the tree is clean, and the repaired run artifacts plus 17 cycle-1 receipts
are committed. Only the daemon's idle marker is missing. Consequence for a later resume:
`codex-watch --mode turn` will not find a `task_complete` tail for this thread and must not be read
as "turn still running"; confirm idle from `codex-status` (0 recent agents) instead. The thread
remains the eligible resume target — never launch a rival `send-message-v2` into that worktree.

## D-6 — PR #1651's green CI check set is entirely `skipped` (minor)

**Date:** 2026-08-15. `agentic:pr-checks` reports `PASS … checks=16 currentFailures=0` at head
`12276e6d8…`, but every one of the 16 current check conclusions is `skipped` — including
`check-test`, `quality`, `deps-report`, and `close-gate`. That is the intended cheap lane for a
docs-only draft carrying `ci:skip-e2e` + `ci:skip-scaffold`, and the absence of *current failures* is
a true statement. It is not gate evidence. Per `milestone-run.md` gate-integrity check 4, "clean"
here means "nothing ran". Recorded so no later reader promotes this `pr-checks PASS` into a merge or
IMPL-EVAL green; the leaf's real proving gates are the six contracted structured gates rerun at final
head, not this rollup.
