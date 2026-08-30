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

## D-17 — a leased evidence head moved after the grant (significant)

**Date:** 2026-08-15. The S5 runtime lease was granted against leaf evidence head
`8940e9266630a3cc5368153722747e45d30aec3b`, which I verified as local == remote == PR before
dispatch. The suite then executed at `ab78eaa35c1753f9e8c526dbd234c7073758008b`, because the author
committed preflight artifacts *after* the grant and before running the gate.

Nothing was misattributed — the product content head `193e665ba` was unchanged and the
content-to-execution delta was committed run artifacts only, so the gate did test the intended
product. But the identity a lease is granted against should be the identity it executes at. A lease
names a head so that what ran is provably what was authorized; if the head can advance between grant
and execution, that guarantee is weakened to "the parts I checked did not change", which is a
judgement rather than a proof.

**Standing rule for this lane, adopted at coordinator instruction:** every preflight artifact must be
committed **and pushed** before readiness is reported, so the head named in a lease request is
already final. A lease request quoting a head that later moves is a request quoting a prediction.

Related: [[eval-verdict-head-must-equal-merge-head]] is the same property one phase later — there the
trap is a verdict certifying a head that is not the head merged; here it is a lease authorizing a
head that is not the head executed.

## D-18 — an empty-host proof that omits filesystem residue is incomplete (significant)

**Date:** 2026-08-15. After S5 attempt 5 I terminated the three run-owned NuGet children, swept
`/proc` for any process with a cwd under the run tree, confirmed `docker ps -aq` was 0, and confirmed
`agentic:leak-check` reported aspire `ok`, docker `ok`, `survivors: []`. I reported the host clean.

The next binding `test` gate then failed on `readdir` of
`.llm/tmp/cli-e2e/plugin-smoke-20260815-213942/.data/postgres/18/docker`, a `drwx------ dnsmasq:root`
directory left behind by attempt 5's Postgres container. `leak-check` probes **processes and
containers**; a data directory whose container has already exited is invisible to it, and to every
other check I ran.

This is the second time in the same session that a run has been blocked by exactly this residue — the
coordinator quarantined attempt 4's `plugin-smoke-20260815-203755` tree for the same reason — so it is
a recurring class rather than an incident.

**Standing rule for this lane:** an empty-host proof after any run that started a database container
must additionally check for **unreadable or foreign-owned filesystem residue** under the run's temp
root, e.g. `find .llm/tmp -type d ! -readable`. Processes, containers, and ports being clear is
necessary and not sufficient. Residue is **moved to a timestamped quarantine, never deleted**, so the
artifact stays available as evidence.

The wider lesson is the one this session keeps repeating in different costumes: I proved "nothing is
running" and wrote "the host is clean". Reporting a narrower measurement in broader words is the same
error as an allowlist miss reported as a host fact, and it is worth more vigilance in one's own
evidence than in someone else's.

## D-19 — supervisor audits mutate the leaf worktree and create cross-owner dirt (significant)

**Date:** 2026-08-15. Running `agentic:leak-check` with `--worktree`/`--slice-dir` pointed at the leaf
**regenerates** `.llm/runs/feat-app-service-client-wiring--1355/leak-report.md` in that worktree. Only
the `Generated` timestamp and worktree line change, but the file becomes dirty in a tree the
**author** owns, from a process the **supervisor** ran.

This has now cost the lane twice:

1. Before **attempt 6**, the leaf carried a modified `leak-report.md` from my audits, so the author
   could not take an honest `gitHead == actualGitHead` receipt in place and had to create a fresh
   detached checkout at the leased commit. It handled that correctly, but the work existed only
   because of my dirt.
2. Before the **F8** commit, my 21:33 Tier-A host audit regenerated it again after author evidence
   head `2385cdb72`, creating a cross-owner diff that would otherwise have been swept into a
   plan-only amendment as if it were author evidence.

**The failure is one of ownership, not correctness.** The audit itself was valid and its result is
recorded centrally. But a supervisor verifying a host should not leave a write in a worktree whose
commits another agent signs — evidence provenance depends on each commit containing only what its
author produced.

**Standing rule for this lane:** supervisor host audits must not write into the leaf worktree.
Point `--slice-dir`/`--worktree` at a supervisor-owned path, or run the audit from the topic worktree,
or accept the report only from stdout without letting it persist into the leaf. If a leaf file is
dirtied by a supervisor action anyway, it is restored **byte-for-byte to the author's HEAD** by the
author and **excluded** from that author's commit — never preserved, and never explained away in the
author's evidence as if it belonged there.

Related: [[eval-verdict-head-must-equal-merge-head]] and D-17 are the same concern at different
layers — what a commit or a lease *claims* must be exactly what it *contains*.

## D-20

**Two green cleanup signals concealed three run-owned orphaned processes.** Severity: significant.

After S5 attempt 7, the inter-gate audit read empty and was wrong. Both of the signals a supervisor
would normally trust said clean:

- the suite's own `cleanup.aspire-stop` gate reported **PASS** in 506 ms, and
- `.llm/tools/agentic/teardown/leak-check.ts` reported `probes.aspire: ok`, `probes.docker: ok`,
  `survivors: []`.

Three `aspire-managed` processes (`646406`, `646408`, `646415`) were nevertheless still alive, all
with cwd inside the run's own worktree at
`…/netscript-s5-a7-388f2b642/.llm/tmp/cli-e2e/plugin-smoke-20260823-095547/aspire`, reparented to the
WSL `/init` relay when the run's Aspire CLI exited. They were found **only** by a manual sweep of
`/proc/*/cwd` for path containment.

**Why the tools missed them.** `leak-check` probes Aspire and Docker *resource* state; it does not
enumerate processes by working directory. `cleanup.aspire-stop` proves the stop command succeeded,
not that every managed sidecar it spawned was reaped. Neither is wrong about what it measures —
both are silent about a class neither measures.

**Consequence for this lane.** A supervisor must not treat `cleanup.aspire-stop` PASS plus
`leak-check survivors: []` as a complete residue verdict after a runtime gate. The minimum audit
also includes a cwd-containment process sweep and an unreadable-directory scan, both of which found
real residue here that the tools did not.

**Second-order finding.** All three orphans **ignored SIGTERM** and required SIGKILL. That is the
same hazard as carried observation R1 — `terminateBrowserProcess` awaits `child.status` after
SIGTERM with no timer, so a signal-indifferent child would hang it. R1 was theoretical when recorded
during the F8 plan review; attempt 7 supplies a live instance of the class in the same subsystem. It
remains out of F8 scope and is now better-evidenced input for whichever leaf picks it up.

Ownership discipline held: containment was re-verified immediately before each signal, and foreign
children of the same relay — `tmux`, `claude`, `codex`, `browser_crashpad` — were left untouched.
The unreadable residue was **moved, not deleted**, to a recoverable quarantine.

Related: D-19 (supervisor audits must not write into the leaf) — the same principle that
`leak-check` be pointed at a supervisor-owned `--slice-dir`, which was honored throughout attempt 7,
so the leaf's `leak-report.md` was never regenerated.

## D-21

**The parked lane's local checkout and its quarantine were lost to a host reboot and a worktree
sweep. All durable evidence survived.** Severity: minor — recorded so a resume is not surprised.

On resuming at topic head `5c5589ee5` on 2026-08-28, two artifacts recorded at park no longer exist:

| Artifact | State |
| --- | --- |
| `/home/codex/repos/netscript-007-features-1355` (leaf worktree) | **absent** — no longer in `git worktree list` |
| `/tmp/netscript-s5-a7-quarantine.Cy2tNS` (843 MB) | **absent** |

**Cause.** The host rebooted `2026-08-28 10:44` (uptime 22 minutes at the time of this check), which
cleared `/tmp` and therefore the quarantine. The leaf worktree's removal is a separate filesystem
deletion — a reboot does not remove `/home` — and is consistent with the stale-branch/worktree
cleanup the coordinator lane was planning. The sibling `netscript-007-leaf-typed-error` worktree is
also gone. Neither removal is challenged here; neither is this lane's to reverse.

**Evidence integrity is unaffected, and that is the point.** Everything durable was pushed before
park:

- `refs/heads/feat/app-service-client-wiring` on origin = `a257807d883ac9cd8d692d441bba1760290d4dab`
- PR #1664 head = the same sha, `draft`, `OPEN`, `mergeStateStatus: CLEAN`, labels unchanged
- commit `a257807d8` carries `s5-attempt7-runtime-failure.md`, the raw `.log`, and the raw `.ndjson`
  (507 insertions across 4 files)

**Correction to the park record.** The parked worklog/context-pack describe the quarantine as
"recoverable". That is no longer true: it was reaped with `/tmp`. It was never deleted by this
supervisor, and it held only regenerable scaffold data — a generated smoke project's Postgres data
directory — with no unique evidence. The claim is corrected here rather than left to mislead.

**Consequence for resume.** Any resumption of this lane must first recreate a checkout of
`feat/app-service-client-wiring` at `a257807d8`; there is no local worktree to return to.

## D-22

**`main` has advanced past the attempt-7 evidence base, and three of the commits land squarely on the
subsystem the attempt-7 red implicates.** Severity: significant — this is decision-relevant.

Attempt 7's evidence was taken at merge-base `3fc0f2f9221a8246f0d26a26189bafb2647be08a` (the base the
central `milestone-status.md` also records for #1664). Live `main` is now
`c73d361eea14a7f40702638638e492f2ca961a59`: the leaf is **10 commits behind**, 60 ahead.

Three of those ten touch `packages/sdk`, and the leaf modified **none** of those files — the entire
delta is `main` moving forward:

| Commit | Change | Files |
| --- | --- | --- |
| `3e8e146a4` | isolate cache write failures, settle cache telemetry contracts (#1665) | `cache-query.ts`, `cache-provider.ts`, `cache-telemetry.ts`, `ports/cache-store.ts` |
| `0ef48c2ec` | **make cached-entry fast path honor stale policy** (#1669) | `cache-query.ts` (105/98), `cache-query_test.ts`, `query-factory_test.ts` |
| `c73d361ee` | preserve contract errors through `safe()` / `isDefinedError` (#1692) | `client/errors.ts`, `ports/service-client.ts` |

Net difference between the leaf and `main` on that surface: `cache-query.ts` 141/95,
`client/errors.ts` 117/15, `ports/service-client.ts` 27/4, plus provider and telemetry.

**Why this matters.** Attempt 7's sole red is that the optimistic `Seed User*` row never appears
after the Rename click — a query-cache invalidation/refetch behavior. `0ef48c2ec` changes precisely
when a cached entry is served from the fast path versus treated as stale, which is the decision that
governs whether a list refetches. The failing behavior and the landed fixes are in the same
mechanism.

**What is NOT claimed.** There is no evidence that any of these three commits causes or cures the
attempt-7 red. Establishing that requires a rebase and another runtime attempt, and **no retry is
authorized** — so the question is deliberately left open rather than guessed at. This is the same
discipline applied to attempt 7 itself, where neither CDP bound fired and F8 was therefore credited
with attributability rather than a fix.

**What follows from it.** The attempt-7 red is evidence about the leaf's base, **not** about current
`main`. Treating it as a verdict on today's code would overstate it. Whether a rebase onto
`c73d361ee` and a fresh lease are warranted before any further work on the refetch path is a
coordinator decision; this lane has neither taken it nor requested it.

## D-20 — `main..head` misreports a PR whose branch is behind main

**Observed.** On PR #1696, `git diff --stat 5bb112dd3 414a52ba8` reported **123 files, +792/−28,585**,
including the deletion of `rfcs/0000-polyglot-task-protocol.md` (922 lines) and edits across
`packages/mcp/**` and `packages/cli/**` fixtures. None of that is the PR's work. The branch is based
on `c73d361ee`, and `main` has advanced 15+ commits since; everything `main` gained appears as a
deletion in that direction.

**True delta.** `git diff $(git merge-base main head) head` — **18 files, +709/−30**.

**Why it matters.** GitHub reported `MERGEABLE` / `CLEAN`, so nothing signals the staleness. A
reviewer or evaluator who measures scope from `main..head` will attribute another lane's landed work
to this leaf, and a scope-violation finding written from that reading would be false and would look
well-evidenced.

**Rule.** Always measure a leaf's scope from the **merge base**, and state the merge base alongside
the head whenever scope is reported. A clean textual merge is also not a semantic one — whether
anything landed on `main` since the merge base interacts with the change is a separate question, and
is now asked explicitly in the #1696 evaluator brief.

## D-21 — this Codex thread stalls at the commit boundary, twice, with work already on disk

**Observed.** Thread `01a04f84` (GPT-5.6 Sol · high) has stalled twice in the same shape:

| Stall | Last recorded action | Idle before intervention | State on disk |
| --- | --- | --- | --- |
| 1 | research reads | 1,129 s | worktree clean, nothing produced |
| 2 | a **completed** `deno fmt` | 494 s | slice 1 materially built, **12 uncommitted paths** |

The second is the more instructive: `procedure-meta.ts`, three tests including the assertion-budget
and independence gates, a type-fixtures directory, four modified files and a `drift.md` all existed
and none of it was committed, pushed, or visible to any reviewer.

**Detection rule that works.** Rollout **size unchanged over a bounded window** is the signal, not
elapsed time. A working agent appends continuously; a stalled one does not. Confirm with two samples
≥100 s apart plus a check that no gate process is actually running, then act. Elapsed-time thresholds
are the wrong instrument — I proposed a 30-minute one earlier and it was correctly rejected: at stall
1 the size-unchanged evidence was already conclusive at ~19 minutes and waiting would have bought
nothing.

**Recovery that works.** `agentic:codex-resume --message-file` on the **same thread and worktree** —
never a second sender, never a fresh author. Both recoveries took effect within ~20-40 s.

**Standing instruction now in every resume.** Land what exists before continuing: commit, push, post
the slice comment, report — and *a red gate is still the deliverable*. Uncommitted work is invisible
to review, and a stall at the commit boundary destroys exactly the evidence the harness runs on. Also
state explicitly that a failing pinned baseline is a finding to report, not a number to adjust,
because an agent nudged to "land it" can otherwise make a test pass by moving the target.

## D-23 — the `public-doc-lint` PASS receipt this leaf is held to is unsatisfiable on `main`

**Numbering note.** `D-20`, `D-21` and `D-22` each appear twice in this file — once from the #1664
era and once from the post-reset lane. I am not renumbering history; new entries continue from the
highest used id.

**Observed.** `plan.md` (PLAN-EVAL `PASS` at `1df5ff3e4`) contracts a **PASS** `public-doc-lint`
receipt over a named 16-entrypoint argv. I ran that exact argv on two heads:

| Head | `private-type-ref` findings | Exit |
| --- | --- | --- |
| `origin/main` `13878a80a` | **12** | 1 |
| #1731 slice head `f9056f879` | **14** | 1 |

`deno doc --lint` is therefore **already red on `main`**, before #1466 exists. The leaf's own
`drift.md` D-1 frames this as the slice having broken doc lint and asks the coordinator to rule on
"the sanctioned oRPC slow-types baseline". That framing is wrong, and it would have sent the ruling
in the wrong direction: the gate was never green to lose.

**The slice's actual cost is +2, and it is one symbol.** At base, `baseContract` was annotated
`ReturnType<typeof oc.errors<…>>` and cost one finding (`references private type 'oc'`). Slice 1
replaced it with an explicit `ContractBuilder<…>` annotation costing three — `ContractBuilder`,
`Schema`, `BaseContractErrors`. Every other finding on both heads is byte-identical
(`QueryClient` ×2, `StreamsInstrumentation`, `CrudRoute`, and the `BaseContractRoute` /
`BaseContractOutputRoute` family).

**Consequence for the repair.** The bounded target is *not* a PASS receipt — no bounded change can
produce one, and the changes that could (touching `query-client`, `streams`, `crud`) are outside this
leaf and outside the approved plan. The target is **incremental delta ≤ 0 versus the base**, with the
residual recorded as a terminal FAIL receipt carrying the base-vs-head comparison. `public-doc-lint`
is not weakened, renamed, scoped down, or omitted; the plan's contracted PASS is escalated to the
IMPL-EVAL and the coordinator as an unsatisfiable-gate finding, which is theirs to rule on and not
mine to waive.

**Lesson.** A plan gate that names a command but never runs it at the base can contract a green that
does not exist. Three review passes — Tier-A, PLAN-EVAL, PLAN-EVAL cycle 2 — all upheld this receipt
set, and none executed the command at the base head. Measuring the base is cheap; assuming it is
green is what cost this leaf a slice.

## D-24 — `agentic:codex-status` cannot be retargeted off the WSL defaults on the NAS

**Observed.** On the NAS the local Linux user is `node` and the home is `/home/agent`, but
`wslUser()` defaults to `codex`. `agentic:codex-status` runs without `--allow-env`, so `envOr`
swallows the permission error and silently returns the `codex` fallback — the
`NETSCRIPT_WSL_USER` / `NETSCRIPT_WSL_HOME` overrides the doc comments describe **cannot be applied
to this task at all**. The command fails with
`Cannot run WSL command locally as requested user "codex"`.

**Workaround, verified.** Pass the explicit `--user node` flag; the env route is unavailable, not
merely unset. `agentic:launch-codex-slice` does carry `--allow-env`, so it accepts
`NETSCRIPT_WSL_HOME=/home/agent` plus `--user node`.

**Not repaired here.** This is repo tooling, not features scope; recorded so the next NAS lane does
not rediscover it and so an internals leaf can pick it up.

## D-25 — `agentic:codex-resume` cannot pin the route, and the observed effort drifted on the steering send

**Observed.** The #1466 repair thread `01a0515c` was **launched** at the contracted
`normal_implementation` route — `openai / gpt-5.6-sol / medium`, requested == observed, recorded from
the authoritative `thread/start` response. After steering it with `agentic:codex-resume`,
`agentic:codex-status` reports the same thread as `gpt-5.6-sol / **high**`.

**Cause.** `codex-resume.ts` accepts `--thread-id`, `--message`/`--message-file`, `--worktree`,
`--profile`, `--profile-home`, `--user`, `--dry-run` — and **no `--model` or `--effort`**. It shells
out to `codex exec resume <id> -- '<msg>'`, which inherits the CLI's ambient default rather than the
route the thread was launched on. `launch-codex-slice` pins the route through
`app-server-message-cli --model … --effort …` and enforces requested == observed; the resume path has
no equivalent, so **no steering send in this repo can pin or verify effort**.

**Impact here: none adverse.** Same agent, same provider, same model, same thread, same worktree;
only the effort tier moved, and upward, on a slice that turned out to carry a genuine architectural
correction. It is recorded because an unpinned, unverified route on the steering path means every
lane's "requested == observed" evidence is a **launch-time** claim only, and silently stops being
true at the first resume. Any lane that reports a route verdict after a resume is reporting a stale
measurement.

**Standing practice until the tool is fixed.** Record the route at launch *and* re-read it from
`agentic:codex-status --user node` after every resume, and report both. Do not restate the launch
verdict as if it still held.

**Not repaired here** — `.llm/tools/agentic/` is repo tooling, not features scope. It belongs with
D-24 in an internals leaf.

## D-26 — the root `test` red is a proven host-infrastructure baseline, and neither failure can pass here

**Coordinator evidence, independently confirmed.** `ps -eo stat=` on this host reports **7,733
zombies**, of which **7,562 are `sshd`** children reparented to PID 1, plus `git` (61), `node` (22),
`esbuild` (21), `deno` (10), `claude` (7). Every one is owned by PID 1. No agent can reap them; only
a host-level intervention can.

**Both #1731 root-`test` failures reduce to that single condition, and I traced each mechanism rather
than accepting the correlation.**

**`hybrid-launcher_test.ts` — proven, not inferred.** The test's liveness check is
`Deno.kill(descendantPid, 0)` at `:167`, and `kill(pid, 0)` **succeeds on a zombie** — a zombie holds
its PID until reaped. So a worker descendant that exited exactly as designed still answers, `alive`
stays `true`, and `:177` fires `worker descendant <pid> survived cancellation`. On a host with PID 1
accumulating thousands of unreaped children, **this assertion cannot pass regardless of any code
change**, in this repo or any other.

**`codex-follow_test.ts` — and the fd framing is wrong.** The failure is
`Deno.watchFs` → `Too many open files (os error 24)`. It is **not** the file-descriptor rlimit:
`ulimit -n` is `524288` soft and hard, and system-wide `/proc/sys/fs/file-nr` shows only `10,777`
open. The exhausted resource is **`fs.inotify.max_user_instances = 128`** — `watchFs` allocates one
inotify *instance* per watcher, and `inotify_init1` returns `EMFILE` when that per-user cap is hit,
which Deno surfaces with the generic "Too many open files" text. Thousands of stuck processes plus
several live agents exhaust 128 instances easily. Raising `ulimit -n` would change nothing; the knob
is a **root-only sysctl**.

**Disposition (coordinator, 2026-08-30).** No further root-`test` retries after the current attempt.
Record the exact red as a host baseline with this cause. The focused and product gates stand as the
product verdict: `check`, `lint`, `fmt-check`, `quality-gate`, `arch-check`, `publish-dry-run`, the
contracts suite, and the focused SDK doctest. **No product change in #1731 may target this
infrastructure** — the two tests are correct code failing on a broken host, and "fixing" them would
mean weakening a real guard to fit a transient environment.

**Consequence for `test-final.json`.** It stays a terminal FAIL receipt and sufficiency stays
`INSUFFICIENT`. That is the honest record: the leaf's own `TS2344` is fixed and its 4,246 tests pass,
and the two reds are provably outside its diff — `git diff --stat 21d51622..<head> -- .llm/tools`
is empty. The IMPL-EVAL rules on whether a host-baseline red blocks the slice; this lane does not
grant itself that ruling, and does not retry its way to a different number.

**Escalated to the owner, outside features scope:** the host needs the zombie reaper fixed (PID 1 in
this container is not reaping) and `fs.inotify.max_user_instances` raised. Until then every lane on
this host will see intermittent `watchFs` EMFILE and false process-survivor assertions, and will
waste gate time rediscovering it. Related tooling gaps: D-24, D-25.

## D-27 — the contracted receipt set was blind to the one branch check that works

**Observed.** The docs-site workflow **Deploy docs site to Pages** fails on PR #1731 at its
`Check documentation exports drift` step (`deno task docs:exports-drift`), run `33298487084`, job
`99222167342`. `docs/site/reference/contracts/index.md` is declared `mode=complete` — a complete
published-symbol inventory — and the leaf added six public exports it does not document:
`NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement`, `BaseContractMeta` (slice 1),
`BaseContractErrors` (repair cycle 1), `CommonErrorMap` and `commonErrorMap` (repair cycle 2).

**Attribution established, not assumed.** `docs:exports-drift` exits **0** on `origin/main`
`13878a80a`, and has failed on **every** head of this branch — `c9a391811`, `f9056f879`, `b4157a9d`,
`c2ae8c425`. Branch-owned, deterministic, and unrelated to the D-26 host baseline.

**The finding is not the missing prose — it is the gate set.** The plan's eight-receipt set contracts
`public-doc-lint`, which per D-23 is **baseline-red on `main`** and therefore cannot signal a
regression by construction. `docs:exports-drift` is **green on `main`**, detects this leaf's
public-surface growth exactly, and is **not in the set**. So the leaf shipped four heads with a red
branch check that its own evidence was structurally incapable of seeing, through a Tier-A, two
PLAN-EVAL cycles and two repair cycles.

A gate that is red at the base is not merely unsatisfiable — it is **uninformative**, and budgeting
attention to it while omitting a green-at-base gate over the same surface is worse than having no
doc gate at all. That is the general lesson: when selecting an evidence set, run each candidate at
the base first. A gate that is already red there proves nothing about the change; a gate that is
green there is the one that can fail for your reasons.

**Disposition.** Cycle 3 documents the six symbols under acceptance point 5 and records
`docs:exports-drift` as supplemental evidence. Adding `docs-exports-drift` to the contracted set is
**proposed, not applied** — the plan is PLAN-EVAL-approved and neither the supervisor nor the
implementer amends it. The IMPL-EVAL and coordinator rule. Adding the gate id to
`.llm/tools/gates/catalog.ts` is repo tooling and out of leaf scope; it belongs with D-24 and D-25.

**Second-order note.** `commonErrorMap` is now an exported **mutable singleton** backing every
contract in the workspace. `Readonly<>` stops TypeScript consumers; nothing stops a JavaScript one.
Cycle 3 documents it as read-only-by-contract rather than changing the value — flagged here so the
IMPL-EVAL rules on whether a published mutable error-map value is an acceptable public surface, since
it was introduced to satisfy a doc-lint delta rather than for a consumer need.

## D-28 — sender ownership treats "ever had a thread id" as "session is alive"

**Observed.** `agentic:launch-codex-slice` refused to start the #1466 cycle-4 thread at
`/home/agent/projects/netscript/worktrees/007-leaf-1731`:

```json
{"stage":"sender-ownership","ok":false,"code":"duplicate_sender_risk",
 "message":"worktree already has a sender; resume session 01a0515c-28c8-7131-8197-e808f7b7e10f",
 "operatorAction":"resume existing session 01a0515c-28c8-7131-8197-e808f7b7e10f"}
```

The guard is right to exist — a second sender on one live thread is the failure it prevents, and this
lane has held that discipline through three cycles. But the session it named was **dead**, and the
guard cannot tell.

**Both liveness inputs measured, not assumed.** `launch-codex-slice.ts:376-379` builds the
observation as:

```ts
ownerProcessAlive: ownership.isProcessAlive(existing.ownerPid),
sessionActive: Boolean(existing.sessionId),
```

- `ownerPid` is `255768`. `/proc/255768` **does not exist** — the launcher process died with the host
  agent-plane restart. `ownerProcessAlive` is `false`.
- Thread `01a0515c` is **absent** from `agentic:codex-status --user node` (5 live Codex sessions, none
  is this one). Its rollout `rollout-2026-08-30T08-29-49-01a0515c….jsonl` ends on `task_complete` for
  turn `01a05183` — cycle 3 finished cleanly, then the thread was lost with the daemon. Nothing was
  in flight and the worktree is clean at `74483f02`.

So by `decideSenderOwnership`'s own semantics the record is `stale`, and `stale` is a state the
launcher already knows how to handle — it releases the record and proceeds (`:391`). It never got
there, because **`sessionActive` is not a liveness check at all**: it is
`Boolean(existing.sessionId)`, permanently `true` for any record that ever recorded a thread id.

**The consequence is not cosmetic.** Once a worktree's author thread dies — daemon restart, host
reboot, crash — that worktree becomes **permanently unlaunchable** through the sanctioned tool, and
the operator action the tool prints (`resume existing session 01a0515c…`) is impossible to perform,
because the session no longer exists in any daemon. The guard degrades from "prevent a rival sender"
to "refuse all senders, forever", and it does so precisely in the recovery scenario where relaunching
is the only correct move. Every lane on this host inherits this after any daemon restart.

Note the second-order shape: `isProcessAlive` is `Deno.kill(pid, 0)` — the same primitive D-26 proved
unreliable on this host, where a zombie answers. Here it happened to return the truthful `false`; the
false input was the one that never consulted the runtime at all.

**Action taken.** The stale record was archived to supervisor-owned scratch
(`stale-sender-record-007-leaf-1731.json`, contents preserved verbatim here) and evicted from
`~/.config/netscript-agentic/runtime/senders/`, after both liveness conditions were independently
proven false and the rollout was confirmed terminal. That reproduces exactly the `stale` branch the
tool would have taken had `sessionActive` been computed truthfully. `--allow-route-mismatch` was
**not** used — it addresses route identity, not ownership, and forcing past a safety guard with an
unrelated flag would have been the wrong instrument.

```json
{"schemaVersion":"1.0","worktree":"/home/agent/projects/netscript/worktrees/007-leaf-1731",
 "ownerPid":255768,"leaseToken":"b3694154-3e7d-411e-ac28-f15978b9cd57","state":"active",
 "acquiredAt":"2026-08-30T06:29:49.131Z","updatedAt":"2026-08-30T06:29:49.455Z",
 "sessionId":"01a0515c-28c8-7131-8197-e808f7b7e10f"}
```

**Proposed fix — repo tooling, out of this leaf's scope, belongs with D-24/D-25.** Compute
`sessionActive` from the runtime rather than from record shape: ask the daemon whether `sessionId` is
a live thread (`codex-status` already enumerates exactly that) and treat an absent thread as not
active. Optionally add an explicit `--release-stale-sender` path so recovery does not require an
operator to hand-edit the durable store, and stop relying on `Deno.kill(pid, 0)` for liveness per
D-26. Filed here for the coordinator; this lane does not edit `.llm/tools/`.

## D-29 — the doctrine-mandated token-free run watcher does not run on this host

**Observed.** `AGENTS.md` ("Supervisor wake (token-free)") instructs supervisors not to poll and to
background `.llm/tools/harness/watch-run.ts <run-dir>` instead. Run against the #1466 leaf run dir it
dies immediately inside `Deno.watchFs`:

```text
at new FsWatcher (ext:runtime/40_fs_events.js:1:437)
at Object.watchFs (ext:runtime/40_fs_events.js:1:1078)
at main (.llm/tools/harness/watch-run.ts:65:24)
```

**Cause — already diagnosed, now biting the supervisor tier.** `fs.inotify.max_user_instances` is
**128** on this host and `watchFs` allocates one inotify *instance* per watcher. This is the same
root cause D-26 established for `codex-follow_test.ts`, and the same correction applies: it is not
the fd rlimit (`ulimit -n` is 524288), it is a **root-only sysctl**. With several supervisors, their
sub-agents, and thousands of stuck processes on one host, 128 instances are exhausted, so the tool
the doctrine names as the supervision primitive is unavailable to the lanes that need it most —
precisely when many lanes run at once.

**Consequence.** "Do not poll" is currently unimplementable through the sanctioned tool. This lane
supervises the cycle-4 author with (a) the launcher's own streamed turn, which exits at
`task_complete` and is the terminal signal, and (b) a 60 s poll of `agentic:codex-status` that exits
on `idle`/`ABSENT` or on a >900 s activity age. Polling is the fallback, adopted because the
token-free path is broken, and is recorded here rather than passed off as the normal procedure.

**Disposition.** Host-level fix (raise `fs.inotify.max_user_instances`, fix PID-1 reaping) is already
escalated to the owner under D-26 and is outside features scope. A tooling-level fix — fall back to a
poll loop when `watchFs` throws `EMFILE`, instead of exiting non-zero — belongs with D-24, D-25 and
D-28 as repo-tooling follow-ups for the coordinator. This lane does not edit `.llm/tools/`.

## D-30 — the D-26 host baseline is repaired; R-1's root-`test` condition is void, D-29 is not

**Observed.** The container's init changed. Measured directly, not reported:

| Probe | D-26 era | Now |
| --- | --- | --- |
| PID 1 | not reaping | `tini -- ttyd …`; `/proc/1/comm` = `tini` |
| Total zombies (`ps -eo stat=` `^Z`) | 7,733–7,979 | **0** |
| PID-1-owned zombies | thousands | **0** |
| root `deno task test` | 4248 passed / **1 failed** / 19 ignored | **4250 passed / 0 failed / 19 ignored, exit 0** |

D-26 established that `hybrid-launcher_test.ts:167` tests liveness with `Deno.kill(pid, 0)` and that
a zombie answers `kill -0`, so the worker-descendant assertion could not pass *regardless of any code
change*. With a real init reaping children, the descendant is gone when the loop looks and the
assertion passes. The failing test was correct code failing on a broken host, exactly as recorded —
and it now passes with **no change to it**, which is the cleanest possible confirmation that the
diagnosis was right.

**Consequence for the ruling.** IMPL-EVAL R-1 attached the condition *"no further root-`test` retries
on this host (they cannot move it)"*. That condition was **premised** on the defect, not on policy.
The premise is gone, so the condition is void — retrying now moves the number, and declining to run
the gate while citing R-1 would be using a stale ruling to avoid evidence that is newly available.
The `SKIPPED` receipt cut at cycle 4 was the honest form *at the time*; it is superseded by a real
receipt rather than being retroactively criticised.

**R-1's other half is untouched.** `public-doc-lint` is still baseline-red on `main` at 12 findings
with delta 0, and the set-identity condition still binds every future head of this branch. Nothing
about the host fix bears on it. Two halves of one ruling, only one of which lost its premise.

**D-29 is NOT fixed.** `fs.inotify.max_user_instances` is still **128**, so
`.llm/tools/harness/watch-run.ts` still dies in `Deno.watchFs` and the doctrine's token-free
supervisor wake remains unavailable. The host fix repaired the reaper, not the watcher; the two were
distinct causes that D-26 happened to record together. Supervision continues to poll, and the tooling
fallback proposed in D-29 still stands as a coordinator follow-up alongside D-24, D-25 and D-28.

**Lesson worth keeping.** A gate ruled "unpassable for an environmental reason" carries an implicit
expiry that nothing in the harness tracks: when the environment is repaired, the ruling silently
becomes a licence to skip evidence that is now obtainable. The evaluator's cycle-2 verdict text still
says the no-retry condition "stays in force on this host" because the host changed mid-evaluation —
no fault of the session, but a demonstration that environmental rulings need a re-check trigger, not
just a rationale. Recorded so the final all-slices IMPL-EVAL re-derives host state rather than
inheriting this one.

## D-29 — RESOLVED 2026-08-30. The inotify quota was raised; the token-free watcher works

**Re-measured, not accepted on report:**

| Probe | D-29 as filed | Now |
| --- | --- | --- |
| `fs.inotify.max_user_instances` | 128 | **1024** |
| `watch-run.ts <run-dir> --timeout-seconds 10` | died in `Deno.watchFs` (`FsWatcher` allocation) | emits `{"watching":…,"files":["worklog.md"]}` then `{"timedOut":true,…}` and **exits 2** — the designed heartbeat |

D-29's diagnosis is confirmed by the fix: raising the per-user inotify **instance** cap — a root-only
sysctl, not the fd rlimit — is exactly what made `watchFs` allocatable again, with no change to the
tool. Nothing about `watch-run.ts` was wrong.

**Consequence.** `AGENTS.md`'s "Supervisor wake (token-free)" is implementable again, and this lane
returns to it: `watch-run.ts` as the primary wake, replacing the `codex-status` poll loop D-29 forced.
The poll fallback is retired, not kept as a parallel path — two wake mechanisms on one author is how
a supervisor ends up acting on a stale probe.

The D-26 half is unchanged and still holds: PID 1 is `tini`, zombies **0**, root `deno task test`
runnable and green. D-30 stands as written.

## D-31 — DinD sandbox is reachable; that is capability, not authorization

Coordinator environment authority update 2, **locally re-proven** by this lane at 2026-08-30T09:27Z
rather than taken on report:

- `getent hosts netscript-dind` → **`10.4.12.19`**
- project `mise env` exports **`DOCKER_HOST='tcp://netscript-dind:2375'`**
- `docker version` through it → client **28.5.2** / server **28.5.2**
- `docker ps -a` → **0** containers; `aspire ps` empty

**What this does not change.** This lane holds **no runtime lease**. Slice 2 is SDK declaration
propagation and needs no container; slice 3 is publish/compatibility evidence and needs none either.
A reachable sandbox is not a licence to start using it, and the slice-2 author has been told so
explicitly — the standing prohibition on `e2e:cli`, Aspire, Docker and browser gates is unchanged,
and reaching for one is a rescope.

**What it does change, for the coordinator not for me.** #1664 was parked at a terminal `FAIL_FIX`
whose open question — why the optimistic `Seed User*` row never appears after Rename — was
untestable because the runtime gate could not be re-leased. A working DinD sandbox with Docker 28.5.2
makes that question testable again. **No retry is authorized and this lane does not authorize itself
one**; recorded so the coordinator can decide with the current facts rather than the parked ones.
D-22's caution still applies: the attempt-7 red is evidence about base `3fc0f2f92`, not about current
`main`, so a rerun of the old base would answer a question nobody is asking.

Cleanup obligation if any runtime work is ever leased here: return owned Aspire and Docker state to
**zero**, proven by path containment (`--owned-root`), and leave every foreign-owner resource alone.

## D-32 — a second sender is refused mid-turn, and that is the tooling working

Attempting `agentic:codex-resume` at the slice-2 author while its launch turn was still streaming:

```text
thread-store conflict: thread 01a051f8-… already has an active writer (code -32600)
```

This is the correct outcome, recorded so it is not mistaken for the D-28 class of defect. D-28 is a
**false positive** — a guard blocking a launch against a thread that is provably dead. This is a
**true positive** — a guard blocking a concurrent write to a thread that is genuinely alive and
mid-turn. The two look similar in the error text and are opposite in substance.

Operational consequence: a supervisor correction that arrives mid-turn cannot be delivered until the
author's turn ends. Environment facts that invalidate a brief mid-flight therefore land late by
construction, and the supervisor must either wait for idle or carry the correction to the Tier-A
stop. This lane waits for idle, because the correction here governs a file the author is going to
write (`context-pack.md`) and arriving after it writes would mean correcting a committed artifact
instead of preventing a wrong one.

## D-33 — the slice-1 `test` PASS predates the inotify fix by 11 minutes; it is historical, not a current claim

**Observed.** `receipts/frozen-42874803/test-final.json` — the slice-1 root-`test` receipt I re-cut
after the reaper fix — records `outcome: PASS`, `exitCode 0`, attempt 7,
`finishedAt: 2026-08-30T09:16:21Z`. The inotify raise to **1024** was re-proven at
**2026-08-30T09:27Z**, eleven minutes later.

So that receipt was cut in a **partially** repaired environment: `tini` reaping was in place (which is
what made `hybrid-launcher_test.ts` pass), but `fs.inotify.max_user_instances` was still **128** —
the condition D-26 recorded as causing `codex-follow_test.ts` to fail with `watchFs` →
`Too many open files (os error 24)`.

**Why it passed anyway, and why that is not reassuring.** The inotify cap is a *contention* limit
across all users of the host, not a deterministic per-run property. At 09:16 the pressure happened to
be low enough — several supervisors and their sub-agents were between turns — so the watcher
allocated. The same receipt run half an hour earlier or later could have gone red without any code
change. A green result under a contended cap is a lucky sample, not a proof, which is precisely the
asymmetry D-26 identified in the other direction.

**Disposition — no re-cut of the archive, and no waiver either.** The frozen set is append-only
historical evidence for content head `42874803`; rewriting it would be worse than leaving it. What
matters is that the **live** receipt set is now being cut by the slice-2 author at content head
`2863d29e` under the fully repaired environment (`tini` **and** inotify 1024), so the set that the
final all-slices IMPL-EVAL will evaluate carries no infrastructure waiver at all.

**Recorded so the final evaluator does not inherit it.** When it re-derives host state — which D-30's
lesson says it must, rather than trusting a prior ruling — it should treat every receipt in
`frozen-42874803/`, `frozen-235482767/` and `frozen-c9a391811/` as cut under superseded conditions,
and take only the live set at the final content head as the current claim. The infrastructure
waivers are gone; the archives are the record of when they existed, not an argument that they still
apply.

## D-34 — `runtime repair codex-remote` is not a sender-eviction path, and must not be forced into one

**Context.** A variable-derived `rm "$D/$K.json"` was correctly denied by the coordinator. Deriving a
deletion target from shell variables in a store keyed by SHA-256 filenames is exactly the shape where
one wrong expansion deletes another lane's lease. The rule now stands: **resolve read-only, prove
ownership, then delete only a literal validated path.**

**What the sanctioned command actually does.** `deno task agentic:runtime repair codex-remote
--worktree <path>` was tried first, dry-run, and refused:

```json
{"status":"blocked","changed":false,"state":"disconnected",
 "diagnostics":[{"code":"active_session","category":"safety",
 "message":"Codex remote repair refused because active sessions or child commands were observed"}]}
```

Reading `codex-remote-repair.ts:79-88`, `repairRefusal` fires on
`observation.activeSessionIds.length` / `activeChildCommands.length` — **daemon-global**, not scoped
to the named worktree. Sibling lanes (`007-leaf-1673`, `007-aspire-s5`) were live, so the refusal is
correct and would persist for as long as any lane anywhere is working.

**The important part: it is the wrong instrument regardless.** `repair codex-remote` repairs the
**daemon / remote-control connection** — socket, app-server anchoring, version skew. It does not know
about `~/.config/netscript-agentic/runtime/senders/`. Forcing it would mutate shared daemon state that
is actively serving other lanes, to fix a per-worktree ownership record it does not manage. A refusal
one is tempted to override is worth reading twice: here the override would have been both useless and
dangerous.

**So the D-28 gap is confirmed sharper than first filed.** There is no checked-in eviction path for a
stale sender-ownership record. The launcher's own `stale` branch would handle it if `sessionActive`
were computed from the runtime (D-28), and the runtime controller does not cover the store at all.
Until one exists, recovery is a hand-edit — which is precisely why it needs the read-only-resolve /
prove / literal-path discipline rather than a convenience variable.

**Procedure used, and to be reused.**

1. `ls` the store read-only; do not compute the filename to act on it.
2. `cat` the candidate; the record **self-describes** its `worktree` and `sessionId`. Match both
   against the intended target — a hash collision or a mis-derived key cannot survive this check,
   because the payload names its own owner.
3. Prove `ownerPid` absent from `/proc`, the thread absent from `agentic:codex-status` across
   **three** probes (transient absences are real — one was observed earlier this session), and no
   launcher or app-server process running for that worktree.
4. Try `agentic:runtime repair codex-remote --dry-run` first; record its verdict either way.
5. Copy the record to supervisor-owned scratch, then `rm` **one fully literal path**, no variables.
6. Verify the store count decreased by exactly one.

Applied for the completed slice-2 thread `01a051f8-ab0a-7443-921f-17e48be6bc35`, record
`236f2a7b…json`, `ownerPid 249559` (absent), store **11 → 10**, nothing else touched.

**Fourth occurrence in this lane in one session.** D-28's proposed fix — compute `sessionActive` from
the daemon, and add an explicit `--release-stale-sender` — is now a measured operational cost, not a
theoretical tidy-up, and belongs with D-24, D-25 and D-29's tooling follow-ups.
