# Supervisor identity — 0.0.7 internals topic

| Field                                | Value                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| Role                                 | `topic-internals-0.0.7`                                                                |
| Profile                              | milestone-cluster topic orchestrator                                                   |
| Topic branch                         | `orchestrator/release-0.0.7-internals`                                                 |
| Dispatch base                        | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                             |
| Live `origin/main` at reconciliation | `01e0960494c95ce56eb35892c211a095eb13e6ed`                                             |
| Coordinator plan head                | `331f7c664` (`PLAN-EVAL` approved)                                                     |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910`                                             |
| Authority                            | Internals lane only; no merge, release, publication, scope, or central-state authority |
| WIP                                  | At most two implementers, one evaluator, and no overlap of the global expensive gate   |

## Wave 0 route table

| Leaf                                   | Requested implementation route                            | Opposite-family review/evaluation                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `quality-scan-allowance-rail`          | `complex_implementation`: OpenAI Codex GPT-5.6 Sol, high  | Claude Fable 5 medium for PLAN-EVAL/formal evaluation and effort-paired substantive review, serialized within the topic evaluator slot                 |
| `harness-evidence-and-verdict-tooling` | `normal_implementation`: OpenAI Codex GPT-5.6 Sol, medium | Claude Fable 5 low substantive review; formal IMPL-EVAL uses the canonical opposite-family evaluator route, serialized within the topic evaluator slot |

The coordinator remains the sole merge and release authority. Leaf PRs target `main` and remain
draft until coordinator review.

## 2026-08-15 reset — Claude replacement attachment (SUPERSEDED Sonnet canary)

Recorded by the rejected Sonnet-low canary. Retained for history only; superseded by the Opus 5/high
attachment below. The canary dispatched no leaf and no evaluator.

| Field             | Value                                                                                |
| ----------------- | ------------------------------------------------------------------------------------ |
| Claude session ID | `1d02b9ca-196b-4363-b5ec-d6bd5fdf613c`                                               |
| PID               | `2402901`                                                                            |
| Requested route   | `claude-sonnet-5`, effort `low` — below the reset model floor                        |
| Remote Control    | attached; `bridgeSessionId` `session_011m4xHFkn36RbYsSXRpZe1Q`                       |
| Disposition       | superseded per `briefs/reset-gates/dispatch.json` `ownerOverride.topicOrchestrators` |

## 2026-08-15 reset — active Claude topic controller (Opus 5 / high)

Replaces the parked legacy Codex topic controller `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` per
`briefs/topic-claude-reset-common.md`, and supersedes the Sonnet-low canary above. The legacy
thread/branch/worktree/PRs/evidence remain preserved and untouched; it is never resumed as a topic
controller. Its rollout `rollout-2026-08-13T22-12-06-019ffcc0-e1b5-74f0-96eb-cdeb298d6b17.jsonl`
(3.0 MB) is intact on disk and has no live process.

| Field                 | Value                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role                  | `topic-internals-0.0.7`                                                                                                                            |
| Claude session ID     | `f7691917-0be2-4bcd-8839-43d3fc809c34`                                                                                                             |
| Bridge session ID     | `cse_01HqFtKQtyJcHBEn1MghQdFX` (non-empty → Remote Control attached)                                                                               |
| Remote Control URL    | `https://claude.ai/code/session_01HqFtKQtyJcHBEn1MghQdFX`                                                                                          |
| PID                   | `2429478` (claimed bg-spare worker; daemon `2429416`, pty host `2429439`)                                                                          |
| cwd                   | `/home/codex/repos/netscript-007-internals`                                                                                                        |
| CLI version           | `2.1.233`                                                                                                                                          |
| Requested route       | `claude-opus-5`, effort `high`                                                                                                                     |
| Observed launch flags | `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 internals supervisor"`           |
| Registry evidence     | `~/.claude/jobs/f7691917/state.json` — `state: working`, `backend: daemon`, `providerEnv: {}` (native Anthropic, no `ANTHROPIC_BASE_URL` override) |

Requested route equals observed route. `providerEnv` is empty, so this is a native
Anthropic-authenticated Remote Control session, not a provider-gateway session.

### Reconciliation (first turn, no mutation)

- `origin/main` unchanged at `01e0960494c95ce56eb35892c211a095eb13e6ed` — equals the immutable
  dispatch base and `milestone-cluster-state.json` `currentMainSha`.
- Leaf #1644 `harness-evidence-and-verdict-tooling`: worktree
  `/home/codex/repos/netscript-007-harness-evidence` clean at
  `4d9fb196765cbf1a6bc7eaa7c18ec82b237ab89f`; matches `dispatch.json` order 1 exactly. PR #1644
  `OPEN` / draft / `MERGEABLE` / `CLEAN`, `headRefOid` matches, base `main`, milestone `0.0.7`,
  labels exactly `type:fix` + `area:tooling` + `status:impl`. `4d9fb1967^` resolves to
  `634b257ea1afcedb2d7f1da486d8c9e9432a2a86`, the acceptance-complete implementation parent named in
  the dispatch entry. All three final receipts (`check`, `test`, `quality-job`) are `PASS`/exit 0
  and record `gitHead` `634b257ea1af…` as designed. Authorized diff versus base contains exactly the
  nine approved source/skill/workflow surfaces plus this leaf's run artifacts — no tenth surface.
  Blocked only on the fresh separate IMPL-EVAL. No drift.
- Leaf #1653 `quality-scan-allowance-rail`: worktree `/home/codex/repos/netscript-007-quality-rail`
  clean at `09dfb092dccf7f843b9270295047d674a8187362`; matches `dispatch.json` order 4 exactly. PR
  #1653 `OPEN` / draft / `MERGEABLE` / `CLEAN`, `headRefOid` matches, milestone `0.0.7`, status
  `status:plan-eval`. The coordinator resolved all four prior `FAIL_PLAN` blockers on
  2026-08-13T23:53Z (#1276 T3 owns all seven allowances, #1545 reconciled to the measured seven,
  #1655 owns the Workers 20-diagnostic repair in 0.0.8, coupled surfaces authorized); the earlier
  Minimax verdict is advisory only. No drift.
- CI on both PRs reports every check `SKIPPED`. This is the designed draft lane, not a red gate:
  `.github/workflows/ci.yml` guards `check-test`, `quality`, `close-gate`, `surface-diff`, and the
  scaffold jobs on `github.event.pull_request.draft == false`. CI is therefore **not** an evidence
  source at either head; the structured receipts are.
- Process audit: no process anywhere on the host has a leaf worktree as its cwd — no rival
  implementer, evaluator, or watcher in `netscript-007-harness-evidence` or
  `netscript-007-quality-rail`. Exactly four Claude topic controllers are live, one per topic
  worktree (`docs` `fcf04b0f`, `fixes` `c7597d28`, `internals` `f7691917`, `features` `19621a0b`).
- Global singleton evaluator lease is free: all six leaves in `milestone-cluster-state.json` carry
  `evaluatorAgentId: null`; `expensiveGates` is empty; `releaseWriters` is empty; release captain is
  `inactive`.
- Central state records this lane's controller as `state: pending_attachment`. Updating it is
  coordinator-owned; this receipt is reported upstream rather than written into central state.
- The order-1 IMPL-EVAL handoff is prepared and **not launched**, pending the coordinator's explicit
  singleton evaluator lease grant.

### Order-1 handoff readiness (prepared, not launched)

| Field                 | Value                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------- |
| Leaf                  | #1644 `harness-evidence-and-verdict-tooling`                                              |
| Phase                 | IMPL-EVAL, fresh separate session                                                         |
| Authoritative brief   | `briefs/reset-gates/harness-evidence-and-verdict-tooling.md` (post-reset)                 |
| Route                 | native Claude, `claude-opus-5`, effort `medium`, `/remote-control` enabled                |
| Worktree              | `/home/codex/repos/netscript-007-harness-evidence`                                        |
| Source head to verify | `4d9fb196765cbf1a6bc7eaa7c18ec82b237ab89f`                                                |
| Implementation parent | `634b257ea1afcedb2d7f1da486d8c9e9432a2a86`                                                |
| Output                | `slices/harness-evidence-and-verdict-tooling/evaluate.md`, one verdict                    |
| Post-conditions       | PR stays draft at `status:impl`; no merge, relabel, ready flip, or central-state mutation |

The leaf-local `impl-eval-request.md` still binds Fable 5 medium (pre-reset). The reset dispatch
supersedes it with Opus 5 medium; the reset-gate brief is the launch authority and the leaf artifact
is read for target/scope/obligations only.

## Coordinator decisions — status as of 2026-08-15T16:38:58Z

Six decisions were raised on 2026-08-15T15:12:56Z. The coordinator resolved **2 through 6** on
2026-08-15T16:38:58Z. **Decision 1 remains open and is owner-only.**

| #   | Decision                                                                         | Leaf                            | Status                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Owner exception** for one final PLAN-EVAL cycle                                | #1663 `package-gate-honesty`    | **OPEN — owner-only.** Cycle 2 of 2 spent; central state reads `owner_exception_required_for_one_final_cycle_after_two_failures`. Tier-A PASS at `194e22a3d`. The leaf is parked at that immutable head; this lane must not relaunch, resume, mutate, or re-review it. |
| 2   | **Bounded tenth path**, test-only: `.llm/tools/docs/check-exports-drift_test.ts` | #1666 `reference-export-drift-gate` | **AUTHORIZED**, test-only, because persistent fail-closed refusal coverage is load-bearing. Scope/plan amended as **SA-1** and pushed before implementation.                                                                     |
| 3   | **`fresh-browser` waiver / `n/a`**                                               | #1666                           | **N/A / WAIVED.** The verified plan changes checker/docs/JSDoc/task/workflow wiring only — no route, component, island, or interaction behavior. `NOT_RUN` evidence is preserved and **no runtime lease is acquired**.               |
| 4   | **PLAN-EVAL cycle 1 grant + evaluator lease**                                    | #1666                           | **GRANTED**, exactly one fresh cycle, **after** the SA-1 amendment receives fresh Tier-A, over the amended immutable head. Route: native **Fable 5 / medium / Remote Control**, separate session, **artifact-only**.                  |
| 5   | **L-2 scope call**                                                               | none yet                        | **DEFERRED until #1663 is terminal** — L-2 overlaps that leaf's `deno.json` / lint-wrapper surface. It does **not** block #1666.                                                                                                     |
| 6   | **Wave-3 sequencing**                                                            | #1533 vs #1666                  | **#1666 sequences BEFORE #1533**, so the new example-compiler gate does not knowingly land red on the already-identified `paginated-query` JSDoc.                                                                                    |

### Outcome of decision 4 — PLAN-EVAL cycle 1 returned `FAIL_PLAN`

Cycle 1 of 2 ran at `2026-08-15T16:52Z` over the amended head `a3f6b87b5` and returned
**`FAIL_PLAN`** with one blocking finding, B1. The evaluator behaved as briefed: artifact-only
(`5d229e0f3` adds `plan-eval.md` and nothing else), pushed, PR left draft at `status:plan`,
`fresh-browser` left `NOT_RUN`, no runtime lease. **Cycle 1 is spent; cycle 2 is unlaunched.**

B1, re-derived independently by this lane and confirmed: three shipped Contracts JSDoc examples
beyond the one in scope import from a non-exporting root — `transform-helpers.ts:6`,
`schemas/filters.ts:6`, `schemas/pagination.ts:6`. All four defective files are in the publish set.
The plan records acceptance row 1 as baseline-satisfied apart from one file, which is false, and it
locks `Closes #1296`.

### Open decisions

| #   | Decision                                                                | Leaf                            | Why it blocks                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Owner exception** for one final PLAN-EVAL cycle                       | #1663 `package-gate-honesty`    | **Owner-only**, unchanged. Parked at immutable `194e22a3d`.                                                                                                                                                                                                       |
| 7   | **Scope call on B1** — (a) JSDoc-only amendment for the three additional files, or (b) keep the frozen surface, record row 1 unmet, and drop `Closes #1296` in favour of a referenced follow-up | #1666 | This lane has no scope authority, and the closing keyword governs whether merging auto-closes an issue whose row 1 is still unmet in three published files. Either branch also requires correcting SA-1 A4: #1533's gate would go red on **four** files, not one. |
| 8   | **PLAN-EVAL cycle 2 grant**                                             | #1666                           | Contingent on 7. Re-running the evaluator against an unchanged scope would only reproduce B1 and spend the last cycle for nothing, so cycle 2 stays unlaunched until 7 is answered.                                                                                |

On a later PLAN-EVAL `PASS`, the **preserved original Codex author** is resumed through the plan's
serial slices, each followed by a fresh Tier-A gate. A `FAIL_PLAN` is reported as such, not worked
around.

Queued behind the WIP limit: wave 3 `jsdoc-example-compile-gate` (#1533) and
`leak-check-process-descendants` (#1429); wave 4 `fresh-defer-test-capability` (#1557/#1601).


## HANDOFF — low-credit checkpoint (2026-08-15T19:10:48Z)

### State at pause

| Item | Value |
| ---- | ----- |
| Topic branch head | `72040679859cfff4ff8fc98b67e5e0a35f09d380` — clean, pushed, local == remote |
| Leaf #1666 head | `010da98a230503bb27b46eb0edc5e979929f7fb1` — clean, local == remote == PR |
| #1666 implementation head | `4238670173271bca4281eba7db6c2030d046bc73` (test-only F1 repair) |
| #1666 evidence head | `010da98a230503bb27b46eb0edc5e979929f7fb1` (artifacts-only) |
| #1666 PR | OPEN, **draft**, `status:impl`, milestone `0.0.7`, `Closes #1296`, MERGEABLE |
| #1663 | **parked untouched** at `194e22a3d`, owner-only exceptional-third-PLAN-EVAL boundary |
| L-2 | deferred, undecided (root lint drops ~1,027 files incl. 700 in published `packages/cli`) |
| Wave 3 | queued behind `activeImplementationSlicesPerLane: 2` |
| Runtime lease | none held; `fresh-browser` N/A / waived, `NOT_RUN` |

### IN FLIGHT — do not relaunch, attach to it

**IMPL-EVAL cycle 2 for #1666 is live and mid-evaluation.** It was deliberately left running: it is
doing legitimate work, and killing it would waste the cycle and risk being miscounted as a consumed
evaluation.

| Field | Value |
| ----- | ----- |
| Job | `7a3b4645` |
| Session | `7a3b4645-5548-42e6-84fa-35c1f90158dd` |
| PID | `519433` (cwd = `/home/codex/repos/netscript-007-reference-export`) |
| Bridge | `cse_01MDMbe68iYvjHBLuUGKZqBS`, `bridgeOutboundOnly: false` |
| Remote Control | https://claude.ai/code/session_01MDMbe68iYvjHBLuUGKZqBS |
| Route | native `claude-fable-5` / effort `medium` / `--remote-control`, `providerEnv` empty |
| Evaluating | implementation `423867017`, evidence `010da98a2` |
| Scope | artifact-only: may write `impl-eval.md` (+ preserve `impl-eval-cycle-1.md`) and post one comment |
| Cycle | 2 — cycle 1 returned `FAIL_FIX` at `4c09e9203` |

### First recovery action

1. Read `~/.claude/jobs/7a3b4645/state.json`. If `state` is still `working`, **wait** — do not
   relaunch and do not start a replacement evaluator; a duplicate on one head is the failure this
   lane has already had to unwind once.
2. If terminal, confirm token stability across ~3 samples before acting, then verify its boundary:
   the commit must touch only `impl-eval.md` (+ `impl-eval-cycle-1.md`) and the diff versus
   `423867017` outside `.llm/runs/` must be empty.
3. On **PASS** — return exact verdict commit + comment URL to the coordinator for IMPL-EVAL closure;
   do **not** merge, flip ready, or check acceptance boxes (coordinator-owned at `ready-merge`).
   Note the close-gate mapping: issue #1296 has **five** acceptance boxes while the plan's live table
   folds the first two together.
4. On **FAIL_FIX** — return the same Codex author, thread `01a005d2-7c9d-7dd1-b6fc-531b72dc14e4`,
   for a bounded repair. Serialize: confirm no sender/codex holds the worktree first, then check the
   resume output for `thread-store conflict` rather than assuming delivery.
5. Release the evaluator session (`claude stop 7a3b4645`) once its verdict is pushed.

### Standing constraints still in force

No merge, publish, ready-flip, issue close, milestone change, central-cluster-state mutation, or
release-writer lease. No Aspire/Docker/browser/`e2e:cli`/scaffold-runtime. Launch background Claude
agents with **`--bg`** so the lease is recordable — `--remote-control` alone yields an interactive
session with no job entry. Keep mutation/archive scratch **out of** `.llm/tmp/` or clean it
explicitly: a source tarball there reintroduces forbidden command strings into the corpus scanned by
`forbidden-commands_test.ts`.

## 2026-08-31 — supervisor rotation r3 (replacement for cleanly exited r2)

Ownership unchanged: `topic-internals-0.0.7`. No thread relaunched; every live leaf/evaluator
thread recorded in `HANDOFF-CHECKPOINT.md` was **adopted**, not recreated.

| Field                   | Value                                                             |
| ----------------------- | ----------------------------------------------------------------- |
| Claude session ID       | `c031e37f-c17f-4509-be74-ff4ef6476f5f`                            |
| tmux session            | `netscript-007-internals-r3`                                      |
| Remote Control session  | `session_01YVWX2PRQ1DKgri3CQHsnUq`                                |
| Route                   | `claude-opus-5`, effort `high` (topic-orchestrator floor met)     |
| Worktree                | `/home/agent/projects/netscript/worktrees/007-internals`          |
| Topic branch head       | `b8ac25ddeaddf06599004f647a7401a3e1ce39f6`                        |
| `origin/main` at resume | `eaea940bea4c19593b97b9895b09f512039f4e13`                        |
| Authority               | Internals lane only; no merge, release, or central-state mutation |

### Reconciliation at resume (Git authoritative, no mutation)

- `origin/main` = `eaea940bea4c19593b97b9895b09f512039f4e13` — **unchanged** from the checkpoint base.
- **#1828 / leaf 1827** — remote head `1c08b8b0afe74c479bd0770c956204e7cad3a5bd` matches the
  checkpoint exactly; PR `OPEN`/draft/`MERGEABLE`/`CLEAN`, base `main`, labels
  `type:fix`+`area:cli`+`area:tooling`+`priority:p0`+`status:impl`+`orchestrator:internals`.
  **IMPL-EVAL pid `1621621` confirmed still live** (`deno task agentic:claude-openrouter
  --model z-ai/glm-5.3-flash --effort max`, cwd `007-eval-1827`). **Adopted, not redispatched.**
- **#1823 / leaf 1753** — remote head `930d37ea4d4d05e42728a3a59618ff4bd1b9b663` matches; PR ready,
  `MERGEABLE`/`CLEAN`, sole `status:ready-merge`. **#1820 is still `OPEN` and `BLOCKED`**, so the
  seam hold stands and no integration is performed.
- **#1802 / leaf 1751** — worktree clean at `de24161b6b5bdee22fd942f6d776358e52eda2cb`, no live
  process. Root-suite diagnosis started (see worklog D-150).
- **#1737 / leaf 1737** — worktree at `d338145da…` with the same 4 dirty files; no process holds the
  worktree as cwd, but the rollout for thread `01a055b6-e5ed-7e62-a47f-c8f278533a96` was last
  written ~6 min before resume, so the resumed author is treated as recently active, not dead.
