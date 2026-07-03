# Worklog: `@netscript/ai/mcp` transport slice

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-ai-e5-mcp-transport--e5` |
| Branch | `feat/ai-e5-mcp-transport` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- `packages/ai/mcp.ts` — `@netscript/ai/mcp` subpath.
- `McpTransportPort` — lifecycle-aware MCP transport port.
- `StdioMcpTransport` and `StreamableHttpMcpTransport` — concrete adapter classes.
- `createMcpTransport` — transport selection factory.
- `registerMcpTools` — bridge remote tools into `ToolRegistryPort`.

### Domain Vocabulary

- `McpAuthMode` — `"none" | "api-token" | "oauth"`.
- `McpConnectionState` — `"disconnected" | "connecting" | "connected" | "reconnecting" | "closed"`.
- `McpTransportKind` — `"stdio" | "streamable-http"`.
- `McpToolDescriptor` — tool descriptor tagged with MCP server/source metadata.

### Ports

- `McpTransportPort` — package-owned seam for MCP connect, discovery, invocation, state, events, and stop.
- `ToolRegistryPort.unregister` — required for disconnect de-registration.

### Constants

- `MCP_CONNECTION_STATES` — lifecycle states.
- `MCP_AUTH_MODES` — supported auth modes.
- `MCP_TRANSPORT_KINDS` — supported transports.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Contract and exports | targeted check | `packages/ai/src/ports/*`, `packages/ai/mcp.ts`, `packages/ai/deno.json` |
| 2 | Transports and registry wiring | targeted tests | `packages/ai/src/mcp/**` |
| 3 | Unit tests and gate evidence | package/root validation | `packages/ai/tests/*`, run artifacts |

### Deferred Scope

- OTel spans and Fresh UI wiring — owned by later AI-stack issues.
- Real MCP server integration — unit tests use fake connector/fetch surfaces for deterministic behavior.

### Contributor Path

To add another transport, add a sibling adapter under `src/mcp/adapters/`, extend `MCP_TRANSPORT_KINDS`, then add a factory branch and a transport-selection test.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-03T04:02:58Z | setup | research/plan | Loaded harness/doctrine/tooling skills, issue body, current AI package, and TanStack MCP surface. |
| 2026-07-03T04:20:00Z | 1-3 | implementation | Added lifecycle MCP port, stdio/HTTP adapters, registry wiring, `./mcp` export, dependency pin, and unit tests. |
| 2026-07-03T04:33:00Z | gate | validation | Package wrappers, package tests, doc-lint, publish dry-run, and root fmt/lint/check passed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Use `@tanstack/ai-mcp@0.2.1` | Latest stable and only version compatible by existence; depends on `@tanstack/ai@0.39.0`. | npm metadata |
| Extend `ToolRegistryPort` with `unregister` | Required to satisfy disconnect de-registration. | issue #244 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| `@tanstack/ai-mcp@0.15.13` does not exist; using `0.2.1`. | minor | yes |
| Separate PLAN-EVAL is not available in this implementation-agent turn; proceeding per user delivery request. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| package check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --ext ts` | PASS | 61 files, 0 failures. |
| package lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/ai --ext ts` | PASS | 61 files, 0 lint findings. |
| package fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/ai --ext ts` | PASS | 61 files, 0 formatting findings. |
| package tests | `deno test --allow-all packages/ai/tests` | PASS | 45 passed, 0 failed. |
| doc lint | `deno doc --lint packages/ai/mcp.ts` | PASS | Checked 1 file. |
| publish dry-run | `cd packages/ai && deno task publish:dry-run` | PASS | Succeeded without `--allow-slow-types`; warnings only for intentionally unanalyzable dynamic imports. |
| root fmt | `rtk proxy deno task fmt:check` | PASS | 1588 files, 0 findings. |
| root lint | `rtk proxy deno task lint` | PASS | 1464 files, 0 findings. |
| root check | `rtk proxy deno task check` | PASS | 2001 files, 17 batches, 0 failures. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-3 | PASS | MCP implementation imports ports/contracts and external TanStack bridge only from adapter files; no reverse imports from application into domain. | Manual import inspection plus package check. |
| F-5 | PASS | `mcp.ts` has `@module`; `deno doc --lint packages/ai/mcp.ts` passed; `./mcp` barrel exports 20 symbols. | Export count held to the F-5 limit. |
| F-6 | PASS | `cd packages/ai && deno task publish:dry-run` passed. | No `--allow-slow-types`. |
| F-13 | PASS | `packages/ai/tests/mcp_test.ts` covers stop abort, state transitions, reconnect/backoff, and no duplicate resurfaced tools. | AbortSignal is threaded through connect, reconnect waits, list, and call. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| MCP unit behavior | PASS | `deno test --allow-all packages/ai/tests/mcp_test.ts` | 7 passed, 0 failed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| `@netscript/ai` package exports | PASS | package check + package tests + publish dry-run | `./mcp` added to `packages/ai/deno.json`; root check passed. |

## Handoff Notes

- Inspect `packages/ai/src/mcp/` and `packages/ai/src/ports/mcp-transport.ts` first.
