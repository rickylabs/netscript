# Research

## Re-baseline

The branch starts from `origin/main` `5197e70b7`. The MCP package exports `.` (`./mod.ts`),
`./cli` (`./cli.ts`), and `./openapi-projection` (`./openapi-projection.ts`). The current reference
page has the checker-recognized `## Sub-path exports` heading but no checker-shaped entrypoint rows.

## Symbol coverage evidence

`deno doc --json` was run independently for all three entrypoints. The root and CLI surfaces expose
a large contract set beyond the curated page tables, including `createServiceEndpointDirectory`,
`EndpointSourcePort`, and `MCP_AGENT_INSTRUCTIONS`. The OpenAPI projection entrypoint exposes 25
symbols with no dedicated page section, including `indexOpenApiOperations`,
`resolveCanonicalOperation`, and `projectOperationSchemaViews`. The existing CLI subsection names
only `runMcpStdioServer`, `createMcpCliServer`, `resolveDocsRoot`, and `McpCliOptions`.

Therefore `symbolCoverage.mode` must be `entrypoints-only`; complete symbol coverage would be a
false claim.

## Doctrine and debt

The docs describe `packages/mcp`, an Archetype 2 package with a current doctrine verdict of Keep.
This slice changes neither package source nor public exports. No relevant architecture debt is
created or closed.

