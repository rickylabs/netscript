# Cut trace — 0.0.6 fixes lane

The instrumented merge record, captured **during the run from `git log origin/main`**, never
reconstructed from recollection. This lane declares no canary points and performs no cut (root owns
both); the trace exists so root can compute canary payload from merge history and so the next
milestone's rules are earned from evidence rather than memory.

## Merges

| # | Time (UTC) | Commit on `main` | PR | Issues closed | Pre-merge gate record |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-08-12 08:35:36Z | `69485b8fd` | #1535 | **#1428** (auto-closed COMPLETED 08:35:38Z) | 7/7 — see `worklog.md` stage D |
| 2 | 2026-08-12 08:36:22Z | `cd24e1679` | #1534 | **#1397, #1399** (both auto-closed COMPLETED) | 7/7 — see `worklog.md` stage D |
| 3 | 2026-08-12 08:57:53Z | `84dd44ae7` | #1538 | **#1417** (auto-closed COMPLETED) | 7/7 + focused IMPL-EVAL PASS (Fable 5 medium, separate session) |
| 4 | 2026-08-12 12:54:23Z | `3c9dc1f39` | #1539 | **#1438, #1430** (both auto-closed COMPLETED) | 7/7 + automatic IMPL-EVAL PASS, head-matched at `070eabb61`; runtime tiers recorded as did-not-run with reason |
| 5 | 2026-08-12 (wave 2) | `4637e9f41` | #1579 | **#1456** (auto-closed COMPLETED) | 7/7 + automatic IMPL-EVAL PASS head-matched `b80e56249`; zero non-green; negative control proven against a package whose live `latest` differs |
| 6 | 2026-08-12 (wave 2) | `efb5182f1` | #1578 | **#1460** (auto-closed COMPLETED) | 7/7 + automatic IMPL-EVAL PASS head-matched `fe2b3262d`; mirror ticked 5/5 issue boxes; zero non-green |
| 7 | 2026-08-12 (wave 2) | `7aa4aadfd` | #1573 | **#1540** (auto-closed COMPLETED) | 7/7 + automatic IMPL-EVAL PASS head-matched `7ba8d10c4`; mirror 4/4 issue boxes + PR-body DoD box ticked by body edit (head unchanged); executed SIGKILL interruption proof red→green |
| _(none yet)_ | | | | | |

Captured from `git log origin/main --first-parent` after each merge, never from recollection. Both
rows carry a closing keyword that auto-closed their issues, which is the `AGENTS.md` obligation that
stranded 40+ merged PRs when omitted — verified here by the issues' own `CLOSED/COMPLETED` state
rather than by the PR body's text.

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


## Canary checkpoint — v0.0.6-canary.2 (2026-08-12)

First intermediary canary under the owner's checkpoint authorization. This lane acted as
release-checkpoint coordinator; the cut was reported to the owner and authorized before dispatch.

| Field | Value |
| --- | --- |
| Tag | `v0.0.6-canary.2` |
| Tag commit | `89184c1bd200` (coordinated version-only bump) |
| **Content SHA** | **`e67c1ba1317e`** — the tag's parent, exactly the authorized `main` |
| Workflow | `release-canary.yml` run `31596869408`, dispatched `--ref main` |
| Pinned prod E2E | `e2e-cli-prod` run `31597418450` — **success** |
| `release/canary-pair` | **success** on `e67c1ba13` — "Canary 0.0.6-canary.2 publish + pinned production E2E passed" |
| Package completeness | **35 / 35** publishable members present at `0.0.6-canary.2`, zero missing |
| Excluded | #1539 (unmerged at cut time), per owner instruction |

**Publication route.** Dispatched through the checked-in workflow via OIDC. **No local publish and
no hand-run publish script** — `netscript-release` prohibits ad-hoc publication, and the JSR budget
gate (step 4) ran inside the workflow with a token this orchestrator deliberately does not hold.

**Pre-cut evidence, executed at the validated SHA:**

```
clean tree                0 dirty files
publish:readiness         EXIT 0 — all 8 gates PASS (35 effective members matched)
release:preflight         text-imports · import-attributes · file-url-import-meta · self-imports  ALL PASS
publish:dry-run           EXIT 0, tree clean after, deno.lock unchanged
current-main SHA check    0 commits advanced between authorization and dispatch
```

**Step 14 skipped** (`Detect exact-version registry outcome after publish failure`) — no
partial-publish path was entered, which is the distinction the beta.10 incident made load-bearing.

**Why this checkpoint was meaningful rather than arbitrary** — the reason came from the internals
lane and was verified here: `code-quality-repo` on `main` was RED for **nine consecutive pushes**
(back through `84dd44ae7`, which was this lane's own #1538 merge) and went green at `e67c1ba13`.
A canary cut during that streak would have shipped repo-wide quality evidence that was *unreadable*
rather than failing — red for a fixture-scanning defect, not a payload defect. Verified
independently: `quality:scan:repo` at merged main → `ok:true, findings:[], allowCount:8, EXIT 0`.

**Stated limitation carried into the payload note.** The shipped `@netscript/mcp` agent-docs corpus
is a 0.0.5-era snapshot (provenance `version 0.0.5`, `sourceCommit eda49bb2e`, extracted
2026-08-09) carrying **60 `api-clients` references across 11 files** that `docs/site` no longer
contains — verified by this lane at the docs lane's prompting. That is the state `main` has held
since 2026-08-09, so it is a continuation rather than a regression, and the docs lane's #1531 is the
merge that closes it. The next checkpoint after #1531 is the first whose shipped corpus and
documentation site agree.

**Cut property stated in advance, and it held.** Because #1539 was unmerged, `isVersionOnlyReleaseDiff`
could not authorize inheritance, so the pair had to be proven directly rather than inherited — which
is exactly what the workflow did by writing the pair on the pre-bump content SHA. 0.0.5 paid an
extra canary cycle for discovering this at publish time; here it was predicted before dispatch.

### F-3 — I killed watchers by host-wide string match, which is the anti-pattern I was warned about `[observed]`

**2026-08-12, wave 2.** I armed four turn-watchers inside a single command using `&` and redirected
their output to `/dev/null`. Both halves were wrong:

- backgrounding with `&` inside one Bash call means the watchers are not tracked per-command, so no
  task notification fires;
- `>/dev/null` discards the very output that would have carried the wake signal.

They ran. They would have exited silently. **A watcher that cannot wake you is worse than no
watcher, because it looks like coverage** — the same shape as every false-green in this milestone,
now in my own supervision plumbing.

**The cleanup was worse than the mistake.** I cleared them with:

```
pkill -f "codex-watch"
```

That is a **host-wide string match**. It does not distinguish my watchers from any other lane's, and
five lanes are active on this host. `agent-milestone-orchestrator` states the rule directly —
*never establish ownership by string match* — with the inverse example of a liveness check matching
worktree paths quoted inside other agents' brief text. I ran the same class of command against a
shared host without checking ownership first.

**Blast radius, established rather than assumed:** a `codex-watch` is a **read-only observer**. All
four of my slices continued writing across the kill (`last_write` 0–13s afterwards) and the daemon
stayed healthy at `app-server-procs=3`. Any other lane's watcher I killed likewise cost them a wake
signal, not a thread, a worktree, or any work. Nothing was destroyed; some lane may simply not be
woken by a watcher it thought it had — which is precisely the failure I had just created for myself,
propagated to a neighbour.

**Rules earned:**

1. Arm one watcher per tracked background command, never `&`-fanned inside one call, and never with
   output discarded.
2. To stop a watcher, target it by **PID captured at launch**, never by `pkill -f` on a shared host.
   If ownership cannot be proven, leave it alone — the same rule the resource-hygiene tooling
   applies to containers and worktrees.

Reported to the peer lanes rather than left for them to discover a dead watcher.

### F-4 — `gh pr checks` renders `cancelled` as `fail`, and a red check can mean nothing ran `[observed]`

PR #1603 showed four red checks. None were code defects:

| Check | `gh pr checks` | Actual | Cause |
| --- | --- | --- | --- |
| `close-gate` | fail | failure | `Setup Deno` — GitHub-release CDN `socket hang up` |
| `surface-diff` | fail | failure | same, twice through the action's own backoff |
| `scaffold-runtime` | fail | **cancelled** | zero steps executed |
| `scaffold-runtime-sqlite` | fail | **cancelled** | zero steps executed |

Two lessons, both about not reading a verdict as a judgement:

1. **`cancelled` is presented identically to `fail`.** The scaffold tiers had an empty `steps` array —
   they never evaluated the change at all. Only `gh api .../jobs --jq '.conclusion'` distinguishes
   them. Steering on the rendered column alone would have sent a slice to debug a scaffold failure
   that did not exist.
2. **Confirm external before retrying.** `fix/1549` and `fix/1576` were failing in the same window
   on the same step, which is what makes this an incident rather than a property of #1603. The test
   is other branches, not intuition — and it costs one API call.

Retry is the correct response, but not immediately: the second `surface-diff` attempt failed the
same way ~8 minutes later, so back-to-back retries just consume rounds. `scaffold-static` passed at
1m42s **during** the outage, so it is partial, not total.

**Release relevance:** a canary cut during this window would fail its own `Setup Deno` and read as a
publish defect. Check this before blaming the payload.

### F-5 — I steered from a truncated listing, having been warned about exactly that `[observed]`

I ran `ls -la <slice-dir> | tail -5`, saw only `implement/plan/research/supervisor/worklog`, and
concluded W3-J had cited a nonexistent `evidence.md` in both its worklog and PR body — a fabricated
citation on a release-critical p0. I drafted a blocking correction accusing it of that.

`evidence.md` existed the whole time. `ls` sorts alphabetically and `evidence.md` sorts **before**
`implement.md`, so `tail -5` cut off precisely the file I was looking for. A concurrent repo-wide
`find` returned the true answer and contradicted me before I sent the correction.

This is `agent-milestone-orchestrator` § Supervision pitfalls — *never steer or merge from a
truncated log* — committed by the orchestrator that had the rule loaded. The pitfall is not about
`head -14` specifically; **any** lossy view can invert a verdict. When testing whether a thing
exists, `ls -la <dir>/<file>` or `test -f` answers the question asked; a truncated directory listing
answers a different one.

Cost: near-zero, because the artifact check landed before the correction was sent. Had it gone out,
a correct slice would have been sent to re-derive evidence it had already produced, and the
accusation would have been in its thread permanently.

### F-6 — the #1594 defect reproduced live, twice, on this milestone's own PRs `[observed]`

Two independent recursive self-triggers were observed on PR #1603 while evaluating it, both from the
`issue_comment` event, both from workflow-authored comments rather than human ones:

| Duplicate run | Created | Jobs | Outcome | Spend |
| --- | --- | --- | --- | --- |
| `31624029906` | 2026-08-12T17:43:12Z, 18s after the trigger comment | **0** | cancelled at run level | none |
| `31625413947` | 2026-08-12T17:59:52Z, 17s after generation `29356827659` began | **0** | cancelled by the owner before the agent job started | none |

The second is the sharper reproduction: the intentional run `31625391423` posted its **Running
summary**, and that summary comment itself spawned a second run. The production trigger tests the
comment body with an unanchored `contains()`, so a status comment that merely *quotes* the invocation
token re-enters the workflow. This is exactly acceptance box 3 of #1594 — *workflow-authored
acknowledgement/summary bodies must not recursively dispatch*.

**Why "no spend" is not reassurance.** Neither duplicate billed anything, but in both cases that was
luck or human reflex, not a refusal: run-level cancellation landed before the `agent` job started,
and the second was cancelled manually by the owner. Had either duplicate's `agent` job started
first, it would have billed. This is precisely why #1594 § invariant 2 rejects a `concurrency:`
block as a fix — `cancel-in-progress` stops a job that has *already begun paying*. The refusal has
to happen at the claim, before the trigger comment.

**Evidence quality note.** A cancelled run showing `conclusion=cancelled` with `total_jobs=0` is the
signature of "prevented before spend"; a duplicate that reached `total_jobs>=1` with a started
`agent` job would be a realised double-spend. Check `total_jobs`, not the conclusion string — the
two read identically in `gh pr checks` (see F-4).

Forwarded to the W3-I writer for inclusion in #1599's committed evidence, since this is live
production confirmation of the defect that PR fixes.

### F-7 — I nearly duplicated another lane's active work by reasoning from an unassigned issue `[observed]`

The docs lane reported `main` red on the published-JSDoc codename guard (bare `#1589` in
`packages/cli/.../netscript-web-runtime-closure.ts:6`) and filed **#1612** rather than absorbing the
fix — correct, since hiding a red main inside a docs PR would have concealed it going into a cut.

I verified the defect independently (the line is present on `origin/main@6aee2b414`), then reasoned:
p1, milestone 0.0.6, `packages/cli`, **assignees: none**, blocks the stable cut I coordinate,
therefore mine. I wrote a slice brief and launched a Codex leaf against a reused worktree.

**Internals already owned it**, with an active canonical leaf at `/home/codex/repos/ns006-jsdoc` on
`fix/1612-published-jsdoc-codename`.

What limited the damage was luck, not judgement: the launcher rejected my invocation
(`Unknown argument: --launch-arg`, exit 2) before any session started. Had the flag form been right,
two agents would have edited the same file on two branches, and the second PR would have surfaced as
a conflict or a redundant merge on a release-critical path.

**The rule this establishes.** An unassigned issue is not an unowned issue. Assignment is a
*lagging* signal — a lane that has already cut a worktree and launched a leaf has not necessarily
touched the GitHub assignee field. Before claiming cross-lane work, check for a live worktree and
branch (`git branch --list '*<issue>*'` shows a `+` prefix when a branch is checked out in another
worktree — that prefix is the tell), and announce the claim to the owning lane before launching.

Cleanup performed and verified: launch process absent, no remote branch, no PR, local duplicate
branch `fix/1612-jsdoc-codename` deleted, brief directory removed, internals' branch untouched.

### F-8 — CORRECTION: F-6 was wrong. The "live reproductions" were not reproductions `[observed]`

F-6 recorded three duplicate runs as live reproductions of #1594's double-spend, and that record was
forwarded into PR #1599's **committed** evidence. It is wrong, and the error is mine.

**What I checked, and what it shows.** The comment that created each duplicate run is a
workflow-authored status summary. Its body:

```
<!-- openhands-agent-summary -->
<!-- openhands-run: {"run_id":31630430298,"attempt":1,"conclusion":"running"} -->
## OpenHands Agent — Running
…
```

It contains **zero** occurrences of the `@`-prefixed invocation token — only
`openhands-agent-summary`, which has no `@`. Verified on all three pairs
(`gh api .../comments --jq '.body|test("@openhands-agent")'` → `false` for every summary).

So the pre-fix `contains(comment.body, '@openhands-agent')` predicate would **not** have matched, the
`authorize`/`agent` job would have been skipped, and no spend was possible. The duplicate runs are
the ordinary GitHub behaviour that **every** `issue_comment` creates a workflow run whose jobs then
skip on the `if:` condition — which is exactly why every other agent run in the same listings shows
`skipped`.

| Claim in F-6 / committed evidence | Reality |
| --- | --- |
| "the summary comment spawned a duplicate via the unanchored substring test" | The summary does not contain the token; the predicate never matched |
| "Either duplicate could have billed if the agent job had started first" | The job would have been **skipped**, not billed |
| "production red-before evidence for acceptance box 3" | It is not production evidence of anything; box 3 rests on its unit test, which the evaluator verified independently |
| Cancellation "prevented" the spend | Cancellation was unnecessary; the runs were inert |

**What remains true and unaffected:**

- The **original** incident is real: `31615108125` and `31615110254`, one second apart, **1 job
  each** — both reached a job. That is the genuine claim race #1594 was filed for.
- The unanchored `contains()` is a real weakness: a comment that genuinely *does* contain the token —
  a human quoting it in prose, or fallback provenance quoting the original command — would dispatch.
  That is acceptance boxes 1 and 2, and those tests are real.
- The fix at `4989d0d7b` is correct and still needed. Executed against the real summary body, the new
  predicate returns `command-not-first-token` for OWNER/MEMBER/COLLABORATOR, while a genuine trigger
  still returns `authorized-command`. Prevention holds; no over-rejection.

**Root cause of my error.** I reasoned from *shape* — two runs, seconds apart, one cancelled — and
from the fact that a summary comment plausibly *could* re-enter an unanchored predicate. I never
checked whether the body actually contained the token. `total_jobs=0` was the visible signal and I
read it as "cancelled before it could spend" when it equally means "inert, jobs skipped". I even
wrote the job-count discriminator into the record while missing that it did not distinguish the two
cases I needed to tell apart.

**The rule.** A duplicate run is evidence of a dispatch defect only if the triggering body would have
satisfied the trigger predicate. Test the body against the predicate; do not infer the mechanism from
timing. `conclusion=cancelled` + `total_jobs=0` is **not** proof of a prevented spend — it is equally
consistent with a run that was never going to spend.
