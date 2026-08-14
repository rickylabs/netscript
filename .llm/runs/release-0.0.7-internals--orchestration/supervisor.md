# Supervisor identity — 0.0.7 internals topic

| Field | Value |
| --- | --- |
| Role | `topic-internals-0.0.7` |
| Profile | milestone-cluster topic orchestrator |
| Topic branch | `orchestrator/release-0.0.7-internals` |
| Dispatch base | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Live `origin/main` at reconciliation | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Coordinator plan head | `331f7c664` (`PLAN-EVAL` approved) |
| Coordinator control head at dispatch | `5330285f65242eff639cfc5c7ed68a80740de910` |
| Authority | Internals lane only; no merge, release, publication, scope, or central-state authority |
| WIP | At most two implementers, one evaluator, and no overlap of the global expensive gate |

## Wave 0 route table

| Leaf | Requested implementation route | Opposite-family review/evaluation |
| --- | --- | --- |
| `quality-scan-allowance-rail` | `complex_implementation`: OpenAI Codex GPT-5.6 Sol, high | Claude Fable 5 medium for PLAN-EVAL/formal evaluation and effort-paired substantive review, serialized within the topic evaluator slot |
| `harness-evidence-and-verdict-tooling` | `normal_implementation`: OpenAI Codex GPT-5.6 Sol, medium | Claude Fable 5 low substantive review; formal IMPL-EVAL uses the canonical opposite-family evaluator route, serialized within the topic evaluator slot |

The coordinator remains the sole merge and release authority. Leaf PRs target `main` and remain
draft until coordinator review.

## 2026-08-15 reset — Claude replacement attachment

Replaces the parked legacy Codex topic controller `019ffcc0-e1b5-74f0-96eb-cdeb298d6b17` per
`briefs/topic-claude-reset-common.md`. The legacy thread/branch/worktree/PRs/evidence remain
preserved and untouched; it is never resumed as a topic controller.

| Field | Value |
| --- | --- |
| Claude session ID | `1d02b9ca-196b-4363-b5ec-d6bd5fdf613c` |
| PID | `2402901` |
| cwd | `/home/codex/repos/netscript-007-internals` |
| Requested route | `claude-sonnet-5`, effort `low` |
| Observed argv | `claude --model claude-sonnet-5 --effort low --name topic-internals-0.0.7 --remote-control --permission-mode bypassPermissions` |
| Remote Control | attached; `bridgeSessionId` `session_011m4xHFkn36RbYsSXRpZe1Q` |
| Registry evidence | `~/.claude/sessions/2402901.json`, `status: busy` |

### Reconciliation (first turn, no mutation)

- `origin/main` unchanged at `01e096049` (`4d9fb196…`/`09dfb092…` leaf source heads both build on
  this baseline via their recorded parents).
- Leaf #1644 `harness-evidence-and-verdict-tooling`: worktree
  `/home/codex/repos/netscript-007-harness-evidence` clean at `4d9fb196765cbf1a6bc7eaa7c18ec82b237ab89f`,
  matches `dispatch.json` order 1 exactly. PR #1644 `OPEN`/draft/`MERGEABLE`, `headRefOid` matches.
  Status remains `status:impl`, S1/S2 Tier-A PASS, blocked only on fresh native opposite-family
  IMPL-EVAL. No drift found.
- Leaf #1653 `quality-scan-allowance-rail`: worktree `/home/codex/repos/netscript-007-quality-rail`
  clean at `09dfb092dccf7f843b9270295047d674a8187362`, matches `dispatch.json` order 4 exactly.
  PR #1653 `OPEN`/draft/`MERGEABLE`, `headRefOid` matches. Status `status:plan-eval`; prior
  Minimax `FAIL_PLAN` remains advisory only, does not waive fresh Sonnet 5/medium PLAN-EVAL cycle
  2. No drift found.
- Process audit found no rival topic controller, leaf, evaluator, or watcher attached to either
  internals leaf worktree; only this session's own PID/cwd pair. No overlap of the global
  singleton evaluator lease.
- Per `topic-claude-reset-common.md`, the order-1 IMPL-EVAL (Sonnet 5/medium) handoff is prepared
  but not launched pending the coordinator's explicit singleton evaluator lease grant after this
  attachment receipt is reported upstream.
