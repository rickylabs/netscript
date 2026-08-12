# Cut trace — 0.0.6 fixes lane

The instrumented merge record, captured **during the run from `git log origin/main`**, never
reconstructed from recollection. This lane declares no canary points and performs no cut (root owns
both); the trace exists so root can compute canary payload from merge history and so the next
milestone's rules are earned from evidence rather than memory.

## Merges

| # | Time (UTC) | Commit on `main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| _(none yet)_ | | | | | |

Baseline at run open: `origin/main@01aa12b67e36b643e1ca4f94421ecba07e030db5`
(`docs(harness): record FILING-LOG -- board migration executed once (#1523)`).

Rows are appended **only from live first-parent history** after a merge is observed, not when a
merge is requested. "Is it merged" uses **PR state, never commit ancestry** — under squash-merge a
merged commit is never an ancestor of the branch head, which is the defect that made 0.0.4's
`origin/main..HEAD` check unfireable.

## Re-planning events

| # | When | Event | Effect on the plan |
| --- | --- | --- | --- |

## Time-costing failures

| # | When | Failure | Cost | Rule earned / confirmed |
| --- | --- | --- | --- | --- |
| _(none yet)_ | | | | |

## Rules this run tests

Recorded at open so the run can falsify them rather than quietly patch over them. Each is
`[asserted]` until this lane's evidence moves it.

1. **Clustering two same-file release fixes into one PR costs less than the rebase it avoids**
   `[asserted]` — PR A clusters #1438 + #1430 in `github-release.ts`. Falsified if the focused
   IMPL-EVAL on #1438 is degraded by #1430 sharing the diff.
2. **The owner's E2E-guard IMPL-EVAL waiver is safe when negative tests are strong** `[asserted]` —
   PR C and D apply it conditionally. Falsified if a post-merge defect in either lands that a
   Fable 5 IMPL-EVAL would plausibly have caught.
3. **A fix whose issue carries no acceptance checkboxes is adequately close-gated by PR-body
   checklist + decisive-claim re-verification** `[asserted]` — #1438, #1430, #1428 have no boxes.
   Falsified if close-gate reports green on a PR whose stated acceptance was not actually met.

## Supervision findings (during the run)

### F-1 — a bounded "recent agents" list is not a liveness signal `[observed]`

**2026-08-12, wave 1.** `agentic:codex-status` reports `agents: 8 recent`. Slice B
(`019ff4f0-5c24-…`, `ns006-f-b-dryrun`) appeared as `working` shortly after launch, then **vanished
from the list entirely** while five unrelated sessions from sibling 0.0.6 lanes
(`ns006-1405`, `ns006-gatetrust`) and three `agy` sessions occupied it. B's worktree was
simultaneously clean at baseline with zero file writes — which reads exactly like a dead slice.

It was alive. Proof came from the artifact, not the list:

```
rollout-2026-08-12T09-47-00-019ff4f0-5c24-…jsonl   size=732292  mtime=09:51:11 (+0200)
rollout-2026-08-12T09-46-06-019ff4ef-8644-…jsonl   size=660785  mtime=09:51:31 (+0200)
                                                    now=09:51:56
```

Both rollouts were growing, B's within 45 seconds of the check. B had simply been **evicted from a
bounded list** by newer sessions on a shared host.

This **confirms** the `agent-milestone-orchestrator` rule "liveness is not progress, and artifacts
are not always where you launched" — and extends it in the inverse direction: *absence* from a
status list is not evidence of death any more than an open socket is evidence of life. On a host
shared with sibling lanes, the recent-list is a display, not a census. Verify a growing rollout, a
new commit, or a file write.

Cost avoided: had this been read as a dead slice, the correct-looking response was to relaunch —
which would have put **two senders on one worktree**, the exact condition the one-sender rule
exists to prevent.

### F-2 — wrapping the slice launcher in a `timeout` KILLS THE TURN `[observed]`

**Recorded 2026-08-12 wave 1; CORRECTED 2026-08-12 10:08 after the evidence contradicted the first
reading. The original text is superseded, not deleted, because the mistake is the finding.**

**First (wrong) reading.** Slices A and B were launched under `timeout 300`; both launchers were
SIGTERM'd at the deadline (`exit code 143`). Immediately afterwards `codex-status` still showed A
`working` and writing `github-release_test.ts`, so this was recorded as "the launcher dies, the
thread survives in the daemon — judge dispatch by the thread, never the launcher exit code."

**What the evidence actually shows.** Sixteen minutes later, A and B had both gone silent while C
and D — launched *without* a `timeout` wrapper — were still writing. Correlating the last rollout
write against each launcher's SIGTERM deadline:

```
A  launcher started 09:46:06  + timeout 300  = 09:51:06     last rollout write 09:51:31  (+25s)
B  launcher started 09:47:00  + timeout 300  = 09:52:00     last rollout write 09:52:27  (+27s)
C  launcher started 09:52:13  no timeout                    still writing at 10:07:41
D  launcher started 09:52:15  no timeout                    still writing at 10:07:41
```

Both turns died ~25 seconds after their launcher was killed. Neither rollout ends in a
`task_complete`; A's simply stops mid-turn after a successful `patch_apply_end`, followed by a
final `token_count`. The launcher is the **message sender holding the turn**, not a detachable
wrapper. Killing it kills the turn.

The brief survival window is exactly what made the first reading plausible: for ~25 seconds after
the SIGTERM the thread still reports `working` and still emits artifacts, so a status check taken
in that window shows a healthy slice that is already dead.

**Rule.** Never wrap `agentic:launch-codex-slice` in `timeout`, and never SIGTERM it. If a launch
must be bounded, bound it by watching the thread, not by killing the sender.

**Corollary — this refines F-1 rather than contradicting it.** F-1 says absence from the bounded
status list is not evidence of death. That stands: B was alive when it vanished from the list. But
liveness needs a *positive* artifact signal, and the signal must be **fresh**. A rollout that has
not grown in 16 minutes while sibling slices write every few seconds is a dead turn, and the
correct diagnostic is the **age** of the last write, not its presence.

**Cost.** ~16 minutes of wall clock on two slices, both recovered by `agentic:codex-resume` on the
existing thread with their in-progress work intact (A: modified `github-release_test.ts`; B:
modified `publish-workspace.ts` plus a new `publish-workspace_test.ts`). Nothing was lost but time,
because the work was on disk in the worktree rather than only in the turn.

