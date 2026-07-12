# @netscript/mcp

`@netscript/mcp` is the token-bounded MCP engine for NetScript diagnostics, framework-aware
telemetry summaries, public documentation, and controlled CLI actions. S1 provides the complete v1
contract registry, a stdio server, and telemetry reachability diagnostics; later capabilities remain
discoverable as planned tools.

## Public API

- `createToolRegistry()` returns immutable enumerable tool definitions.
- `createMcpServer()` composes the protocol runner with truncation defaults.
- `runMcpStdioServer()` runs the newline-delimited JSON-RPC stdio transport.
- Standard-Schema input and output contracts are exported for every v1 tool.

```ts
import { createToolRegistry } from '@netscript/mcp';

for (const tool of createToolRegistry()) console.log(tool.name, tool.kind);
```

```ts
import { createMcpServer } from '@netscript/mcp';

const server = createMcpServer({
  probe: { probe: () => Promise.resolve({ reachable: true, message: 'ready' }) },
});
await server.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
```

The CLI, MCP tools, and consumer skills share one vocabulary. Prefer the CLI for direct scripted
operations; use MCP for compact interactive diagnostics and framework-semantic summaries.

## Doctor composition

`doctor` aggregates telemetry reachability, NetScript Aspire markers, project wiring, and plugin
diagnostics. The standalone MCP process uses `@netscript/aspire` directly and reads only project
metadata. Plugin diagnostics are intentionally dependency-inverted: MCP does not import or duplicate
`@netscript/cli`; the S7 CLI composition supplies its typed plugin-doctor adapter. Until then, the
standalone plugin family returns a visible warning rather than claiming success.

## Data boundary

The server may read telemetry, NetScript project metadata, and public documentation. It never
returns source code, environment-variable values, credentials, or secrets. Stdio is process-local;
outbound telemetry probes use the resolved endpoint only.

## Permissions

The executable needs environment access to resolve `NETSCRIPT_TELEMETRY_ENDPOINT`, network access to
probe that HTTP endpoint, and read access for NetScript project metadata (`deno.json`,
`netscript.config.ts`, generated registries, docs, and Aspire markers). Tests additionally need
run/read permissions for the spawned stdio smoke.

## Transport and dependency decision

The current MCP stdio transport is UTF-8 newline-delimited JSON-RPC. S1 implements only
`initialize`, `tools/list`, and `tools/call`, so it intentionally uses a minimal zero-dependency
transport instead of the npm MCP SDK. This keeps the published graph and lockfile stable.

## Archetype 6 v2 deviations

The owner-approved S1 skeleton uses the horizontal
`domain → application → presentation/infrastructure` layout from the package design instead of the
newer kernel/vertical CLI feature tree. The package has no Cliffy command tree, templates, output
renderer, extension axes, or public/maintainer split yet, so creating those seams would be
speculative. Debt `MCP-A6-V2-SHAPE` requires reassessment when the real CLI surface is integrated.
