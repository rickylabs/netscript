# Plan: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Phase | `plan` — amended contract re-locked; implementation unblocked |
| Target | `packages/ai` MCP integration surface |
| Archetype | `2 — Integration` (coordinator-frozen leaf profile) |
| Scope overlays | `none` |

## Archetype

The leaf wraps TanStack MCP behind NetScript-owned connection and transport ports, so the
coordinator selected Archetype 2. The package-wide doctrine table classifies `packages/ai` as
Archetype 4; this run follows the narrower, explicit leaf contract and records the difference.

## Current Doctrine Verdict

`packages/ai`: **Keep** — preserve the engine/port/composition split.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Per-server status and cancellation are published consumer contracts. |
| A7 | Cancellation should use `AbortSignal`, not a bespoke token. |
| A10 | Pool construction remains explicit composition over caller-owned transports. |
| A13 | One MCP server must be an explicit crash boundary, not a pool-wide failure. |
| A14 | Red-first regression coverage and publish gates must prove the contract. |

## Goal

Make optional MCP infrastructure failure-isolated and cancellation-aware while preserving healthy
peers and exposing immediate per-server status. The coordinator's committed scope ruling now
authorizes the complete implementation surface.

## Scope

- Amended writable package files (exactly eight):
  - `packages/ai/src/mcp/adapters/tanstack-connector.ts`
  - `packages/ai/src/mcp/application/pool.ts`
  - `packages/ai/src/mcp/application/register-tools.ts`
  - `packages/ai/tests/mcp_test.ts`
  - `packages/ai/src/ports/mcp-transport.ts`
  - `packages/ai/src/mcp/adapters/base-transport.ts`
  - `packages/ai/mcp.ts`
  - `packages/ai/README.md`
- Harness run artifacts under this run directory.

## Non-Scope

- No Aspire, Docker, browser, CLI E2E, or scaffold runtime gates without a fresh lease.
- No changes outside the amended eight package files without a further coordinator amendment.
- No new `packages/ai/deno.json` export; reuse the published `./mcp` entrypoint.
- No EIS-Chat consumer-side implementation or changes to another package's ports/adapters/docs.

## Hidden Scope

- None after the committed amendment. Any newly discovered required file is drift and an immediate
  stop boundary.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Stop before implementation and request a surface amendment. | The user explicitly forbids inferring authority outside the three files. |
| D2 | Do not use `Closes #1448` on the blocked draft PR. | This bootstrap does not fully resolve the live issue. |
| D3 | Preserve per-server identity and use Web Platform cancellation after amendment. | Archetype 2 and doctrine A7/A13. |
| D4 | Expose a synchronous, I/O-free readonly snapshot keyed by `serverId`, with `McpConnectionState`, `lastError`, and ready clients. | Scope ruling criteria 3 and 8; additive published contract. |
| D5 | Reuse an options bag carrying `signal` for resource-read and close/stop operations. | Scope ruling; mirrors `McpConnectOptions`. |
| D6 | Settle startup and stop independently per server, retaining failures and closing late successes. | Scope ruling criteria 2–5. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact public degraded/error snapshot shape | resolved | Synchronous readonly server map plus ready clients; reuse `McpConnectionState`. |
| Whether `close`/`stop` gains caller options or cancellation remains internal | resolved | Options bag with `signal`, matching `McpConnectOptions`. |
| Exact amended test/docs/port surface | resolved | Eight package files enumerated in `scope-ruling.md`. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Partial implementation appears to satisfy #1448 | Stop now; use a non-closing issue reference and record remaining acceptance. |
| Late TanStack success leaks a session | Require a regression test and lifecycle/base-transport amendment before implementation. |
| New public types fail isolated declarations or are not exported | Include `packages/ai/mcp.ts`, doc lint, JSR audit, and publish dry run in amended scope. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Avoid a generic flag-heavy cancellation helper. |
| AP-10 | risk | Isolate expected per-server failure without swallowing status/error evidence. |
| AP-19 | risk | Document network/cancellation behavior in the public MCP usage surface. |
| AP-25 | risk | Keep TanStack/network effects in the adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5/F-6/F-7/F-10/F-19 and Archetype-2 matrix | yes | structured wrappers, doc lint, JSR audit, publish dry run, arch check |
| Code quality | yes | `deno task quality:scan` and `deno task arch:check` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| none | none yet | No implementation or new debt landed. |

## Validation Plan

The proving gates are `check`, `test`, `publish-dry-run`, and `arch-check`, plus scoped lint/fmt,
`quality:scan`, `deno doc --lint packages/ai/mcp.ts`, and the package JSR audit. Targeted workspace
checks use `--unstable-kv`; structured wrappers are the verdict source for check/test/lint/fmt.

## Implementation Slices

1. Commit the focused RED regression: one healthy server and one never-settling server.
2. Make pool startup/reconnect independently settled and add the synchronous public snapshot.
3. Plumb cancellation through resource reads and close/stop, including late-success cleanup.
4. Propagate registration cancellation without changing existing call sites.
5. Document optional/degraded usage and run the complete proving gate set.

## PLAN-EVAL Decision

`PLAN-EVAL: N/A`. The amended contract is now complete and mechanical: it fixes the exact writable
surface, public snapshot semantics, existing lifecycle vocabulary, cancellation convention,
per-server settlement behavior, public entrypoint, documentation requirement, and gate set. No
architectural or product decision remains for a separate evaluator. This does not waive the later
Tier-A review or opposite-family IMPL-EVAL.

## Drift Watch

- Any required edit beyond the amended eight package files is new drift and an immediate stop.
