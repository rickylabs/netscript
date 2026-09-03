# Final generated-asset repair: MCP publish assets

## Scope and cause

This bounded repair closes the fourth and final checked-in link in the generated documentation
cascade:

```text
docs/site/web-layer/query-bridge.md
  -> .llm/assets/agent-docs/{prose.json.gz,provenance.json}
    -> packages/cli/src/kernel/assets/agent-docs.generated.ts
      -> packages/mcp/src/publish-assets.generated.ts
```

The canonical `deno task gen:publish-assets` task was used; the generated file was not hand-edited.
The authorized tracked scope is exactly:

- `packages/mcp/src/publish-assets.generated.ts`
- harness artifacts in this run directory

## Regeneration and confinement

The repair began at clean head `27a64ea4c122312e46ffc9602509c191bcd0dd71`.
`deno task gen:publish-assets` exited `0`. The immediate post-generation
`git status --porcelain` output was exactly:

```text
 M packages/mcp/src/publish-assets.generated.ts
```

The generated diff is one line: `MCP_EMBEDDED_DOCS_PROVENANCE.sourceCommit` advances from
`504de3f67` to the already-generated corpus source `0fed4d7ff`. The selected twelve-document MCP
fallback payload, its `260303` source bytes, and its SHA-256 remain unchanged. The resulting file
SHA-256 is `359f30a062c260e1f4ad1d6f80f6d6099cdbe379612702c54778d42756b0983f`.

## Gate verdicts

```json
{"gate":"deno task check:publish-assets","exitCode":0,"verdict":"PASS"}
```

```json
{"gate":"deno task check:assets-barrel","exitCode":0,"verdict":"PASS","evidence":"all seven barrel outputs reproduced without a diff"}
```

```json
{"gate":"deno task check:agent-docs-prose","exitCode":0,"verdict":"PASS","fresh":true,"stalePaths":[],"sourceCommit":"0fed4d7ff","uncompressedBytes":4753909,"compressedBytes":1363396,"sha256":"6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe"}
```

```json
{"gate":"run-deno-check.ts --root packages/mcp --ext ts,tsx","exitCode":0,"verdict":"PASS","filesSelected":115,"batches":1,"failedBatches":0,"diagnostics":0}
```

The requested unfiltered MCP lint/format wrappers traverse fixture workspaces whose invalid Deno
configuration is the behavior under test. They fail during Deno configuration discovery before
producing any lint or formatting finding:

```json
{"gate":"run-deno-lint.ts --root packages/mcp --ext ts,tsx","exitCode":1,"verdict":"TOOLING_CONFIG_RED","filesSelected":115,"lintOccurrences":0,"diagnostic":"invalid type: string 'packages/*', expected struct WorkspaceConfig"}
```

```json
{"gate":"run-deno-fmt.ts --root packages/mcp --ext ts,tsx","exitCode":1,"verdict":"TOOLING_CONFIG_RED","filesSelected":115,"formatFindings":0,"diagnostic":"invalid type: string 'packages/*', expected struct WorkspaceConfig"}
```

The same structured wrappers, excluding only `packages/mcp/tests/fixtures/doctor/**`, cover all
remaining MCP TypeScript and are green:

```json
{"gate":"run-deno-lint.ts --root packages/mcp --ext ts,tsx --exclude doctor fixtures","exitCode":0,"verdict":"PASS","filesSelected":110,"lintOccurrences":0}
```

```json
{"gate":"run-deno-fmt.ts --root packages/mcp --ext ts,tsx --exclude doctor fixtures","exitCode":0,"verdict":"PASS","filesSelected":110,"failedBatches":0,"formatFindings":0}
```

Raw SDK documentation lint remains the exact pinned red baseline:

```json
{
  "gate": "deno doc --lint (all 12 SDK entrypoints)",
  "exitCode": 1,
  "verdict": "EXPECTED_BASELINE_RED",
  "diagnostics": [
    "QueryClientPort -> private QueryClient at packages/sdk/src/ports/query-client.ts:41:1",
    "createNetScriptQueryClient -> private QueryClient at packages/sdk/src/query-client/query-client-factory.ts:44:1",
    "DurableStreamProducerOptions[\"instrumentation\"] -> private StreamsInstrumentation at packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3"
  ],
  "newDiagnostics": 0
}
```

```json
{
  "gate": "deno doc --lint ./src/cache/mod.ts",
  "exitCode": 1,
  "verdict": "EXPECTED_BASELINE_RED",
  "diagnostics": [
    "KvCacheStore -> private CacheStore at packages/sdk/src/cache/kv-cache-store.ts:48:1",
    "KvCacheStore.prototype.get -> private CacheKey at packages/sdk/src/cache/kv-cache-store.ts:97:3",
    "KvCacheStore.prototype.get -> private CacheStoreEntry at packages/sdk/src/cache/kv-cache-store.ts:97:3"
  ],
  "newDiagnostics": 0
}
```

## Downstream closure audit

An executed repository search for the exact generated path and its exported constants finds only:

- the canonical generator and its tests;
- validation/release checks that consume or verify the file;
- MCP runtime imports and tests.

No generator consumes `packages/mcp/src/publish-assets.generated.ts` to produce another tracked
artifact. Therefore the checked-in cascade closes here; no fifth generated mirror was found.

No root suite, `check:mcp-export-corpus`, `surface:diff`, JSR audit, Aspire, Docker, CLI E2E,
evaluator, or review dispatch was run.
