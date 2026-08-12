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

## 2026-08-12 — IMPL-EVAL verdict, PR #1539 (slice A, #1438 + #1430): FAIL

Separate native opposite-family session (Claude · Fable 5 · medium), own detached worktree
`/home/codex/repos/ns006-f-a-impleval` at `c0b98d93d`, diffed against merge-base. Generator
worktree untouched. No publication attempted.

**VERDICT: FAIL (FAIL_FIX). One blocking finding. #1539 is not merged.**

### B-1 — the agent-docs reproduction check is a self-consistency tautology

The evaluator was asked one question explicitly: *can any non-version-bump content be admitted for
canary-pair inheritance?* Answer: **yes, reproduced.**

`verifyGreenCanaryPair` (~L190-197) drops the parent→HEAD byte comparison for every path matching
`isPreparedReleaseGeneratedOutput`, pushing it to `inexactGeneratedPaths` and relying solely on
`assertPreparedReleaseGeneratedOutputsFresh(root)` — which runs the writers in `--check` against
**HEAD only**.

For **source-derived** outputs that is sound, and the evaluator confirmed it by tamper-testing:
the writer re-derives from committed source, and drifted source is itself a changed path outside
the writer set, so `isVersionOnlyReleaseDiff` rejects the diff first. The barrel `--check`
genuinely fails on tamper. **That half of the design is correct.**

`prose.json.gz` is not source-derived in the same sense. `rebaseAgentDocsProse` reads the committed
blob, version-rewrites it, and recompresses. On a same-version stable tree `oldVersion === version`,
so the rewrite is a **no-op and `--check` compares the blob to itself**. `provenance.json` is
recomputed from that blob; `agent-docs.generated.ts` is generated from it. The whole agent-docs
chain is anchored to an unvalidated blob, and all three files are in
`PREPARED_RELEASE_GENERATED_OUTPUTS`.

Reproduced attack, real output:

```
injected MALICIOUS-NON-VERSION-CONTENT-INJECTED-BY-EVALUATOR (no version string) into prose payload
provenance sha256/bytes updated, version unchanged (0.0.5)
gen:publish-assets --check        → exit 0    ← tamper NOT detected
generate-cli-assets-barrel --check → exit 0    ← after syncing the barrel
decoded published barrel          → "MALICIOUS marker present: True"
```

All three admit as inexact-generated, pass `isVersionOnlyReleaseDiff`, and inherit the parent's
canary pair.

**Why this is the worst available outcome in this lane, and why it justified the focused eval.**
Before this PR the guard failed closed — it blocked good releases, which cost 0.0.5 an extra canary
cycle but was safe. This PR would have inverted that to *authorizing publication of content that was
never canary-verified*. Everything else on #1539 was green: seven CI checks, the full 3188-test
suite, both runtime tiers, and the slice's own 21 focused / 101 release-suite tests. **Only an
adversary specifically briefed to attack the inheritance path found it.** That is the
`review_codex_complex` pairing earning its cost, and it is direct evidence for the milestone-run
rule that a guard enters the profile only with its negative case demonstrated.

### B-2 (non-blocking, recorded not fixed)

`check:mcp-export-corpus` fails on the clean committed tree in the evaluator's environment (deno
2.9.5 `deno doc` byte drift). Direction is safe — fails closed — but if release CI likewise cannot
reproduce the committed corpus byte-for-byte, the **entire D-6 inheritance path always rejects and
#1438's feature is inert**: fixed on paper, dead in practice. CI determinism could not be verified.
Routed to slice A as a `drift.md` note only.

### Judged sound

- `--check` is real: non-mutating, and fails closed on tampered source-derived barrels
  (independently confirmed, as the brief required — this was new code with no track record).
- **#1430 is correct and complete**: `--prev-tag` date resolution, commit-date fallback, and the
  loud empty-`since` failure all verified.
- Exact-version-replacement-first ordering and the writer-derived path set are sound.

### Gates the evaluator reproduced rather than relayed

21 focused / 101 release-suite / **3188 repo tests, 0 failed, 17 ignored**; check/lint/fmt clean;
`git status` empty and `deno.lock` unchanged after every probe, including the injection probes.

### Stated as unverified

Real-CI corpus determinism (B-2); live GitHub API behaviour of the notes path (unit/injected
transport only, per the no-network constraint).

### Action

Blocking finding routed back to slice A's live thread with the reproduction and the two bounded fix
options (compare admitted generated outputs parent→HEAD, or make the prose writer a genuine
rebuild). Slice A instructed: do not weaken any existing check to pass; the fix is not done until
the evaluator's attack has been reproduced and shown to **reject**, with that red output in
`evidence.md`; and do not tick the PR's IMPL-EVAL box — that stays unticked until a fresh
separate-session verdict returns PASS, which is why close-gate is honestly red.

## 2026-08-12 — #1539's runtime gates are SUCCESS-by-short-circuit, not real green

Pre-verifying a merge condition ahead of the cycle-2 verdict, against e2e run `31582372124`
(headSha `5350d01fc` == PR #1539 head, confirmed):

```
scaffold-runtime (aspire + docker + postgres): success
   2. Skipped by policy: SUCCESS      ← escape hatch TAKEN
  10. Full scaffold runtime E2E:      skipped
scaffold-runtime-sqlite (aspire + sqlite + garnet): success
   2. Skipped by policy: SUCCESS      ← escape hatch TAKEN
  10. SQLite scaffold runtime E2E:    skipped
```

Compare #1534, where the same jobs were genuine: step 2 `Skipped by policy` was itself **skipped**
and step 10 ran ~5 minutes.

**So both runtime tiers on #1539 are false greens.** The rollup reads `SUCCESS`; nothing ran. This
is the lane's own subject appearing one more time, and it is worth stating that the orchestrator's
earlier status report to the owner described #1539 as having "both runtime tiers SUCCESS" — which
was true of the label and false of the substance. Corrected here rather than left standing.

**Is the gate required for this PR?** No, and for a stated reason rather than convenience. #1539's
entire diff is 4 files under `.llm/tools/` (`github-release.ts`, `github-release_test.ts`,
`prepare-release.ts`, `generate-cli-assets-barrel.ts`). It touches no `packages/**`, no
`plugins/**`, and no scaffold template, and it commits **no regenerated assets** — so
`scaffold.runtime`, which exercises scaffolded app runtime behaviour, has nothing of this change to
exercise. The classifier's short-circuit is the designed behaviour for a non-scaffold-relevant diff.

**Recorded as a did-not-run with a reason, exactly as #1535's CANCELLED runtime job was** — not
counted as a passing expensive gate. The merge condition stated to the owner ("runtime tiers
genuinely SUCCESS, confirmed to have done real work") is **not** met on #1539 and is not being
quietly relaxed: it is replaced by the narrower, honest claim that the gate is not applicable to
this diff, and the applicable gates (`check-test`, `code-quality`, `quality`, `surface-diff`,
`deps-report`, plus the slice's 21 focused / 101 release-suite / 3188 repo tests, and the
evaluator's independent reproduction of those) are what carry it.

One consequence worth carrying forward: **`scaffold-runtime: SUCCESS` in a PR rollup means nothing
on its own.** Whether it ran is only visible in step 2 versus step 10 of the job. Any pre-merge
gate that reads the rollup alone will accept a short-circuit as a pass — which is check 4's exact
failure mode, hiding one level deeper than the rollup.

## 2026-08-12 — IMPL-EVAL cycle 2, PR #1539: FAIL again — same class, different path

Fresh separate Fable 5 session (not a continuation of cycle 1), own worktree
`ns006-f-a-impleval2` at `5350d01fc`. **VERDICT: FAIL (FAIL_FIX). #1539 not merged.**

### What the repair achieved (verified, not relayed)

- **Cycle 1's prose attack is now REJECTED.** The evaluator rebuilt the full injection in a scratch
  repo and drove the real inheritance path: fails closed with "agent-docs prose contains
  non-version changes."
- Probing the new equality held: gzip determinism (the anchor compares **decompressed** content),
  absent parent blob (fail-closed), consistent parent+HEAD injection (would require the canary to
  have published it).
- **The legitimate path still inherits — the feature is not inert.** The real measured v0.0.5 cut
  `6ec75573d` (0.0.4→0.0.5) drove end-to-end through the real `verifyGreenCanaryPair` → `ADMITTED`.
  This was the other way the repair could have failed, and it did not.

### Blocking finding B-1 (cycle 2) — the tautology moved one file over

The parent-anchor guards **only** `prose.json.gz`. A change to `provenance.json` that does not touch
prose **skips the anchor entirely** and is admitted purely on `assertFresh` — which is tautological
for provenance because the writer **spreads `...provenance`**, preserving arbitrary injected fields,
and re-derives only sha/bytes from the unchanged prose.

Proven on the real worktree: an injected non-version field passes `gen:publish-assets --check`
(exit 0), flows into the published `EMBEDDED_AGENT_DOCS_PROVENANCE` barrel, and the diff is
`ADMITTED` through the real inheritance path.

### The orchestrator's read: this is structural, and the fix instruction changed accordingly

Two cycles, two different writer-declared paths, one defect class. The generalisation:

> **Any writer that PRESERVES content rather than RE-DERIVING it from validated source makes its
> HEAD-only `--check` a tautology.**

Cycle 1 verified the *re-derived* outputs (barrels, package metadata, export corpus) are genuinely
tamper-detecting, because their source is itself a changed path the rejection rule catches first.
The *preserved* outputs are the hole, and prose was only the first one found.

So slice A was **not** told to parent-anchor provenance and stop. It was told to **audit every path
in `PREPARED_RELEASE_GENERATED_OUTPUTS` against that rule**, categorise each as re-derived or
preserved with evidence in a table, fix every path in the preserved category, and add a
per-path regression written **before** the fix and shown red — the pattern its prose regression
already demonstrated correctly. A path that cannot be categorised with evidence is to be treated as
unsafe.

Fixing only the reported instance is what produced cycle 2 from cycle 1.

### B-2 partially resolved by cycle 2

The clean-tree `check:mcp-export-corpus` failure is **source drift** — the corpus was last
regenerated 16 commits / 91 source files ago — **not** `deno doc` non-determinism. Generation is
byte-deterministic within deno 2.9.5 linux (CI's pinned version), and `release:cut` regenerates the
corpus at cut time. **Cross-environment determinism (cut-env vs `publish.yml`) remains
unestablished.** Also newly noted: `ci.yml` never runs the corpus check — only the D-6 path does.
Routed to slice A as a `drift.md` D-6 note, not a fix.

### #1430

Correct and complete, spot-checked again: release-date → committer-date → author-date fallback, and
the loud throw on empty `since` before issue collection.

### Gates the cycle-2 evaluator executed

Release suite 102/0, full repo **3189/0**, scoped check/lint/fmt clean, root aliases exit 0.
Worktree left clean, `deno.lock` unchanged, HEAD still `5350d01fc`, generator worktree untouched,
scratch repos built outside both worktrees and removed.

### Stated as unverified

Cross-environment corpus determinism; live GitHub API behaviour (transport-stubbed by constraint);
and — stated by the evaluator against its own result — the provenance-ADMITTED run stubbed
`generatedOutputsFresh`, though its provenance-touching components were proven separately against
the real worktree.

## 2026-08-12 — IMPL-EVAL cycle 3, PR #1539: **PASS**

Fresh separate Fable 5 session (neither prior evaluator), own worktree `ns006-f-a-impleval3` at
`2a4102600`. **VERDICT: PASS. No blocking findings.**

### Headline answer, re-derived

**NO** — no non-version content could be admitted for canary-pair inheritance through **any**
writer-declared path. Both prior holes are closed and no third instance of the class exists.

### The audit was itself audited

Slice A's response to the structural instruction was a **21-row categorisation** of every path in
`PREPARED_RELEASE_GENERATED_OUTPUTS`, each with its named writer function. The evaluator **agreed
with all 21 categories**, having read every writer and traced each output's derivation source
rather than accepting the table.

The tautology-prone class — *a writer re-reading its own committed output* — applies to exactly two
paths, `prose.json.gz` and `provenance.json`, both now separately anchored to the canary parent.

The two rows flagged in the brief as borrowing their safety from other paths' guards (row 4
`agent-docs.generated.ts`, row 10 `mcp publish-assets.generated.ts`) were confirmed genuinely
**re-derived**: their `--check` reads prose/provenance — *other* files — never their own output, so
it is a real reproduction. Proven by tampering each committed output in the real worktree and
getting **exit 1**. The remaining 19 derive from either an exact-version-guarded manifest or a
source outside `discoverPreparedReleaseFiles`, where tamper produces a non-version-only diff that
is rejected upstream.

### Attacks, all through the real verifier with real git reads

```
cycle-1 prose injection ......................... REJECTED
cycle-2 provenance: extra field ................. REJECTED
cycle-2 provenance: sourceCommit ................ REJECTED
cycle-2 provenance: extractionTimestamp ......... REJECTED
cycle-2 provenance: files array ................. REJECTED
cycle-2 provenance: same-version ................ REJECTED
absent-at-parent, both anchored inputs .......... REJECTED (fail-closed)
legitimate control .............................. ADMITTED
```

### The feature is effective, not inert

The real measured v0.0.5 cut `6ec75573d` (0.0.4→0.0.5, 62 files) driven end-to-end through the real
`verifyGreenCanaryPair` returns **ADMITTED**, inheriting parent `89a4e5f4`. This was a blocking
condition in the opposite direction and it holds: #1438 fixes the dead inheritance path rather than
replacing one refusal with another.

### Non-blocking

- **N-1** `check:mcp-export-corpus` still exits 1 on clean HEAD — mid-milestone source drift,
  fail-closed, and `release:cut` regenerates the corpus at cut time. Cross-environment `deno doc`
  determinism remains unverifiable locally. This is cycle 1's B-2, now diagnosed rather than open.
- **N-2** Doc-set-changing cuts are conservatively **rejected by design** — such a cut must earn its
  own canary. Correct behaviour, recorded so it is not mistaken for a defect later.

### Disclosed stub, with justification

`generatedOutputsFresh` was stubbed to resolve in the drivers. The evaluator disclosed this and
justified it: every rejection above comes from the parent-anchor guards that run **before**
`assertFresh`, and it separately proved the two non-tautological `assertFresh` components reject
direct tamper against the real worktree. Live GitHub API paths were exercised via injected
transports only, per the no-network constraint.

### Gates the cycle-3 evaluator executed

Full suite **3190 passed / 0 failed / 17 ignored**; release suite **103 passed**; root check (2876
files), lint, and fmt:check clean; scoped check/lint/fmt on the changed tool files clean. Worktree
clean, `deno.lock` unchanged, HEAD `2a4102600`, generator worktree untouched, tampers restored.

## Merge sequence for #1539

The PR had been flipped back to **draft** when slice A pushed the provenance fix, which is why the
`ci` run at `2a4102600` reported every job `skipped` — the same draft-suppression that opened this
lane's very first gate finding. Marked ready again to trigger a real run; the IMPL-EVAL box was
ticked **only after** `verdict-3.md` existed and said PASS, and the label moved to
`status:ready-merge` so the acceptance mirror will run.

## 2026-08-12 — Pre-merge check 3 fired on #1539, and quality:gate did not

The cycle-3 PASS did **not** clear #1539 for merge. The orchestrator's own diff scan caught a
banned construct the repo's automated quality gate is blind to:

```
.llm/tools/release/github-release.ts:416
+  return value as unknown as AgentDocsProvenance;
```

`deno task quality:gate` reported **SUCCESS** on this PR. It did not catch this, because
`quality:scan` covers `packages/cli/src` and `plugins` — **not `.llm/tools/**`**. The pre-merge diff
scan is the only thing in the pipeline that sees it. This is the #745 incident class and is not
waivable by the orchestrator, so #1539 was held despite a passing formal evaluation.

Worth recording plainly: **three adversarial evaluation cycles did not flag this.** They were
briefed on the inheritance semantics and found two real holes there; a style/typing violation in a
helper was outside what they were told to attack. Formal evaluation and the mechanical gate cover
different ground, and this PR needed both.

### The fix, and the standard applied to it

Routed to slice A with an explicit instruction to preserve the closed-field validation and use a
structural construction or a type predicate — never a `deno-lint-ignore` or `quality-allow`.

Landed as `f2f8a05c8 fix(release): construct validated provenance`. Delta from the evaluated head
`2a4102600` is **one file, one hunk, +10/−1**, entirely inside `parseAgentDocsProvenance`:

```diff
-  return value as unknown as AgentDocsProvenance;
+  return {
+    schemaVersion: 1,
+    version: value.version,
+    ... every field taken from the already-narrowed value ...
+    files: [...value.files],
+  };
```

**The standard for accepting this without a fourth evaluation cycle was stated to the owner before
the diff was seen**, not invented afterwards: the delta must be confined to that function, the field
checks and exact key-set check must be untouched, and the guard regressions must still reject.
Verified by the orchestrator at the final head `f2f8a05c8`:

```
$ deno test .llm/tools/release/github-release_test.ts
parent canary evidence rejects self-consistent non-version agent-docs injection ... ok   ← cycle-1 vector
parent canary evidence rejects writer-preserved non-version provenance injection ... ok  ← cycle-2 vector
ok | 23 passed | 0 failed
```

Banned-construct scan at `f2f8a05c8` against the merge-base: **clean**. `deno.lock` unmodified.

### Dispatch root cause — owner-confirmed, and a correction to this run's record

`dispatch: FAILURE` on #1539 is `openhands-phase-eval.yml` failing with
`HttpError: Not Found — repos/contents` while resolving the trusted evaluator prompt. Root cause
confirmed by the owner: **#1539's historical base SHA predates the trusted prompt**, and for
`pull_request` events the workflow runs from `main` while reading the prompt from the PR's branch.

This **corrects** the earlier entry in `drift.md` D-1, which stated the automatic evaluator "never
fired on this lane because the branches predate the workflow." It did fire, once #1524 landed; it
failed on a missing file rather than never running. The distinction matters: a red `dispatch` is a
gate result to resolve, not an absent gate to note.

Fix PR **#1552** (`fix(agentic): resolve evaluator prompt from current trusted base`) is open.
Owner instruction: keep #1539 immutable, wait for #1552 to merge, then move away from and re-add
`status:impl-eval` **exactly once**, then finish the merge gate. The cast fix was landed **before**
that cycle deliberately, so the single dispatch run evaluates final content rather than being
invalidated by a later push.

## 2026-08-12 — Evaluator recovery on #1539, and prior eval evidence invalidated

**My earlier diagnosis was incomplete.** I reported that #1552 "does not fix #1539's case" because
the dispatcher resolved the prompt at `pr.base.sha` = `cd24e1679`, which predates the prompt file.
That observation was correct but the conclusion was too narrow: the real cause is that **#1539's
branch still carried the pre-#1552 workflow**, and `pr.base.sha` was stale because the branch had
never been updated against `main`. Relabeling alone could not fix either.

Owner-directed recovery, executed:

```
$ git merge origin/main --no-edit          → clean, head f2f8a05c8 → 070eabb61
  impl-eval-prompt.md on branch            → EXISTS  (was MISSING)
  openhands-phase-eval.yml on branch       → EXISTS
  the six lane files                       → intact (1046 insertions preserved)
$ git push origin HEAD:refs/heads/fix/1438-...   (explicit refspec; no upstream)
  PR base recomputed  cd24e1679 → 5db37e7bb
  prompt at new base 5db37e7bb             → EXISTS
```

Then `status:impl-eval` moved away and re-added **exactly once**. Result:

```
openhands-phase-eval  31594332535  completed/SUCCESS   (previously: failure)
→ @openhands-agent model=openrouter/deepseek/deepseek-v4-flash-0731 phase=impl
  Trusted base SHA: 5db37e7bb    Evaluated head SHA: 070eabb61
→ OpenHands agent run 31594353825 running
```

The automatic evaluator resolved and launched. Route is `openrouter/deepseek/deepseek-v4-flash-0731`
— the `formal_impl_evaluation` escalation model in `lane-policy.md`. **No manual evaluator was
launched or posted at any point in this lane.**

### Prior evaluation evidence is INVALIDATED

Per owner instruction, the three local Fable 5 cycles no longer constitute the merge basis:

| Cycle | Head evaluated | Verdict | Status now |
| --- | --- | --- | --- |
| 1 | `c0b98d93d` | FAIL (prose tautology) | historical |
| 2 | `5350d01fc` | FAIL (provenance tautology) | historical |
| 3 | `2a4102600` | PASS | **superseded — head has moved twice since** |

The evaluated head is now `070eabb61` (cast fix `f2f8a05c8` + the `main` merge). **The merge basis
for #1539 is the automatic dispatch verdict at `070eabb61`, not cycle 3.** The local verdicts are
retained as run evidence — they are what found and closed the two real holes — but they are no
longer cited as merge authorization.

This is the correct call regardless of instruction: cycle 3 was pinned to a commit two moves back,
and this lane's whole subject is refusing evidence that no longer describes the artifact.

### Standing constraint reaffirmed

Waves 3–4 branches are cut from **current `main`** at dispatch time. This incident is the concrete
reason: a branch cut from a stale base carries a stale workflow *and* a stale `pr.base.sha`, and
both must be current for automatic evaluation to resolve.

## 2026-08-12 — e2e CANCELLED on #1539: diagnosed as global runtime contention, NOT label-event concurrency

Owner asked whether label-event concurrency caused the cancellation. **It did not**, and the
evidence is decisive:

**1. `e2e-cli.yml` does not trigger on `labeled` at all.**

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
  workflow_dispatch:
```

So the `status:impl-eval` remove/re-add could not have created a competing `e2e-cli` run. Run
`31594287382` was created at 11:58:48Z by the **`synchronize` event from my merge push**, not by a
label event.

**2. The workflow-level concurrency did not fire either.** `e2e-cli` uses
`group: e2e-cli-<workflow>-<ref>` with `cancel-in-progress: true`. Had that fired, the **whole run**
would have been cancelled. It was not — four of six jobs completed successfully:

```
classify changes ............................ success  11:58:51 → 11:59:07
scaffold-static (deno-only) ................. success  11:59:10 → 11:59:14
desktop-native-linux ........................ success  11:59:09 → 11:59:13
scaffold CI lane visibility ................. success  11:59:46 → 11:59:49
scaffold-runtime (postgres) ................. CANCELLED 11:59:07 → 11:59:44
scaffold-runtime-sqlite ..................... CANCELLED 11:59:07 → 11:59:43
```

**Only the two jobs in the repo-global group were cancelled**, which localises the cause to the
job-level `concurrency: group: e2e-scaffold-runtime-global, cancel-in-progress: false`. Under that
setting a **queued** job is superseded when a newer run enters the group. Concurrent entrants around
the cancellation window:

```
31594326130  11:59:17  test/1374-docs-snippet-compile-gate       success
31594377509  12:00:00  chore/release-0.0.6-internals-orchestration  skipped
31594287382  11:58:48  fix/1438-... (ours)                       CANCELLED
```

**Verdict: cross-lane contention for the single global runtime slot.** This is the third distinct
way this lane has seen the expensive gate produce a non-verdict — CANCELLED by contention (#1535,
here), SUCCESS-by-short-circuit (#1539 at `2a4102600`), and SKIPPED while draft (all four PRs).

**Is a rerun required?** Not for correctness. At the previous head the same jobs took the
classifier's escape hatch — `2. Skipped by policy: success`, `10. SQLite scaffold runtime E2E:
skipped` — because #1539's diff is release tooling under `.llm/tools/**` with no `packages/**`,
`plugins/**`, or scaffold template. They would short-circuit again. A rerun's only value is turning
CANCELLED into SUCCESS so the merge gate reads zero non-green.

Per owner instruction this is deferred: **rerun once, only after the evaluator verdict and head
stability**, and only if still required at that point.

## Cross-lane hazard received from the 0.0.6 internals lane — applies directly here

The internals orchestrator reported (their `drift.md` D-24) that **`gh-watch` reported a terminal
PASS in 0 seconds by matching a SUPERSEDED run's verdict comment** while a new evaluation was still
in flight. It cannot distinguish "this PR has a PASS in its history" from "this PR's current
evaluation passed."

**This lane is squarely exposed.** #1539 now has four evaluation verdicts across four heads:

```
c0b98d93d  local cycle 1  FAIL
5350d01fc  local cycle 2  FAIL
2a4102600  local cycle 3  PASS   ← a PASS sitting in this PR's history
070eabb61  automatic      pending  ← the only one that can authorize a merge
```

A head-blind verdict read would match cycle 3's PASS and authorise a merge on evidence two commits
stale. **Binding rule adopted for this lane: before consuming any verdict, compare the verdict
comment's `head=` against the live PR head, and reject any verdict whose head does not match.**
Their concrete precedent: PR #1560 had two automatic runs disagreeing across heads — PASS at
`49e2b86e9`, FAIL_FIX at `9ab361440`, the latter being the head that would actually merge.

**Second item from that report with a direct effect here:** #1527 landed on `main` and changed what
the acceptance mirror accepts — evidence asserting not-yet-done ("Pending…", "TODO", "will run after
merge") is now rejected for any box it is about to newly tick. #1539's IMPL-EVAL box currently cites
cycle 3, which is invalidated. It must be rewritten to cite the automatic verdict at `070eabb61`
before the mirror runs, or it is both stale and potentially mirror-rejected.


## 2026-08-12 — Correction: why quality:gate missed the `as unknown as` on #1539

Earlier I recorded that `quality:gate` missed the cast because "`quality:scan` covers
`packages/cli/src` and `plugins` — not `.llm/tools/**`". **That mechanism was wrong for this case.**
The internals lane probed it, I verified their probe, and the real cause is a third failure mode
neither lane had stated.

`.github/workflows/code-quality.yml` computes the PR gate's input as:

```bash
mapfile -t files < <(git diff --name-only --diff-filter=ACMR \
  "${{ github.event.pull_request.base.sha }}" "${{ github.sha }}" -- packages plugins)
args=(); for file in "${files[@]}"; do args+=(--changed-file "$file"); done
if ((${#args[@]})); then deno task quality:scan --pretty "${args[@]}"; fi
```

Three independent defects live here:

1. **Pathspec `-- packages plugins`** — a `.llm/tools/**` change can never enter the set.
2. **`if ((${#args[@]}))`** — an empty set skips the scan entirely and the step reports success.
   The did-not-run-looks-like-pass signature, in one line of bash, inside the gate built to detect
   that class.
3. **`pull_request.base.sha` is stale for an old PR** — and this is the one that hit #1539.

#1539 touches **no** `packages/**` file; its whole diff is six files under `.llm/tools/`. Yet the
set was not empty, because its `base.sha` was `cd24e1679` — the commit this lane's own #1534 merged
at, hours stale. Running the workflow's exact range:

```
$ git diff --name-only --diff-filter=ACMR cd24e1679 2a4102600 -- packages plugins   → 9 files
  packages/cli/e2e/suites/scaffold/capability-suites.ts            ← my #1534, already merged
  packages/cli/e2e/tests/presentation/suite-registry_test.ts       ← my #1534, already merged
  packages/cli/src/public/features/root/public-command-tree_test.ts ← my #1535, already merged
  packages/plugin-streams-core/… (4 files)                          ← features lane #1405, merged
  packages/sdk/… (2 files)                                          ← #1425 lane, merged
```

**Every file belongs to a PR that already landed.** The gate scanned nine real files, found
nothing, and reported success — having inspected zero lines of the PR under review. Not
under-scanned: scanned the wrong changeset.

Mode 3 is the worst of the three because it is the least visible. Mode 2 reports success having run
nothing, which a step log exposes. Mode 3 reports success having run something substantial over
foreign input, and it **degrades with PR age** — the staler the base, the more foreign files it
pulls in and the more convincingly covered it looks. The gate is therefore anti-correlated with
risk: a long-lived PR, the kind most likely to accumulate a bad cast, gets the least of its own code
scanned.

**Same root cause as the evaluator failure.** The stale `pull_request.base.sha` that made
`impl-eval-prompt.md` unresolvable on #1539 is the same value poisoning this changed-file range.
One stale input, two independent gates producing confident false greens.

**And it is the third time this run that a two-dot range against a moved `main` produced a false
result** — the first was my own changed-file audit, where `origin/main..HEAD` rendered other lanes'
merged work as deletions and nearly had me steer four slices to restore files they never touched.
The rule earned there applies to CI as well as to orchestrators: **compute a PR's changed set from
the merge-base or the PR's own file list, never from a recorded base against a moving branch.**

Routed to the internals lane as data for #1403 (theirs to own); provenance credited on that issue.
The correction stands regardless of who fixes it: **on #1539 the only thing that inspected the
actual diff for banned constructs was the orchestrator's pre-merge grep.**
