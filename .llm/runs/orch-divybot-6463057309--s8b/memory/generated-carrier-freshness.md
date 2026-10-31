# Design-system pages and release documentation carriers

A successful Lume build does not by itself refresh the checked-in agent documentation shipped in the CLI/MCP. After new source-generated docs pages land, `deno task check:agent-docs-prose` can fail because `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` is stale.

Use the normal native generation chain, with no manual edits to payload data:

```sh
deno task gen:agent-docs-prose
deno task gen:assets-barrel
deno task gen:publish-assets
```

Verify `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:assets-barrel` and `check:publish-assets`. All four are allowlisted in run-gate.ts for durable receipts. The source-resume leaf integrated the generated data via ordinary fast-forward commits 977f2742 and 9fa47591; no duplicate generation patch was needed.

The actual committed CLI carrier contains all fifteen Design system Markdown twins. `buildMcpEmbeddedDocs()` checks the selected fallback docs separately: 284,489 / 294,912 bytes, fourteen selected documents. A temporary audit alone cannot prove the checked-in carrier is current; check both actual committed data and native freshness.

Docs builds can add dependency graph entries for Lume’s pinned image helper to the docs lock. Preserve the reviewed tracked lock byte-for-byte when those automatic local changes are outside the slice; never delete/reload locks or caches. Native freshness checks pass with the tracked lock.
