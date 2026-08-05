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

## In Progress

- Slice 2: MCP protocol server and native interactive Remote Control lifecycle.

## Next Steps

1. Implement MCP initialize/list/call/cancellation protocol over newline stdio.
2. Implement the native `claude --remote-control` launcher with ephemeral config and cleanup.
3. Run protocol/lifecycle tests and a native bridge plus delegated DeepSeek canary.

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
