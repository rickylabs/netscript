# Research — baseline 6766130

Issue #2581 is the tracker-designated independent sibling of #2580/#2577. The latter owns
Northwind data and pages; no current PR implements discovery-based AI MCP client configuration.

## Existing seams

- `plugins/ai/src/cli/ai-commands.ts` handles `mcp add/list`; currently exactly one URL or stdio
  command is selected. `ai-project.ts` validates the ID, writes the emitted configuration and
  rebuilds the existing MCP registry. Invalid configuration must be rejected before either write.
- `src/adapter/resources/mcp-server/mcp-server.ts` emits app-owned `McpTransportConfig` values.
  Its registry uses the existing `createMcpTransportPool` and `registerMcpTools` APIs. No new
  MCP client or server framework is needed.
- `deno doc` confirms the AI core owns two transports, stdio and streamable HTTP. Service
  discovery selects the HTTP URL; it does not add a core transport.
- `deno doc` and `packages/sdk/src/discovery/service-url.ts` confirm `getServiceUrl(name,
  protocol, index)` reads Aspire discovery and throws an actionable missing-key error. No
  guessed host/port is needed. The focused public import is `@netscript/sdk/discovery`.
- The generated AI namespace currently declares only Preact. Declare the already-existing SDK
  package at the same release pin there so the emitted config has an explicit dependency.
- Existing HTTP clients use the real TanStack MCP connector. A loopback JSON-RPC MCP fixture
  can exercise the actual transport and tools/list plus tools/call without an external AI provider.
- The scaffold `--mcp` option emits a skill-loader tool. It must stay distinct from app-data
  MCP client configuration.

## Doctrine and publish surface

Current doctrine verdict: AI plugin Keep, thin glue; SDK discovery and AI MCP core remain unchanged.
Archetype 5 with its existing CLI generator seam. No root export or core convention is added.
Planned input types and helpers receive explicit return types/JSDoc. Generated code imports
published subpaths and no local source/runtime asset reads. Existing publish whitelist includes
the generator and excludes tests. Full export doc lint, plugin publish dry-run, generated consumer
typecheck and quality/architecture scans will verify the shape. No accepted new debt.

## Routing availability

Feature plan evaluator GLM 5.3 could not establish allowance: OpenCode Go returns HTTP401;
Ollama and OpenRouter have no supplied usage snapshot. No paid inference was started or
allowance fabricated. Use the matrix-declared Fable 5.1 native fallback, separate session.
Implementation evaluation remains the feature route, with availability recorded before launch.

## Plan review correction

The proposed namespace SDK pin was rejected: static namespace imports also shadow local-source members. Use PLUGIN_KIND_SOURCE_IMPORTS.ai and extend the import-completeness and no-pin guards with the service-mode emitter. ai/deno.json stays unchanged.
