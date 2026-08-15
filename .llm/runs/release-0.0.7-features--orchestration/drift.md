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

## D-7 — supervisor's own verdict watcher produced a false terminal signal (minor)

**Date:** 2026-08-15. The first background watcher armed on the cycle-2 evaluator parsed
`firstTerminalAt` and `state` into one whitespace-delimited string; a null `firstTerminalAt`
collapsed, so `awk '{print $1}'` returned the *state* value and the watcher exited `0` — "terminal" —
while the evaluator was still working. No wrong conclusion was published: the exit code was treated
as a prompt to inspect, the job state was read, the session was found `working`, and the watcher was
rewritten to emit an unambiguous `TERMINAL`/`RUNNING` token and self-tested before re-arming.

This is the `agent-milestone-orchestrator` rule "verify the artefact, never the exit code" firing
against the supervisor's own tooling. Standing consequence for this lane: a watcher exit is a wake
signal only. A terminal PLAN-EVAL/IMPL-EVAL verdict is established from the committed artifact —
verdict token, evaluated head, pushed commit, and live PR state — never from a watcher exit, a
session's self-summary, or a job `state` field.

## D-8 — an evaluator PASS that predates its own merge gate (significant)

**Date:** 2026-08-15. IMPL-EVAL session `2a8cf0a6-…` started `04:03:50:58Z` and returned `PASS` at
`04:05:30Z`. The owner's merge-gating comment `#issuecomment-5300440887` was created at `04:04:16Z` —
inside that window, 74 seconds before the verdict. The evaluator neither saw nor could have addressed
it.

A terminal `PASS` is therefore **not** merge authority by itself: it certifies the head it evaluated
against the brief it was given, and nothing about gates raised afterwards. This lane must check for
gating comments created after an evaluator's start time before treating any verdict as clearing
merge, and must never let a chronologically-earlier verdict discharge a later gate. Recorded because
the two events were close enough that a careless reader would take the `PASS` as answering the
comment.

## D-9 — Tier-A reviewer routing conflicts with the reset contract (significant)

**Date:** 2026-08-15. The coordinator's amendment grant requires "a fresh independent Tier-A review
from the opposite persistent Codex session". The only persistent Codex sessions for this lane are the
coordinator's own (`019ffaa3-…`, which this orchestrator must not steer) and the **parked** historical
topic controller `019ffcc0-e1d2-7850-a308-354b670c6f3d`.

The reset common contract says the parked thread is preserved and "never resume it as a topic
controller". A one-off read-only review is not controller resumption, so the two instructions can be
reconciled — but only under strict conditions, which this lane will impose: the parked thread is
resumed **read-only**, pointed at the *leaf* worktree rather than the topic worktree, sequenced after
the author turn is idle so the one-active-send-per-worktree rule holds, briefed to write and commit
nothing and to report findings in its turn message only, and never to act as a controller or touch
the topic branch. It is not re-parked as a controller afterwards.

Additionally, harness law says the opposite-family reviewer of Codex-authored work is Claude. A Codex
reviewer of Codex-authored work is same-family. This lane therefore treats the Codex review as an
**additional independent perspective the coordinator asked for**, and still performs its own Claude
Tier-A review, so the no-lane-self-certifies invariant is satisfied by a genuinely opposite-family
reviewer regardless.

## D-10 — the owner verdict narrows an amendment that was already briefed wider (significant)

**Date:** 2026-08-15. The coordinator's first amendment grant carried a 12-item checklist derived
from a delegated overlap audit. The owner's keep-and-narrow verdict then replaced it with an 8-point
contract that is **strictly narrower**: four of the twelve items (a `PluginCliJson` brand, a
normative outcome mapping across the adapter, cancellation/deadline settlement semantics, and
identity-domain mapping) are no longer authorized, because writing them would make #1651 define
command-store semantics that the same verdict assigns exclusively to RFC 0003 / #1490.

The drift worth recording is the shape, not the change: an audit that asks "prove this is not a
duplicate" naturally produces a checklist of *couplings to specify*, and specifying a coupling in
the wrong document is how one RFC quietly annexes another's semantics. The owner's correction runs
the opposite way — remove ownership from the overlapping section rather than document the overlap in
more detail. The supersession table in `worklog.md` records each item's disposition so no later
reader treats the four removed items as unfinished obligations.

Consequence for this lane: the Tier-A review and the final IMPL-EVAL must check the amendment
against **the 8-point contract**, and must treat any newly added command-store semantics in RFC 0000
as a finding, not as thoroughness.

## D-11 — the RFC's blanket non-assignability claim is false as written (minor)

**Date:** 2026-08-15. `rfcs/0000-plugin-cli-contribution.md:891` states "assignability between the
payloads is a failure, not reuse" without qualification. `PluginCliJson` and RFC 0003's `CommandJson`
are the same six-member recursive JSON union (only member order differs), so they are mutually
assignable today and a conformance test asserting the blanket rule would fail against RFC 0003.

This is an accuracy defect in existing text, not a design gap. The bounded repair is to scope the
law to the **envelope, definition, and result** payload types — where it is true and load-bearing —
and to state that structurally identical plain-JSON value aliases are expected and are not evidence
of coupling. Introducing a brand or discriminant to make the blanket claim true would be a design
change, which the owner verdict does not authorize.

## D-12 — a foreground Claude launch is invisible to every liveness signal this lane uses (minor)

**Date:** 2026-08-15. The final IMPL-EVAL was first launched as `claude --effort medium … --model
claude-opus-5 "<brief>"` without `--bg`. That starts a real, working session, but a **foreground**
one: it creates no `/home/codex/.claude/jobs/<id>/` directory, and its stdout redirect stays empty
until exit. Both of this lane's liveness checks — job-state polling and the redirect log — therefore
reported nothing, and I killed a session that was mid-work.

Nothing was lost: the transcript held 69 records, all reads (11 `Bash`, 2 `Read`, 1 `Skill`,
1 `ListAgents`), with no commit, artifact, or PR comment, and the worktree was clean afterwards. The
relaunch with `--bg` registered `e8cd9765` immediately.

Two standing consequences for this lane. First, **always pass `--bg` when launching an evaluator**,
not only for supervision convenience but because `respawnFlags` — the only trustworthy source for a
bg session's observed route (argv omits `--model`/`--effort` for spare-claimed sessions) — exists
only for registered background jobs. A foreground launch cannot prove its own route. Second, absence
of a job dir is **not** evidence a session is dead; check the session transcript under
`~/.claude/projects/<slug>/<sessionId>.jsonl` before concluding anything. This is D-7's rule
generalised: verify the artefact, never the absence of a signal.

## D-13 — #1293's premise is stale: the connection-error hook is published but dead (significant)

**Date:** 2026-08-15. Issue #1293 states as gap 2 "**No connection-error hook.**" That is not the
live state. `packages/prisma-adapter-mysql/src/types.ts:39` already declares

```ts
/** Callback when connection errors occur */
onConnectionError?: (err: Error) => void;
```

on `PrismaMySqlOptions`, and `src/mod.ts:51-58` already re-exports `PrismaMySqlOptions` from the
package's public surface. The package is published at version `0.0.6`, so the option **is shipped**.

It is also **never invoked**. A repository-wide search for `onConnectionError` returns exactly three
hits: the declaration itself, `examples/basic-usage.ts:39` which passes a callback that can never
fire, and `docs/site/reference/prisma-adapter-mysql/index.md:23`, which tells readers the hook "is
not supported by the shipped adapter and is blocked on #1293". Nothing in `adapter.ts` calls it.

So the real defect is worse and differently shaped than the issue describes: a **published option
whose predicate can never fire**, shipped alongside an example that appears to use it. That is the
same defect class this lane already found twice on #1502 — S1's undeclared diagnostic-code type and
S2's `PluginCliCapabilityGrant.denied`, whose non-empty case could never occur — and
`milestone-run.md` § Gate integrity names it the signature failure of this kind of work.

Consequence for the leaf, recorded in its brief so it does not start from the stale premise: the
work is not "add a hook". It is "decide between wiring the already-published option and removing
it", and those two options are not symmetric — the option is in the published surface at `0.0.6`, so
wiring it is additive while removing it is a breaking change. Gap 1 of the issue (`PrismaMySqlAdapter`
unexported) **is** accurate: `src/adapter.ts:319` declares `class PrismaMySqlAdapter` with no
`export`, and `src/mod.ts:40` re-exports only `PrismaMySql` and `PrismaMySqlAdapterFactory`.

The docs page carries a forward reference to #1293 and will become false the moment this leaf ships.
It is `docs/`-owned, not `packages/`-owned, so this leaf should report it rather than silently edit
it — see the cross-lane boundary on #1112.

## D-14 — a background session's `state.json` can never mark terminal (significant)

**Date:** 2026-08-15. The #1293 PLAN-EVAL job `75d9028e` completed its work, wrote its verdict, and
pushed commit `7780ba49e` — but its `state.json` never set `firstTerminalAt` and never left
`working`. My wake condition was polling exactly those fields, so it would have waited indefinitely
on a gate that had already finished. The coordinator attached the session directly, observed the
completed final response, and told this lane not to wait on `firstTerminalAt`.

This is the inverse of D-7 and completes the pair. D-7 recorded a watcher that fired **early** on a
mis-parsed field; this records a watcher that would never fire **at all** because the transport
failed to write the field it was watching. Both have the same root cause: treating a session-state
field as the verdict signal. `agent-milestone-orchestrator`'s rule is "verify the artefact, never
the exit code", and job state is a species of exit code.

Standing consequence for this lane, generalising D-7's rule: **a gate is terminal when its artefact
is terminal** — a verdict token in a committed file, a pushed commit, and local == remote. Session
state, watcher exits, and `firstTerminalAt` are hints about when to *look*, never evidence of what
was found. When a wake condition is built on job state, pair it with an artefact check that can
succeed independently, and treat a long-running `working` state as a reason to inspect the branch
rather than as proof that work continues. D-12 already recorded that the absence of a job dir proves
nothing; this extends that to the presence of a job dir with stale contents.

Verification actually used here, none of it depending on job state: verdict commit `7780ba49e`
resolves and touches `plan-eval.md` alone; `git ls-remote` and local `HEAD` both return it; the tree
is clean; and the artefact carries the verdict token, the evaluated head, and a route match read
from `respawnFlags`.

## D-15 — opening the PR at S3 removed the per-slice comment trail (minor, orchestrator error)

**Date:** 2026-08-15. The #1293 IMPL-EVAL found PR #1662 carries zero per-slice comments, against
`run-loop.md:117`, which expects a per-slice PR comment trail. The evidence is complete by other
means — the PR body's slice list and the leaf `worklog.md` both carry it — so this is a form
deviation, not an evidence gap. It is still a rule this lane did not follow.

The cause is a sequencing choice I made as orchestrator, not anything the author did. I put PR
creation in **S3**, so when S1 and S2 completed there was no PR to comment on, and I never
instructed a backfill. The contrast with #1502 is instructive: there the draft PR existed from the
plan phase, and every slice and Tier-A verdict got its structured comment as a matter of course. The
same rule silently stopped applying here purely because the artefact it writes to did not exist yet.

**Fix for the next features leaf:** open the draft PR at the **first** slice, before any code
commit, so the commit trail has somewhere to live from the start. A leaf that defers PR creation to
its final slice cannot satisfy the per-slice comment rule no matter how disciplined the author is —
the requirement and the sequencing are coupled, and the coupling is the orchestrator's to get right.

## D-16 — `run-deno-fmt.ts` fail-closes on multi-batch runs even with a no-exclude config (minor)

**Date:** 2026-08-15. Formatting evidence for `packages/cli` cannot come from the root config, which
excludes `packages/cli/` under `fmt.exclude` by design. The documented workaround is an explicit
neutral same-style config — `packages/runtime-config/deno.json` (`useTabs: false`, `lineWidth: 100`,
`indentWidth: 2`, `semiColons: true`, `singleQuote: true`, **no exclude**).

Passing that config is **not sufficient on its own**. Measured at head `ee479ea85`:

| Invocation | Result |
| --- | --- |
| `--root packages/cli --ext ts,tsx --config packages/runtime-config/deno.json` (relative, default `--batch-size 200`) | 887 files, 5 batches, **4 failedBatches**, 0 findings — fail-closed |
| same with an **absolute** config path and `--batch-size 1000` | 887 files, **1 batch, 0 failedBatches, 0 findings** |

So two details are load-bearing together: the config path must be absolute, and the batch size must
exceed the file count so the run is a single batch. With the same config split across five batches,
four still fail-close.

The wrapper is behaving correctly in both cases — it refuses a false green when Deno drops files the
wrapper selected (`run-deno-fmt.ts:374` describes this as a non-finding failure class). What is
recorded here is that the documented neutral-config workaround silently does not work at default
batching, which reads as "the workaround failed" rather than "the batching is wrong".

**How to apply:** when gathering structured formatting evidence for a root the repo config excludes,
pass the neutral config by **absolute path** and set `--batch-size` above the selected file count,
then confirm `failedBatches: 0` before treating `findings: 0` as a verdict. A `findings: 0` with
non-zero `failedBatches` is not a pass — it is a refusal, and reporting it as a pass would be the
same overclaim this leaf corrected in its SDK doc-lint labelling.
