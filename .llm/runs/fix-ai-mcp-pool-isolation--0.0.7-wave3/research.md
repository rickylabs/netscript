# Research — fix-ai-mcp-pool-isolation--0.0.7-wave3

## Re-baseline

- Carried-in source: issue #1448 and the coordinator's frozen leaf contract.
- Re-derived against `main` at `284dda90a17a13a7e5e8e9834e5411b58887131b` on 2026-08-15.
- The worktree began exactly at the immutable base. The remote leaf branch did not exist.
- The live issue body remains the acceptance authority and contains nine unchecked acceptance
  criteria, including a committed RED-first test and documentation.

## Red-first reproduction

No source was changed before these commands ran.

### Never-settling first server blocks a healthy peer and ignores pool cancellation

Command: `deno eval --unstable-kv` importing
`packages/ai/src/mcp/application/pool.ts`, with a never-settling first fake transport, a healthy
second fake transport, and an abort after 10 ms.

Observed output (exit code 0):

```json
{"observation":"still-pending-after-abort","healthyConnects":0,"poolState":"connecting","aborted":true}
```

The pool remained pending 60 ms after abort, and the healthy peer was never started.

### A failed first server rejects startup before the healthy peer starts

Command: `deno eval --unstable-kv` importing the same pool, with a rejecting first fake transport
and a healthy second fake transport.

Observed output (exit code 0):

```json
{"outcome":"rejected:unavailable","healthyConnects":0,"poolState":"connecting"}
```

The failure escaped immediately, the healthy peer was never connected, and aggregate state was
left at `connecting`.

### Default TanStack connector does not settle when aborted during connect

Command: `timeout 3s deno eval --unstable-kv` importing
`packages/ai/src/mcp/adapters/tanstack-connector.ts`, using a fetch implementation that never
settles, and aborting after 10 ms.

Observed output (raw exit code 124):

```text
connector-repro:start
connector-repro:aborted
```

There was no `connector-repro:settled` line before the outer 3-second timeout killed the process.
This proves the caller signal is accepted at the NetScript connector boundary but does not
interrupt the pending TanStack connection.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `McpTransportPool.#collectTools` awaits transports in a `for` loop and clears all routes before the first await. | `packages/ai/src/mcp/application/pool.ts` |
| 2 | A rejection escapes `connect()` and leaves aggregate state at `connecting`; a never-settling transport prevents later transports from starting. | Red-first outputs above |
| 3 | The default connector ignores its connector-operation options during `createMCPClient`, and only checks operation signals before `client.tools()` / `client.callTool()`. | `packages/ai/src/mcp/adapters/tanstack-connector.ts` |
| 4 | `registerMcpTools` calls `listTools()` with no options and explicitly calls `callTool(..., { signal: undefined })`. | `packages/ai/src/mcp/application/register-tools.ts` |
| 5 | Resource-read and cancellable-close operations do not exist on `McpClientConnection` or `McpTransportPort`; implementing those acceptance criteria requires changes to `packages/ai/src/ports/mcp-transport.ts` and lifecycle handling in `packages/ai/src/mcp/adapters/base-transport.ts`. | `deno doc packages/ai/mcp.ts`; source inspection |
| 6 | The acceptance-mandated RED test belongs in existing `packages/ai/tests/mcp_test.ts`, and optional/degraded usage documentation belongs in `packages/ai/README.md` and/or `packages/ai/mcp.ts`; all are outside the frozen three-file source surface. | live issue #1448; repository search |
| 7 | New named pool status types would also need the public `./mcp` entrypoint export list updated if introduced as public declarations. | `packages/ai/mcp.ts` explicit exports |

## jsr-audit surface scan

- Publishable member: `@netscript/ai`, export `./mcp` (`packages/ai/mcp.ts`).
- `deno doc packages/ai/mcp.ts` confirms the existing pool and registration surface.
- `deno doc --filter createMcpTransportPool packages/ai/mcp.ts` and
  `deno doc --filter registerMcpTools packages/ai/mcp.ts` were run before broad source reads.
- The three frozen source files contain no `@netscript/*` imports, so there are no internal pins to
  audit in those files.
- The three frozen source files contain no runtime asset reads, `import.meta`, `fromFileUrl`, or
  import attributes.
- `deno doc npm:@tanstack/ai-mcp@0.2.1` confirms upstream exposes `readResource`, but the NetScript
  connection/transport ports do not currently carry that operation. It also emitted an upstream
  missing-declaration warning for `@modelcontextprotocol/sdk` while still rendering the API.
- No publish dry run was run because the frozen contract cannot express the full fix and this run
  stopped before implementation.

## Open questions

- Will the coordinator amend the writable surface to include at minimum
  `packages/ai/tests/mcp_test.ts`, `packages/ai/src/ports/mcp-transport.ts`,
  `packages/ai/src/mcp/adapters/base-transport.ts`, and the MCP documentation/entrypoint surface?
- After amendment, should per-server degraded/error status extend the existing public lifecycle
  vocabulary or be a pool-owned snapshot type? That is a public-surface decision requiring
  coordinator approval and likely PLAN-EVAL.

## 2026-08-15 — Committed RED regression after scope amendment

Command:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --filter "McpTransportPool isolates a never-settling server during startup" packages/ai/tests/mcp_test.ts
```

Observed structured verdict: raw exit code `1`; `0` passed, `1` failed. The failure was
`TimeoutError: The operation was aborted due to timeout` at the pool connect await. With the
never-settling transport first, the healthy transport was not reached. This is the committed RED
test required by the amendment; implementation had not begun.
