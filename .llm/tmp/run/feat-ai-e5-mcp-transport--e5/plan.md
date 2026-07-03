# Plan: `@netscript/ai/mcp` transport slice

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-ai-e5-mcp-transport--e5` |
| Branch | `feat/ai-e5-mcp-transport` |
| Phase | `plan` |
| Target | `packages/ai` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Archetype

Archetype 2 applies because the slice wraps an external MCP client package and MCP servers behind package-owned ports/adapters. F-13 is explicitly in scope because the issue requires lifecycle, reconnect, and `AbortSignal` behavior.

## Current Doctrine Verdict

`@netscript/ai` is newer than the doctrine package verdict table. Apply Archetype 2 rules for the new MCP adapter subpath and preserve the existing E1/E4 layering.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | Public MCP types and auth/state unions come before adapter internals. |
| A8 | Implementation lives under role folders: `ports`, `adapters`, and `application`. |
| A10 | Defaults and transport selection are wired by factory/config, not hidden globals. |
| A12/A13 | Reconnect lifecycle and failure transitions are explicit. |
| A14 | Tests and publish gates prove the contract. |

## Goal

Add `@netscript/ai/mcp` with stdio and reconnectable Streamable-HTTP MCP transports, injected auth modes, lifecycle state, and registry wiring that registers remote tools on connect and removes them on disconnect.

## Scope

- Add `packages/ai/mcp.ts` and implementation under `packages/ai/src/mcp/`.
- Extend the existing MCP port contract in `packages/ai/src/ports/mcp-transport.ts`.
- Add `unregister` to `ToolRegistryPort` so disconnect can remove remote tools.
- Add tests for selection, auth, reconnect, and registry add/remove.
- Add `@tanstack/ai-mcp` dependency and `./mcp` export.

## Non-Scope

- OTel spans/tracing, Fresh UI integration, orchestration strategies, real external MCP server E2E.

## Hidden Scope

- Avoid upstream `.d.ts` leakage by keeping NetScript-owned public types and using a small dynamic import bridge internally.
- Preserve lock hygiene while updating only dependency entries required by the new import.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Exact-pin `@tanstack/ai-mcp@0.2.1`. | It is npm latest and depends on the existing `@tanstack/ai@0.39.0`; `0.15.13` does not exist. |
| D2 | Make registry removal a required `ToolRegistryPort.unregister(name)` method. | The issue requires de-registration on disconnect and the port otherwise cannot express that behavior. |
| D3 | Keep public MCP types in `src/ports/mcp-transport.ts`; adapter implementation under `src/mcp/adapters/`. | Matches existing E1/E4 layering and keeps subpath export curated. |
| D4 | Use injected auth config only: none, api-token, oauth bearer token/provider. | Prevents hardcoded secret handling and keeps credentials at composition. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Upstream MCP package version | resolved | Use `0.2.1`; drift logged. |
| Registry removal shape | resolved | Add `unregister`. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Upstream type resolution fails JSR checks. | Do not expose upstream types; isolate dynamic import bridge. |
| Reconnect duplicates tool registration. | Track surfaced tool names and unregister before replacing a connection. |
| AbortSignal does not stop retry waits. | Centralize abort-aware sleep and stop controller. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-3 | risk | Keep MCP port small: connect/list/call/stop/state/subscribe. |
| AP-8 | risk | Use constructor options and simple factories, no DI container. |
| AP-11 | risk | No env reads or module-load clients. |
| AP-13 | risk | No console logging. |
| AP-14 | risk | Do not re-export upstream MCP package types. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-3 | yes | Manual layering read + package check. |
| F-5 | yes | `deno doc --lint packages/ai/mcp.ts`; max exports under 20. |
| F-6 | yes | `deno task publish:dry-run` from `packages/ai` without `--allow-slow-types`. |
| F-13 | yes | Unit tests for stop, abort, reconnect, and no duplicate tools. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| none | none | No accepted doctrine debt planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | package check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --ext ts` | PASS |
| 2 | package lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/ai --ext ts` | PASS |
| 3 | package fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/ai --ext ts` | PASS |
| 4 | package tests | `deno test --allow-all packages/ai/tests` | PASS |
| 5 | publish | `cd packages/ai && deno task publish:dry-run` | PASS |
| 6 | root gates | `rtk proxy deno task fmt:check`, `rtk proxy deno task lint`, `rtk proxy deno task check` | PASS |

## Drift Watch

- Upstream package version or type-resolution constraints change.
- Existing root gates fail for unrelated workspace drift.
