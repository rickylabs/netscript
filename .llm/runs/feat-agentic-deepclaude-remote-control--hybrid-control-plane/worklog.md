# Worklog: hybrid Claude Remote Control

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-agentic-deepclaude-remote-control--hybrid-control-plane` |
| Branch | `feat/agentic-deepclaude-remote-control` |
| Archetype | N/A — internal tooling |
| Scope overlays | docs |

## Design

### Public Surface

- `deno task agentic:claude-hybrid -- --cwd <path> [--model <approved-id>]`
- MCP tool `delegate_openrouter({ task, context?, model?, effort? })`

### Domain Vocabulary

- `HybridDelegationRequest` / `HybridDelegationResult` — bounded worker contract.
- `HybridModelPolicy` — approved model and effort mapping.
- `HybridWorkerPort` — cancellable worker execution seam.
- `HybridLaunchEvidence` — native bridge and delegated model identity evidence.

### Ports

- `HybridWorkerPort` — isolates OpenCode process execution for tests and cancellation.
- `TemporaryConfigPort` — makes ephemeral MCP configuration lifecycle testable.
- Existing OpenRouter credential resolver — provider secret boundary.

### Constants

- Model IDs and endpoints remain in `.llm/tools/agentic/config/`.
- Request/result byte limits, timeout, concurrency, MCP tool name, and exit codes are named once in
  the hybrid contract module.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bounded delegation contract and OpenCode adapter | Focused tests + scoped static wrappers | hybrid delegation modules/tests, config, run artifacts |
| 2 | MCP protocol and native Remote Control lifecycle | Protocol/lifecycle tests + live canary | MCP server, launcher, tests, task, run artifacts |
| 3 | Docs, mirror, regressions, formal evaluation | All agentic/docs gates + IMPL-EVAL | README, skills, run artifacts |

### Deferred Scope

- Transparent model interception, progress streaming, persistent cost accounting, arbitrary
  providers, and zero-Claude-quota operation.

### Contributor Path

Add an approved model in centralized config, map it in the hybrid model policy, add adapter and
protocol tests, then run the documented canary; never add credentials or endpoints to the launcher.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-05 | Plan | Research | Confirmed no official version overlap for custom gateway + Remote Control. |
| 2026-08-05 | Plan-Gate | Evaluation | OpenCode/Minimax separate session returned `PASS`; Qwen transport failures recorded in drift. |

## Gate Results

All implementation gates are `NOT_RUN`; PLAN-EVAL is the hard stop.

## Handoff Notes

- PLAN-EVAL should first challenge D1–D7 and the claim that MCP delegation is the only supported,
  production-grade seam under current Claude behavior.
