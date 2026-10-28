**Verdict: PASS**

The generated-data slice is sound, based on the row structure, provenance and generator alignment. I didn't inspect the compressed payloads, as you asked.

### CLI prose carrier

- **Header and source match the native generator.** `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts` starts with the exact header and `EMBEDDED_AGENT_DOCS_PAGES` declaration that `renderAgentDocsPages` emits (`.llm/tools/docs/agent-docs-page-carrier.ts:47`). It names `gen:agent-docs-prose` as its source.
- **Every row is well-formed.** All 204 rows match `[path, base64 gzip, 64-hex sha256, byteLength]`, which is the format the renderer writes at line 45. That is 204 out of 204 lines.
- **The 205 decoded entries add up.** They are the 204 stored rows plus `llms-full.txt`. The renderer skips that file when storing (line 33), and `readAgentDocsPages` rebuilds it (line 60). This matches `.llm/runs/orch-divybot-6470427461--s8c/carrier-comparison.json`, which reports 205 entries before and after, with nothing added or removed.
- **Unchanged rows are reused, not re-encoded.** A stored row is only reused if it decodes to exactly the current source (lines 22-29). So the 41 changed entries must come from real content changes.
- **The non-site context entries are preserved.** `context/01-how-the-web-became-the-default.mdx` and `context/02-how-the-web-stack-grew-up.mdx` are the only `context/` rows. They fall outside `isSiteGeneratedAgentDocsEntry` (line 12), so the generator carries them over rather than rebuilding them, and the comparison reports them byte-identical.
- **No internal gallery leaked.** There is no `pages/internal/…` or `pages/fixtures/…` row. This agrees with the slice 1 and 3 exclusion through `internal: true`.

### MCP publish assets

- **Header and source match the native generator.** `packages/mcp/src/publish-assets.generated.ts` has the exact header and exports from the `generateMcpAssets` template (`.llm/tools/generate-publish-assets.ts:391-412`). It names `gen:publish-assets` as its source.
- **The 14 documents match the configured list.** `MCP_EMBEDDED_DOCS` has exactly 14 `{path, slug, …}` rows, in the same order as `MCP_EMBEDDED_DOC_PATHS` (lines 16-31). Each slug is the normalised path.
- **The byte budget holds.** `buildMcpEmbeddedDocs` enforces the unchanged 294,912-byte limit (lines 39 and 347-351). The reported 283,018 bytes are within it. Integrity is a content-addressed sha256 computed over the canonical path and source pairs.

### Provenance and scope

- **The provenance file correctly stays unchanged.** `.llm/assets/agent-docs/provenance.json` only records schema version and framework version (0.0.8). With no version bump, it is right that it didn't change.
- **The write scope was declared before generation.** `supervisor.md:16` and `drift.md:13` declared the exact write surface before generation. Both changed files are on the generator's own `PUBLISH_ASSET_OUTPUTS` list. No other listed output changed, and no hand-written package source or public API changed.

I haven't run the freshness checks, `quality:gate` or the browser receipts myself; I'm relying on your report that they pass. The assets-barrel check and final IMPL-EVAL are still to come, as you noted.
