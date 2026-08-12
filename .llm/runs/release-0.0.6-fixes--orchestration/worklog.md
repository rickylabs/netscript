# Worklog — 0.0.6 fixes lane

## 2026-08-12 — Stage A: bootstrap

**Identity / worktree proof** (executed, not asserted):

```
$ git rev-parse --show-toplevel   → /home/codex/repos/netscript-006-fixes
$ git branch --show-current       → chore/release-0.0.6-fixes-orchestration
$ git status --porcelain          → (clean)
$ git rev-parse origin/main       → 01aa12b67e36b643e1ca4f94421ecba07e030db5
$ hostname                        → YogaBook9i
```

Worktree is distinct from the sibling 0.0.6 lanes (`netscript-006-docs`, `-features`,
`-internals`), all three of which sit on the same baseline commit. No cross-lane worktree sharing.

**Live milestone re-baseline.** GitHub milestone 26 (`0.0.6`): 16 open, 24 closed. All six owned
issues fetched live and confirmed `OPEN` in milestone `0.0.6`:

| Issue | State | Labels | Acceptance boxes in body |
| --- | --- | --- | --- |
| #1438 | OPEN | `type:fix,area:tooling,priority:p1` | none — fix specified in prose |
| #1417 | OPEN | `type:fix,status:triage,priority:p1,area:release` | **5** |
| #1430 | OPEN | `type:fix,area:tooling,priority:p2` | none — fix specified in prose |
| #1397 | OPEN | `type:fix,area:cli,gate:e2e,status:triage,priority:p2,area:database` | **4** |
| #1399 | OPEN | `area:cli,gate:e2e,type:test,status:triage,priority:p2` | **4** |
| #1428 | OPEN | `type:fix,area:cli,priority:p2` | none — fix specified in prose |

13 acceptance boxes total, all currently unticked. Three issues (#1438, #1430, #1428) carry no
checkbox list; their close-gate obligation is therefore the PR-body checklist plus the decisive
claim per issue (pre-merge checks 5 and 7), and the implementation briefs are instructed to state
acceptance explicitly in the PR body so check 7 has something to verify.

**Mislabelled-issue check** (`agent-milestone-orchestrator` § reading a milestone). Read each
issue's *acceptance*, not its labels. Result: no mislabelling of the #1020 class found. #1399 is
labelled `type:test` and its acceptance is genuinely test-only. #1397 carries `area:database` but
its acceptance is a gate-selection predicate in `packages/cli/e2e/`, not database code — clustered
by acceptance (E2E), not by label.

**Source sizing, executed rather than assumed:**

```
.llm/tools/release/github-release.ts:132  isVersionOnlyReleaseDiff  → changedFiles.every(p => allowed.has(...))
.llm/tools/release/github-release.ts:151  isExactVersionReplacement → byte-level per-file check (keeps a widened set honest)
deno.json:124  "publish:dry-run": ".llm/tools/release/run-publish-dry-run.ts"
packages/cli/e2e/suites/scaffold/capability-suites.ts:155-161  POSTGRES_ONLY_RUNTIME_GATES contains GATE.BEHAVIOR_SERVICE_HEALTH
packages/cli/e2e/suites/scaffold/capability-suites.ts:299      runtimeGateIds() drops it unless database === 'postgres'
packages/cli/src/public/features/root/public-command-tree_test.ts  (#1428 — distinct tree from PR C)
```

This confirms the #1397 root cause named in the issue and confirms PR C / PR D touch disjoint
trees (`packages/cli/e2e/**` vs `packages/cli/src/**`), so they may run concurrently in wave 2.

**Run dir created:** `.llm/runs/release-0.0.6-fixes--orchestration/` with `supervisor.md`,
`plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `cut-trace.md`, `slices/`.

## 2026-08-12 — Stage B: dispatch preconditions

Procedural gates. The proof is the recorded check output below, not a claim that they were checked.

**1. Codex runtime health** — `deno task agentic:runtime doctor`:

```
Agentic runtime doctor: no_change (schema 1.0)
mode: inspect; changed: no
desired state: foundation-desired-1.0
observed state: foundation:9cb7cc01433d7164922105f45d412715cf38ac723d62142023549f5adca0f7d9
components: 18; sessions: 0
```

`no_change` with 18 components healthy and **0 live sessions** — no orphaned control socket, no
rival sender in any worktree, no repair needed before dispatch.

**2. GitHub transport** — `deno task agentic:gh-token check`:

```
OK — valid GitHub token resolved from gh:windows (rickylabs)
```

**3. Paid-transport / quota verification.** The wave plan routes **entirely to in-plan native
lanes**: Codex · GPT-5.6 Sol (OpenAI subscription) for implementation, Claude · Opus 5 / Fable 5
(Anthropic plan) for orchestration and IMPL-EVAL. **No OpenRouter or other paid transport is
scheduled**, so there is no paid-transport spend to verify for this dispatch — the 0.0.4 failure
being guarded against ($7.43 billed to the wrong transport) has no surface here.

This is a *conditional* clearance, not a blanket one: the escalation routes named in
`supervisor.md` (MiniMax M3 / DeepSeek V4 Flash / Qwen 3.8 Max) **are** paid OpenRouter surfaces.
If any slice escalates to one, its quota and transport are verified and recorded **at that point**,
before the escalation runs. OpenHands transport is unavailable regardless — #1524 is an open draft.

**4. Expensive-gate serialisation.** Zero live Codex sessions and no `scaffold.runtime` in flight
at dispatch, so wave 1 starts with the expensive gate free. Wave 1 (release tooling) is not
expected to need it; wave 2 (E2E) is, and will take it one slice at a time.

**Verdict: preconditions green. Wave 1 cleared for dispatch.**

## 2026-08-12 — Stage C: wave 1 dispatch

Leaf worktrees created off `origin/main@01aa12b67`, one per PR cluster. All four (waves 1 and 2)
were created up front; only wave 1 is dispatched.

**Git-safety finding at dispatch.** `git worktree add -b <branch> origin/main` sets the new branch's
upstream to `origin/main`. The launcher's safety check **blocked the first launch attempt**:

```
FAIL git-safety: {"branch":"fix/1438-release-cut-canary-pair-inheritance","head":"01aa12b67",
"upstream":"origin/main","dirty":0,"problems":["worktree has upstream 'origin/main' — a bare push
could corrupt it (push-safety requires NONE; push via explicit refspec)"]}
```

This is the guard doing its job: a bare `git push` from a slice worktree would have targeted `main`
directly. Resolved by `git branch --unset-upstream` on all four leaf branches; re-verified
`upstream: NONE` before launching. Slices push via explicit refspec.

**Launch identity — requested vs observed** (`lane-policy.md` invariant 3: launch identity is data,
not prose):

| Slice | Worktree | Thread id | Requested | Observed | State |
| --- | --- | --- | --- | --- | --- |
| A (#1438+#1430) | `/home/codex/repos/ns006-f-a-release-tooling` | `019ff4ef-8644-7260-9290-79da5586e774` | openai / gpt-5.6-sol / medium | openai / gpt-5.6-sol / medium | working |
| B (#1417) | `/home/codex/repos/ns006-f-b-dryrun` | `019ff4f0-5c24-7a01-bb58-1d2e69cb0196` | openai / gpt-5.6-sol / medium | openai / gpt-5.6-sol / medium | working |

Requested and observed identity match for both. Launched **attached** through
`agentic:launch-codex-slice` (app-server thread), never `codex exec` — an unattached one-shot is
unreachable for follow-up turns and cost an hour in 0.0.4.

One sender per worktree; no rival second send. Steering, when needed, goes through
`agentic:codex-resume` on the thread id.

**Wave 2 held, deliberately.** PR C (`ns006-f-c-e2e-gates`) and PR D (`ns006-f-d-island`) have
worktrees and briefs staged but are **not** dispatched. They are independent of wave 1, so this is
not a dependency hold — the reason is that wave 1 is the first use of this lane's brief format, and
a defect in the brief is cheaper to fix once than four times. Recorded here so the hold is a
decision, not a drift.

## 2026-08-12 — Stage C: wave 2 dispatch

Wave 2 dispatched on owner instruction, into the worktrees already prepared at wave 1. The hold
recorded above is therefore **lifted by owner decision, not by the stated condition** (wave 1 had
not yet produced a PR to validate the brief format). Recorded as a re-planning event in
`cut-trace.md` rather than silently overwritten.

**Duplicate-work check before dispatch** (owner instruction: do not duplicate active work).
Executed, not assumed:

```
$ gh pr list --state open --search <n>   for n in 1397 1399 1428 1438 1430 1417
  → no open PR references any of the six owned issues
$ git ls-remote --heads origin | grep -E "1397|1399|1428|1438|1430|1417"
  → no remote branch for any owned issue (the three greps that matched are
    coincidental SHA substrings, not branch names)
$ deno task agentic:codex-status
  → no session in ns006-f-c-e2e-gates or ns006-f-d-island prior to launch
```

Sibling 0.0.6 lanes are concurrently active on this host (`ns006-1405` → features lane,
`ns006-gatetrust` → a PR-A gate-trust slice). Neither touches this lane's six issues or its four
worktrees. No overlap.

**Launch identity — requested vs observed:**

| Slice | Worktree | Thread id | Requested | Observed | State |
| --- | --- | --- | --- | --- | --- |
| C (#1397+#1399) | `/home/codex/repos/ns006-f-c-e2e-gates` | `019ff4f5-2117-7a61-84e0-1afb82ae7c05` | openai / gpt-5.6-sol / low | openai / gpt-5.6-sol / low | working |
| D (#1428) | `/home/codex/repos/ns006-f-d-island` | `019ff4f5-27a0-77c1-8072-6842061aa589` | openai / gpt-5.6-sol / low | openai / gpt-5.6-sol / low | working |

All four thread ids are recorded by the launcher in each slice's `codex-thread-ids.md`.

**All four slices live, verified by growing rollout artifact rather than by status display:**

```
A 019ff4ef-8644  rollout 660785 B  mtime 09:51:31
B 019ff4f0-5c24  rollout 732292 B  mtime 09:51:11
C 019ff4f5-2117  rollout 239722 B  mtime 09:52:48
D 019ff4f5-27a0  rollout 157221 B  mtime 09:52:49   (now 09:52:50 +0200)
```

**Scope discipline.** Each leaf PR stays narrow: A and B are one file each, C is
`packages/cli/e2e/**`, D is `packages/cli/src/**`. C and D touch disjoint trees and cannot conflict.
Every brief forbids starting `scaffold.runtime` on the slice's own initiative, so the expensive gate
stays serialised under orchestrator control even with four slices in flight.

## 2026-08-12 10:08 — Stale-loop detection: slices A and B were dead, recovered

**Detected by artifact age, not by status display.** A routine liveness sweep showed A and B absent
from `codex-status`'s bounded 8-entry list, with no process in either worktree and rollout files
untouched for ~16 minutes, while C and D wrote every few seconds.

The first reading (recorded as cut-trace F-2) was that killing a launcher is harmless because the
thread lives in the daemon. **That reading was wrong**, and the correction is in `cut-trace.md`
F-2. Correlating each launcher's SIGTERM deadline against its slice's last rollout write:

```
A  launcher +timeout 300 → 09:51:06     last rollout write 09:51:31  (+25s)  DEAD
B  launcher +timeout 300 → 09:52:00     last rollout write 09:52:27  (+27s)  DEAD
C  launched with no timeout             writing at 10:07:41                  ALIVE
D  launched with no timeout             writing at 10:07:41                  ALIVE
```

Neither dead rollout ends in `task_complete` — A's stops mid-turn after a successful
`patch_apply_end`. The launcher is the message sender holding the turn; killing it kills the turn
~25 seconds later. The delay is what made the wrong reading plausible: a status check inside that
window shows a healthy, working slice that is already dead.

**Recovery.** Both threads resumed in place via `agentic:codex-resume` (never a rival second send,
never a relaunch — a relaunch would have created a second sender on the same worktree). All
in-progress work was intact on disk, so only wall clock was lost:

| Slice | Preserved work at resume |
| --- | --- |
| A | `M .llm/tools/release/github-release_test.ts` — had already imported `discoverPreparedReleaseFiles` from `prepare-release.ts`, which is the required derive-from-the-writer construction |
| B | `M .llm/tools/release/publish-workspace.ts`, `?? .llm/tools/release/publish-workspace_test.ts` |

Resume messages restated the full acceptance and gate set so the recovered turns are not working
from a truncated memory of the brief, and explicitly told each agent the termination was an
orchestrator-side error rather than a rejection of its work.

**Cost: ~16 minutes on two slices. Nothing lost but time.** Recorded because the next orchestrator
will otherwise repeat it: `timeout` around a launcher looks like ordinary defensive shell hygiene.

## Slice progress at 10:08

| Slice | HEAD | Working tree | State |
| --- | --- | --- | --- |
| A (#1438+#1430) | `01aa12b67` (no commits yet) | `M github-release_test.ts` | resumed |
| B (#1417) | `01aa12b67` (no commits yet) | `M publish-workspace.ts`, `?? publish-workspace_test.ts` | resumed |
| C (#1397+#1399) | `86d265f74` | clean | **both commits landed, in required order**, running gates |
| D (#1428) | `01aa12b67` (no commits yet) | `M public-command-tree_test.ts` | working |

C's two commits are in the order the brief required — `78d587ac9 fix(cli-e2e): keep service health
across database overrides (#1397)` then `86d265f74 test(cli-e2e): pin deferred gates for every
suite (#1399)` — so #1399's pins were written against the corrected gate sets. C's #1397 commit
title indicates it chose to **keep** `behavior.service-health` executing across database overrides
rather than declaring a stated exclusion; that is the stronger of the two acceptable outcomes, and
the pre-merge gate will verify the postgres set is genuinely unchanged.

## 2026-08-12 — Stage D: pre-merge gate, PR #1534 (slice C, #1397 + #1399)

Turn completed 08:12:58Z. PR **#1534** `fix(cli-e2e): make runtime gate sets explicit`, draft →
marked ready. Two commits in the required order (`78d587ac9` #1397, then `86d265f74` #1399).

Gate run per `milestone-run.md`. **Verified by the orchestrator, not accepted from the slice's
report.**

| # | Check | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | close-gate green | **BLOCKED — `SKIPPED`** | see check 4 |
| 2 | zero unticked boxes on closed issues | pending close-gate | PR body reproduces all 8 boxes ticked with `acceptance-evidence` blocks for both issues |
| 3 | no new `deno-lint-ignore`/`as unknown as`/`@ts-ignore` (excl. `.llm/runs/**`) | **PASS** | `git diff origin/main..HEAD -- . ':(exclude).llm/runs/**' \| grep -E "^\+.*(…)"` → no matches |
| 4 | named expensive gates report SUCCESS | **FAIL — every check `SKIPPED`** | 18 checks, all `SKIPPED`, including `close-gate`, `code-quality`, `check-test`, `scaffold-runtime`, `scaffold-runtime-sqlite` |
| 5 | decisive claim per issue, re-verified independently | **PASS — see below** | orchestrator read the gate implementation |
| 6 | changed-file audit | **PASS** | 2 files, both `packages/cli/e2e/**`: `capability-suites.ts` (−1 line), `suite-registry_test.ts` (+71/−6). No stray framework source, no lock, no generated assets |
| 7 | PR body checklist matches what shipped | **PASS with one scope note** | see below |

### Check 4 — the lane's own failure class, firing on the lane's own PR

Every check on #1534 reported `SKIPPED` while the PR was a draft — `close-gate`, `code-quality`,
`code-quality-repo`, `check-test`, `quality`, `surface-diff`, `scaffold-runtime`,
`scaffold-runtime-sqlite`, `scaffold-static`, `deps-report`, and the rest. This is precisely the
#778/#775 precedent that check 4 exists to catch: **"clean" meaning "nothing ran."**

Merging on that rollup would have been indistinguishable from merging a fully green PR. The PR was
marked ready-for-review to make CI actually execute; the gate is re-run against real verdicts
before any merge. **No merge occurs on a skipped rollup.**

Worth noting the irony for the retrospective: a PR whose entire subject is "a green aggregate that
asserts less than it appears to" arrived with a green-looking aggregate that asserted nothing.

### Check 5 — decisive claim for #1397, verified independently

The PR's decisive claim is that `behavior.service-health` is **engine-agnostic**, justifying its
removal from `POSTGRES_ONLY_RUNTIME_GATES` rather than declaring a stated exclusion. The slice
asserted this; it did **not** prove it by execution (the runtime smoke was correctly not run).

Verified by reading the implementation rather than accepting the claim:

```
packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:660  PROBE_SERVICE_HEALTH_SCRIPT
  'const urls = collectHttpUrls(resource);'
  'for (const baseUrl of urls) {'
  '  const healthUrl = new URL("/health", baseUrl).toString();'
```

The probe resolves the app's HTTP URLs from `aspire describe` and issues a GET to `/health`. It has
**no database coupling of any kind**. The claim holds.

Corroborating evidence that the fix is correctly *scoped* rather than merely permissive: the three
genuinely Postgres-specific gates — `DATABASE_MIGRATION_ARTIFACTS`,
`RUNTIME_CAPTURE_DB_ALLOCATION_FIRST/_SECOND` — and `BEHAVIOR_LIVE_DB_ENDPOINT` all **remain** in
`POSTGRES_ONLY_RUNTIME_GATES`. Exactly one gate was removed, and it is the one that was
miscategorized. This is the strong form of #1397's acceptance, not the weaker "stated exclusion"
escape.

### Check 7 — scope note: the sqlite tier gains a gate

`#1397` is written about mysql/mssql. Removing `BEHAVIOR_SERVICE_HEALTH` from
`POSTGRES_ONLY_RUNTIME_GATES` also adds it to the **sqlite** runtime tier, and the slice updated
the sqlite assertion accordingly:

```
- assertEquals(sqlite.gates.some((g) => g.id === GATE.BEHAVIOR_SERVICE_HEALTH), false);
+ assertEquals(sqlite.gates.some((g) => g.id === GATE.BEHAVIOR_SERVICE_HEALTH), true);
```

This is **defensible and arguably required** — the gate was in a set named "postgres only", so
correcting the categorisation necessarily reaches every non-postgres tier, and leaving sqlite
silently excluded would reproduce #1397's own defect one tier over. The PR body states it
("keeps `behavior.service-health` for MySQL, MSSQL, SQLite, and Postgres"), so check 7 is satisfied:
the body matches what shipped.

**But it is unproven by execution.** `scaffold-runtime-sqlite` is `SKIPPED`, so nothing yet
demonstrates that `/health` actually answers on the sqlite tier. That gate is the one CI job that
would prove it, and it is exactly the job the draft state suppressed. **This is the specific reason
#1534 does not merge until CI has genuinely run** — a widened gate set that turns the sqlite tier
red would be a worse outcome than the defect being fixed.

Negative controls accepted as strong (they are quoted with real red output in the slice's
`evidence.md`): the old service-health drop fails the new database-matrix test; a throwaway
deferral fails the all-suite pin; a removed expectation entry fails type-checking. The IMPL-EVAL
owner waiver (drift D-3) is therefore **provisionally earned** for slice C, pending the CI verdict.

## 2026-08-12 — Stage D: pre-merge gate, PR #1535 (slice D, #1428)

Turn completed. PR **#1535** `fix(cli): guard DB-backed island emitted imports`, one commit
`8ce131234`, draft → marked ready.

| # | Check | Verdict | Evidence |
| --- | --- | --- | --- |
| 3 | no banned constructs (excl. `.llm/runs/**`) | **PASS** | no matches in diff |
| 6 | changed-file audit | **PASS** | exactly **one** file: `packages/cli/src/public/features/root/public-command-tree_test.ts` (+63/−10). Test-only. |
| 4 | expensive gates SUCCESS | pending — CI triggered by ready | was `SKIPPED` as draft, same as #1534 |

**Riskiest claim, verified independently.** The brief required D to deliberately break templates to
prove the guard fires, and warned that a left-behind break ships a real regression. The slice
claims all breaks were restored. Verified by the diff rather than the claim: the changed-file list
contains **no template and no `.tsx` file at all** — only the test. Restoration is confirmed by
absence, which is the strongest available form of that check.

Negative controls reported, and they include the one that matters most: **the pre-fix DB break
stayed green** (proving the gap #1428 describes was real), then went **red** post-fix; the
memory-island break still goes red (unchanged coverage); a broken non-relative import goes red; and
legitimate `npm:`/`jsr:` imports do **not** false-positive. Focused runtime 415–429 ms → 792–825 ms,
so the guard stays cheap — which was the point of #1428, since its whole value is catching this
class *without* `scaffold.runtime`.

Both slices correctly declined to run the serialized `scaffold.runtime` gate without an
orchestrator grant, as their briefs required. Neither self-merged.

## 2026-08-12 — Expensive-gate grant: slice C holds `scaffold.runtime`

Both slices correctly declined to run the serialized runtime smoke without a grant. The
orchestrator grants it to **PR #1534 only**, by applying the `e2e-cli-gate` label
(`.github/workflows/e2e-cli.yml:97` — the workflow runs for eligible PRs carrying it).

Rationale: #1534 is the PR that *changes runtime gate selection*, including adding
`behavior.service-health` to the sqlite tier. `scaffold-runtime-sqlite` is the only job that
proves `/health` actually answers there. Running it on #1534 is not ceremony — it is the specific
evidence the pre-merge gate is missing.

PR #1535 is **not** granted the gate. It is a test-only change under `packages/cli/src/**` that
does not alter any suite's gate selection, and #1428's whole purpose is to catch its defect class
*without* the expensive gate. Running it there would contradict the issue being closed.

Serialisation holds: exactly one PR carries the label, so only one `scaffold.runtime` executes.

## 2026-08-12 — close-gate FAILURE on #1534, root cause and fix

`close-gate` reported **FAIL** with all 8 boxes across #1397 and #1399 listed as `unchecked`
against the live issue bodies, while the mirror step logged `acceptance-mirror APPLIED: no changes`.

Root cause, read from the tool rather than guessed
(`.llm/tools/validation/mirror-acceptance-evidence.ts:40,54-67`):

```ts
const READY_LABEL = 'status:ready-merge';
...
if (!hasLabel(labels, READY_LABEL)) {
  ... warnings: [`Mirror skipped because live PR labels do not include ${READY_LABEL}; ...`]
  return;   // ← returns before mirroring anything
}
```

The mirror **refuses to run** unless the PR carries `status:ready-merge`. #1534 carried
`status:impl-eval`, so the mirror short-circuited, no box was ever ticked on the issues, and
close-gate then correctly failed on 8 unticked boxes. The PR's `acceptance-evidence` blocks were
well-formed; they were simply never consumed.

**Fix applied:** swapped `status:impl-eval` → `status:ready-merge` (the taxonomy permits exactly
one `status:` label). That label change is itself the `labeled` event that triggers a fresh run —
which matters, because the tool's own guidance warns `reruns cannot observe a new label event`.

This is a **process defect, not an implementation defect**: nothing about slice C's code or
evidence was wrong. Recorded because the same misordering will bite every PR in this lane, and the
remaining slices' PRs are labelled the same way.

## 2026-08-12 — Falsification: cut-trace rule 3 is DISPROVED

Rule 3 was recorded at run open as `[asserted]`: *"a fix whose issue carries no acceptance
checkboxes is adequately close-gated by PR-body checklist + decisive-claim re-verification."*

**The run disproved it.** PR #1535 closes #1428, which carries **no acceptance checkboxes**.
`close-gate` returned **SUCCESS** — while #1534, whose issues carry 8 real boxes, returned
FAILURE for the label reason above.

#1535's green close-gate therefore asserted **nothing about acceptance**: there were no boxes to
check, so the gate had no work to do and passed trivially. A PR closing a box-less issue gets an
identical green from close-gate whether its acceptance was met or entirely ignored.

This is the lane's own failure class — pass indistinguishable from did-not-run — reproduced in the
gate that is supposed to catch it. It does not make #1535 wrong (its acceptance was verified
independently by the orchestrator at check 5/6/7), but it does mean **close-gate green is not
evidence for a box-less issue**, and the PR-body checklist plus independent verification is
carrying the entire load.

Marked `[observed]`. Consequence for this lane: #1438, #1430 and #1428 all lack boxes, so their
PRs' close-gate results must be treated as *no verdict* rather than as a pass, and checks 5 and 7
are the real gate for them.

## 2026-08-12 — Correction: a stale diff base manufactured a false scope violation

While auditing slices A and B I read `git diff --stat origin/main..HEAD` and saw **20 changed
files** in each, including deletions of another lane's run artifacts
(`.llm/runs/fix-1425-sdk-jsdoc--leaf/*`, `.llm/runs/release-0.0.6-features--orchestration/slices/1405/*`)
and edits to `packages/plugin-streams-core/**` and `packages/sdk/**` — work belonging to the
features and SDK lanes. Read at face value this was a serious cross-lane scope violation.

**It was a measurement error, not a slice error.** `origin/main` had advanced by 2 commits
(`01aa12b67` → `8ff1bcb8f`) after these worktrees were cut, as sibling 0.0.6 lanes merged. The
two-dot range `origin/main..HEAD` therefore renders every commit merged into `main` since the
branch point as a *deletion* on my side. Against the merge-base, both slices are tightly scoped:

| Slice | Files vs `origin/main` (wrong) | Files vs merge-base (correct) |
| --- | --- | --- |
| A | 20 | **4** — all `.llm/tools/`: `github-release.ts`, `github-release_test.ts`, `prepare-release.ts`, `generate-cli-assets-barrel.ts` |
| B | 20 | **4** — `publish-workspace.ts`, `publish-workspace_test.ts`, `run-publish-dry-run.ts`, `packages/mcp/deno.json` |

**Rule for the changed-file audit (pre-merge check 6): diff against the merge-base, never against a
moving `origin/main`.** On a milestone with concurrent lanes, `origin/main` moves during the run by
construction, so the naive range accuses every slice of reverting whatever landed while it worked.
Acting on that reading would have meant steering four slices to "restore" files they never touched.
Checks C and D were re-verified against the merge-base and their earlier verdicts stand unchanged
(C: 2 files, D: 1 file).

**On-scope confirmation for B's one non-tooling file.** `packages/mcp/deno.json` looked like the
exact mutation #1417 exists to prevent. It is the opposite — it routes the package-scoped dry-run
through the same non-mutating wrapper and drops `--allow-dirty`:

```diff
-    "publish:dry-run": "deno publish --dry-run --allow-dirty"
+    "publish:dry-run": "deno run --allow-read --allow-write --allow-run ../../.llm/tools/release/run-publish-dry-run.ts --root ../.. --member packages/mcp"
```

That is acceptance box 3 of #1417 ("the package-scoped dry-run likewise leaves MCP `publish` arrays
unmodified") implemented at its source rather than worked around.

## 2026-08-12 — #1534 close-gate now GREEN

After the `status:ready-merge` swap, the `ci` run was re-run (the mirror reads labels live, which is
why a rerun works where the label event alone does not — `ci.yml` fires only on
`[opened, synchronize, reopened, ready_for_review]`).

```
close-gate: success
quality:    success
check-test: success
```

Live issue bodies now show **#1397: 4/4 ticked, #1399: 4/4 ticked** — the mirror applied the PR's
`acceptance-evidence` blocks. Pre-merge checks 1 and 2 are now satisfied for #1534 by execution,
not by assertion.

## 2026-08-12 — The expensive gate contends repo-wide, and contention reads as CANCELLED

`scaffold-runtime-sqlite` reported **CANCELLED** on #1534's dispatched e2e run while
`scaffold-runtime` (postgres) ran. Cause, read from the workflow:

```yaml
scaffold-runtime:
  concurrency:
    group: e2e-scaffold-runtime-global    # ← global, not per-ref
    cancel-in-progress: false
```

The group is **repo-global**, so every lane's runtime job contends for one slot; with
`cancel-in-progress: false` a queued job is dropped when further runs enter the group. Sibling
0.0.6 lanes are active, so this is expected contention, not a defect in #1534.

**Per the gate-integrity rules a CANCELLED expensive gate is a did-not-run, not a pass** — and this
is the specific job that would prove `behavior.service-health` answers on the sqlite tier, which is
#1534's one unproven consequence. Queued for re-run once the group frees. #1534 does not merge
until it reports SUCCESS.

This also *confirms* the 0.0.4 lesson from a new direction: 0.0.4 saw three concurrent
`scaffold.runtime` runs produce two failures that were contention rather than defects. The repo has
since serialised the gate — so contention no longer manufactures false *failures*, it manufactures
**cancellations**, which are easier to misread as neutral.

## 2026-08-12 08:35–08:36Z — Two landings

### PR #1535 → `69485b8fd` (closes #1428)

Full seven-check gate passed. Notable: `close-gate` SUCCESS is **not** counted as acceptance
evidence here (#1428 carries no boxes — see the falsified rule 3 above); checks 5, 6 and 7 carried
it, with template restoration verified against the changed-file list rather than the slice's claim.

`scaffold-runtime` reported **CANCELLED** and this was **not** treated as a pass. It is not a
required gate for this PR, for a stated reason: the change is a single unit test under
`packages/cli/src/**`, executed by `check-test` (SUCCESS); `scaffold.runtime` never loads
`public-command-tree_test.ts`. The cancellation was caused by this orchestrator dispatching #1534's
runtime run into the repo-global concurrency group. Recorded as a did-not-run with a reason, not
argued into a green.

`review-threads` PASS (0 threads). IMPL-EVAL owner waiver applied, earned (drift D-3).

### PR #1534 → `cd24e1679` (closes #1397, #1399)

Full seven-check gate passed, including the expensive gate — **on real execution**.

The PR's own rollup shows `scaffold-runtime` and `scaffold-runtime-sqlite` as CANCELLED, because
those are the superseded `pull_request`-event runs. The green comes from the dispatched run
**31577752491**, and the identity was verified rather than assumed:

```
PR 1534 head sha : 86d265f74d548765fad4d738ee004d0b1aef34f2
dispatch run sha : 86d265f74d548765fad4d738ee004d0b1aef34f2
branch tip       : 86d265f74d548765fad4d738ee004d0b1aef34f2
```

Same content, all three. And the sqlite job **did real work** rather than short-circuiting through
the classifier — the workflow's own escape hatch is a step named `Skipped by policy`, and that step
was itself skipped while the real one ran for ~5 minutes:

```
2. Skipped by policy: skipped                                    ← escape hatch NOT taken
10. SQLite scaffold runtime E2E (one pass, with cleanup): success ← 08:28:51 → 08:33:48
    scaffold-runtime (aspire + docker + postgres): success
```

**This closes the one open risk on #1534**: adding `behavior.service-health` to the sqlite tier was
the unproven consequence of the fix, and the sqlite tier now executes it and passes. The scope note
raised at check 7 is resolved by execution.

Distinguishing "SUCCESS because it ran and passed" from "SUCCESS because a policy step short-
circuited it" is the same did-not-run discipline this lane exists to enforce — applied here to the
gate proving the lane's own fix.

## Lane status after wave landings

| Issue | PR | State |
| --- | --- | --- |
| #1397 | #1534 | **CLOSED/COMPLETED** |
| #1399 | #1534 | **CLOSED/COMPLETED** |
| #1428 | #1535 | **CLOSED/COMPLETED** |
| #1438 | — | slice A working, 2 commits, no PR yet |
| #1430 | — | slice A (same PR) |
| #1417 | — | slice B working, 1 commit, branch pushed, no PR yet |

3 of 6 owned issues landed on `main`. No canary declared by this lane; root owns cadence and cut.

## 2026-08-12 — IMPL-EVAL verdict, PR #1538 (slice B, #1417): PASS WITH FINDINGS

Separate native opposite-family session (Claude · Fable 5 · medium) in its own detached worktree
`/home/codex/repos/ns006-f-b-impleval` at `1a05934e9`, verified equal to the PR head. The
generator's worktree was never touched — no second writer.

**No blocking findings.** All five #1417 acceptance boxes verified by the evaluator's own executed
commands, not from the generator's transcript.

The highest-value check is the one the issue itself demanded — *"do not fix this by removing the
dry-run from the validation sequence; the defect is the mutation, not the check."* The evaluator
constructed a publish-invalid state rather than reasoning about it:

```
$ (injected: import "./this-module-does-not-exist.ts"  into packages/service/mod.ts)
$ rtk proxy deno task publish:dry-run
TS2307 [ERROR]: Cannot find module 'file:///tmp/netscript-publish-dry-run-f01dc8eae944564/packages/service/this-module-does-not-exist.ts'
error: Publish dry-run failed (deno publish exit 1).
EXIT=1
```

So a real `deno publish --dry-run` still runs against the current tree state, still fails on real
publish problems, and still propagates non-zero. The throwaway was cleaned even on that failure
path. **Coverage did not shrink**: 35 members simulated == 35 publishable members discovered in the
source tree, so the isolation does not silently dry-run less than before — which was the specific
way this fix could have passed while gutting the gate.

Two questions the orchestrator raised in the brief were answered by execution:

- **Dropping `--allow-dirty` from the MCP task is not a behaviour change** — the wrapper still
  passes it to `deno publish` inside the throwaway. Re-run on a deliberately dirty tree: exit 0,
  dirty file preserved byte-for-byte.
- **The regression check was seen red first-hand** — bypassing `withThrowawayWorkspace` turned both
  isolation tests `FAILED | 0 passed | 2 failed`; restoring returned `2 passed`.

**A claim was caught and corrected before it was acted on.** The verdict's gates table initially
read `deno task test — exit 0 (full root suite; see note)` with no such note, while the evaluator's
own status said it was still holding for that run. That is an unproven claim of exactly the kind
this lane exists to reject, so it was sent back rather than accepted. Resolved: the run completed
`ok | 3184 passed (617 steps) | 0 failed | 17 ignored (3m19s)`, `TEST_EXIT=0`, and the row now
quotes it. Verdict line unchanged.

**Stated as unverified, not passed over in silence:** the historical pre-fix mutation (19 dirtied
manifests) was taken from the issue and not reproduced at the parent commit; real
`publish`/`preflight` were never executed (hard constraint) and were reviewed only; and all evidence
is local WSL2, not a GitHub Actions runner.

**Non-blocking findings routed, not dropped.** Finding 4 — real `publish`/`preflight` still
materialize `catalog:` in the live tree behind a normal-completion-only `finally`, so an
interruption reaches the original #1417 end state — is **out of #1417's scope and cannot be closed
by this PR**. Filed as **#1540** (`Backlog / Triage`) per the #1090 pattern, carrying the dormant
`copyWorkspace` symlink hazard as a note rather than a separate issue. The remaining findings
(`.git` pointer-file copy, ~104 MB copy cost, SIGKILL orphaning a temp dir) are recorded in the
verdict and need no issue.

## 2026-08-12 08:57:53Z — Landing 3: PR #1538 → `84dd44ae7` (closes #1417)

p1 release blocker. Full seven-check gate green **plus** a focused separate-session IMPL-EVAL PASS.

```
close-gate: SUCCESS              #1417 acceptance boxes: 5/5 ticked by the mirror
check-test: SUCCESS              code-quality: SUCCESS        quality: SUCCESS
scaffold-runtime: SUCCESS        scaffold-runtime-sqlite: SUCCESS
scaffold-static: SUCCESS         surface-diff: SUCCESS        deps-report: SUCCESS
non-green checks (latest per name): 0
review-threads: PASS (0 threads)
```

Sequence that made close-gate pass, for the next run: the acceptance mirror refuses to run without
`status:ready-merge`, and `ci.yml` does not fire on `labeled` — so the working order is
**label first, then re-run `ci`** (the mirror reads labels live, which is why a rerun succeeds
where the label alone does nothing). This is the third time in this lane that ordering was the
whole difference between a red close-gate and a green one.

4 of 6 owned issues now closed: #1397, #1399, #1428, #1417.

## 2026-08-12 — Correction: my rule-3 falsification was overstated

Earlier in this run I recorded cut-trace rule 3 as DISPROVED, claiming #1535's green `close-gate`
"asserted nothing about acceptance — there were no boxes to check, so the gate had no work to do
and passed trivially."

**That was too strong and partly wrong.** `close-gate` validates **PR-body** checkboxes as well as
issue checkboxes. The proof arrived from #1539, which failed close-gate on its own PR body:

```
close-gate FAIL rickylabs/netscript#1539
unchecked PR body: #1539 line 28 [Acceptance] "Separate Fable 5 medium IMPL-EVAL returns PASS.
Pending by design; evaluator separation forbids this implementation session from self-certifying it."
```

So for #1535 the gate *did* do work — it read that PR's acceptance checklist and found it fully
ticked. What survives, in weaker and accurate form:

- **What close-gate proves:** every box, on the closing issues **and** on the PR body, is ticked.
- **What it cannot prove:** that a ticked box is *true*. Ticking is an authorial assertion; the gate
  verifies presence, not assertion — which is precisely #1415's open subject.
- **For a box-less issue** (#1438, #1430, #1428) its acceptance signal reduces to the PR-body
  checklist with no issue-side cross-check, so pre-merge checks 5 and 7 do carry more weight there.
  That part of the original entry stands.

Recorded as a correction rather than edited in place. An orchestrator who overstates a
falsification and then quietly tidies it away has destroyed the same evidence as one who patches
over a real falsification — and this lane's whole subject is checks that look better than they are.

**#1539's close-gate failure is the honesty rule working as designed.** The implementation session
refused to tick its own IMPL-EVAL box ("Pending by design; evaluator separation forbids this
implementation session from self-certifying it"), and the gate then refused to pass the PR. The box
becomes tickable only when a separate-session verdict actually returns PASS — which is the correct
merge ordering for #1539 and is what this lane is waiting on.
