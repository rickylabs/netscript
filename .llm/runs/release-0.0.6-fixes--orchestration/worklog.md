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
