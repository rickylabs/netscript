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
