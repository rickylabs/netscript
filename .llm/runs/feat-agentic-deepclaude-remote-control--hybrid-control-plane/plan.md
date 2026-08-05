# Plan: native Remote Control with delegated OpenRouter workers

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-agentic-deepclaude-remote-control--hybrid-control-plane` |
| Branch | `feat/agentic-deepclaude-remote-control` |
| Phase | `plan` |
| Target | internal agentic tooling |
| Archetype | N/A — repository-internal operator tooling, shaped by Archetype 6 principles |
| Scope overlays | docs |

## Current Doctrine Verdict

N/A for package doctrine. The implementation follows the repository's contract-first, edge-owned
side-effect, centralized volatile-value, and thin-launcher rules.

## Goal

Provide a production-grade `agentic:claude-hybrid` flow that starts current native Claude Remote
Control with bypass permissions and exposes an explicit, credential-isolated OpenRouter delegation
tool, using DeepSeek V4 Flash 0731 by default while allowing centrally configured approved models.

## Scope

- A small MCP-compatible stdio server exposing one bounded `delegate_openrouter` tool.
- An adapter over the existing OpenCode/OpenRouter runner, with model allow-listing, timeout,
  output-size limits, cancellation, and scrubbed child environment.
- A launcher that starts current native Claude with OAuth Remote Control, bypass permissions, an
  ephemeral MCP config, deterministic cleanup, and no custom Anthropic endpoint.
- Focused protocol, security, lifecycle, and live mobile-attachment/delegation tests.
- Operator docs and Claude-manager skill mirror updates.

## Non-Scope

- Transparent replacement of Claude's `/v1/messages` while Remote Control is active; unsupported
  by current Claude and would require binary patching or TLS interception.
- Running with zero native Claude quota; at least one Claude orchestration turn is required.
- OpenHands evaluation; explicitly excluded by the owner for non-reproducible cloud environments.
- Changes under `packages/**` or `plugins/**`.

## Hidden Scope

- MCP framing and error normalization must never leak API keys or unbounded worker output.
- The ephemeral config must be permission-restricted and removed on every exit/signal path.
- The launcher must distinguish successful bridge attachment from a merely alive process.
- Default model/version/endpoint values remain centralized under agentic config.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Keep `ANTHROPIC_BASE_URL`, API keys, and auth-token overrides out of the Claude process. | Preserves supported OAuth Remote Control and prevents credential crossover. |
| D2 | Delegate through an explicit local MCP stdio tool backed by OpenCode/OpenRouter. | Uses a supported Claude extension seam and existing agentic infrastructure. |
| D3 | Resolve OpenRouter credentials only inside the worker adapter and scrub them from Claude. | Least privilege; the control plane never sees provider secrets. |
| D4 | Use centralized model IDs with DeepSeek V4 Flash 0731 as the default; reject arbitrary model strings unless explicitly configured. | Prevents volatile-value drift and surprise spend/provider routing. |
| D5 | Bound prompt bytes, result bytes, runtime, and concurrent calls; propagate cancellation. | Prevents local denial-of-service and runaway cost. |
| D6 | Fail closed if bridge attachment or worker identity cannot be proven. | Avoids false mobile-visible or wrong-model claims. |
| D7 | Never patch Claude, downgrade the global install, install a CA, or MITM Anthropic TLS. | Security, supportability, and update compatibility. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Add dynamic backend switching | Safe to defer | First version exposes one explicit worker call with per-call approved model selection. |
| Stream worker progress into Remote Control | Safe to defer | MCP result is bounded final output; progress events need a separately designed channel. |
| Persist cost accounting | Safe to defer | OpenRouter remains billing authority; local metrics can follow after correctness. |
| Fully autonomous prompt interception | Safe to defer | Explicit delegation is auditable and avoids pretending Claude can be removed from its own loop. |

## Commit Slices

1. **Delegation contract and worker adapter** — proves bounded, allow-listed, credential-isolated
   OpenCode execution. Gate: focused unit tests + scoped check/lint/fmt. Files:
   `.llm/tools/agentic/claude/hybrid-delegation*.ts`, config, tests, run artifacts.
2. **MCP server and native Remote Control launcher** — proves JSON-RPC protocol, ephemeral config,
   bypass launch, bridge-state evidence, cancellation, and cleanup. Gate: protocol/lifecycle tests
   plus a live native attachment/delegation canary. Files:
   `.llm/tools/agentic/claude/hybrid-mcp-server.ts`, `hybrid-launcher.ts`, tests, `deno.json`, run
   artifacts.
3. **Operator surface and final evidence** — proves documentation, skill mirror, security claims,
   and regression safety. Gate: focused/regression suite, docs links, mirror check, volatile guard,
   formal IMPL-EVAL, GitHub checks. Files: agentic README, Claude-manager skill/mirror, run artifacts.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Reference project creates false confidence in transparent swapping. | Encode the compatibility matrix and reject unsupported transparent mode. |
| MCP input can smuggle huge context or secrets. | Explicit schema, byte limits, redacted diagnostics, no automatic repository dump. |
| Worker hangs or survives launcher exit. | Abort propagation, hard timeout, process-group cleanup, deterministic signal handlers. |
| Claude quota is fully exhausted. | Document the hard limitation before launch; provide direct inference-only fallback command. |
| Model/provider tool-call behavior differs. | Live DeepSeek canary and exact observed identity/result evidence. |
| Ephemeral config leaks. | Mode 0600, per-run temp directory, cleanup on normal exit and signals, tests for leftovers. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static wrappers | Yes | Scoped check/lint/fmt over owned TypeScript. |
| Focused tests | Yes | Contract, JSON-RPC, limits, auth isolation, lifecycle. |
| Volatile-value guard | Yes | Existing no-hardcoded-volatile suite. |
| Runtime canary | Yes | Native bridge attachment plus exact DeepSeek worker sentinel. |
| Provider/routing regressions | Yes | Existing agentic provider/routing suites. |
| Docs/mirror | Yes | Link validation and byte-identical skill mirror. |
| Package fitness / JSR | N/A | No package/plugin/public export changes. |
| Full scaffold E2E | N/A | No scaffold/package/plugin/runtime product surface. |

## Arch-Debt Implications

No accepted architecture debt. Any inability to prove native attachment and delegated model
identity forces rescope/failure rather than a debt waiver.

## Validation Plan

1. Focused Deno tests for new and reused agentic modules.
2. Scoped Deno check, lint, and format wrappers.
3. Existing provider/routing and volatile-value regression suites.
4. Live tmux canary proving bridge attachment and DeepSeek sentinel through the tool.
5. Separate OpenCode/OpenRouter Qwen IMPL-EVAL; Grok 4.5 high adversarial review.
6. Required GitHub checks before ready-for-merge transition.

## Drift Watch

- Claude feature gating/version behavior, MCP CLI flags, OpenCode output protocol, model identity,
  and any request for transparent interception.
