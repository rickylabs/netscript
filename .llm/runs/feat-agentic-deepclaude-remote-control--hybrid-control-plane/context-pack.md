# Context Pack: hybrid Claude Remote Control

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-agentic-deepclaude-remote-control--hybrid-control-plane` |
| Branch | `feat/agentic-deepclaude-remote-control` |
| Current phase | `implement` |
| Archetype | N/A — internal tooling |
| Scope overlays | docs |

## Current State

PR #1314 is merged. This new branch researches a safe DeepClaude-style workaround. Current Claude
cannot combine a custom model endpoint with Remote Control, and older gateway-compatible versions
cannot run Remote Control. The plan therefore keeps native Remote Control and delegates bounded
tasks to credential-isolated OpenRouter workers.

## Completed

- Official compatibility boundary and upstream DeepClaude source inspected.
- Version 2.1.91 live probe confirmed Remote Control minimum-version rejection.
- Plan/design locked; no implementation started.
- Separate OpenCode/OpenRouter Minimax PLAN-EVAL passed after two Qwen transport failures.
- Slice 1 implemented the bounded delegation contract and credential-isolated OpenCode adapter.
- DeepSeek is the sole approved worker model and the centralized default; evaluator/design models
  are intentionally excluded from this task lane.
- Focused tests plus the volatile guard pass (18/18), scoped check/lint/fmt have zero findings, and
  `deno.lock` is unchanged.
- Real OpenCode JSON and production-adapter DeepSeek canaries returned exact
  `HYBRID_JSON_SHAPE_OK` and `HYBRID_ADAPTER_OK` sentinels.
- Slice 2 implements a minimal standalone MCP stdio server with cancellation ownership and the
  native interactive Remote Control launcher with credential stripping, mode-0600 ephemeral
  config, bounded process cleanup, and fail-closed session-registry bridge evidence.
- Slice 2 focused protocol/lifecycle plus existing hybrid/volatile tests pass (33/33), including
  a real stdio subprocess under the exact generated permission argv; scoped
  check/lint/fmt are clean and `deno.lock` remains unchanged.
- First live canary found and drove fixes for partial-env access and derived registry names. Bridge
  proof remains exact PID + cwd + non-empty `bridgeSessionId`; the requested CLI label is not a
  registry-name equality invariant in Claude 2.1.222.

## In Progress

- Slice 2 sign-off commit, then coordinated live hybrid Remote Control canary.

## Next Steps

1. Commit/push/comment the reviewed Slice 2.
2. Start one tmux-hosted native hybrid session and prove bridge plus MCP tool availability.
3. Send a mobile-visible delegation prompt and verify the exact DeepSeek sentinel.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Native control plane + delegated OpenRouter execution plane | `plan.md` D1–D3 | No MITM, patch, or global downgrade. |
| Honest hard-zero-quota limitation | `research.md` F8 | Delegation still requires a Claude tool-selection turn. |

## Drift and Debt

- Drift: transparent DeepClaude claim is not reproducible on supported Claude releases.
- Debt: none accepted.

## Commits

- See the draft PR commit list and per-slice comments.
