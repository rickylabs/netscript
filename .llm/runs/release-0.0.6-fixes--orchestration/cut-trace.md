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

### F-2 — do not wrap the slice launcher in a short `timeout` `[observed]`

**2026-08-12, wave 1.** Slice A's launcher was invoked under `timeout 300` and was killed at the
deadline (`exit code 143`, SIGTERM). The **Codex thread survived** — it lives in the app-server
daemon, not in the launcher process — and A continued working, writing
`.llm/tools/release/github-release_test.ts`.

So the kill was harmless to the slice but destroyed the launch log, and with it the launcher's own
record of the thread id; identity had to be recovered from `codex-status` instead. Wave 2 was
launched without a `timeout` wrapper.

The trap is that `exit 143` on the launcher **looks like a failed dispatch**. It is not. Judge
dispatch success by the attached thread, never by the launcher's exit code — the same
"verify the artefact, never the exit code" rule that caught three agents falsely claiming to have
stopped their AppHost in 0.0.4.

## Re-planning events

| # | When | Event | Effect on the plan |
| --- | --- | --- | --- |
| R-1 | 2026-08-12, wave 1 in flight | **Owner instruction to dispatch wave 2 immediately**, in the already-prepared worktrees, while wave 1 continues. | The two-wave dispatch schedule in `plan.md` collapses to a single four-slice fan-out. The wave *plan* is not rewritten — it records what was intended; this row records what happened. No clustering, ordering, or scope changed: the same four PRs, the same issue groups, the same #1397→#1399 internal order. |

R-1 notes: the hold being lifted was a **caution** hold (validate the brief format on wave 1 first),
not a dependency hold — wave 2 was already independent of wave 1 by construction, which is why
dispatching early is safe. The cost of lifting it is that a brief-format defect, if one exists, is
now paid four times instead of once. The benefit is wall-clock. Owner's call, taken as given.

Load check at the moment of the four-slice fan-out: 4 Codex slices from this lane plus 2 from
sibling 0.0.6 lanes and 3 idle `agy` sessions on the same host. Well below the ~160 load that froze
0.0.4's host, and the expensive `scaffold.runtime` gate remains serialised by brief instruction, so
the fan-out does not multiply the gate that actually contends.
