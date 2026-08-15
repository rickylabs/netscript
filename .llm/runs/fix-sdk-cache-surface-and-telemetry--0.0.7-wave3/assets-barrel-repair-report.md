# Second post-eval repair: CLI agent-docs barrel

## Scope and cause

Readiness CI run `31893659579`, quality job `95033583015`, exposed the third tracked link in the
agent-docs chain:

```text
docs/site/web-layer/query-bridge.md
  -> .llm/assets/agent-docs/{prose.json.gz,provenance.json}
  -> packages/cli/src/kernel/assets/agent-docs.generated.ts
```

The first repair made the canonical prose assets fresh. This repair uses the canonical
`gen:assets-barrel` task to refresh only the CLI's generated embedding. No generated asset was
hand-edited.

Authorized tracked scope:

- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- harness artifacts in this run directory

## Regeneration and confinement

`deno task gen:assets-barrel` exited `0`. The immediate post-generation
`git status --porcelain` output was exactly:

```text
 M packages/cli/src/kernel/assets/agent-docs.generated.ts
```

The other six `check:assets-barrel` outputs, all lockfiles, the canonical prose assets, all site
pages, and all hand-written package/plugin sources remained unchanged. The generated barrel now
embeds:

```json
{
  "sourceCommit": "0fed4d7ff",
  "uncompressedBytes": 4753909,
  "compressedBytes": 1363396,
  "sha256": "6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe"
}
```

The generated TypeScript file's own SHA-256 is
`2c61f7e5e4a5f91a9212eac4925b9803608e61e7783b61fdcef2fed1b12aff1d`.

## Gate verdicts

```json
{
  "gate": "deno task check:assets-barrel",
  "exitCode": 0,
  "verdict": "PASS",
  "evidence": "all seven generated targets reproduced; git diff --exit-code was clean after staging the authorized delta"
}
```

```json
{
  "gate": "deno task check:agent-docs-prose",
  "exitCode": 0,
  "verdict": "PASS",
  "fresh": true,
  "stalePaths": [],
  "sourceCommit": "0fed4d7ff"
}
```

```json
{
  "gate": "run-deno-check.ts --root packages/cli --ext ts,tsx",
  "exitCode": 0,
  "verdict": "PASS",
  "filesSelected": 883,
  "batches": 8,
  "failedBatches": 0,
  "diagnostics": 0
}
```

The CLI root is excluded by the repository's Deno lint/format configuration. The wrappers correctly
refused to convert excluded Deno targets into a false pass:

```json
{
  "gate": "run-deno-lint.ts --root packages/cli --ext ts,tsx",
  "exitCode": 2,
  "verdict": "NO_VALID_PACKAGE_GATE",
  "filesSelected": 883,
  "batches": 5,
  "excludedBatches": 4,
  "lintOccurrences": 0,
  "diagnostic": "batch-size 1 isolated 713 excluded targets plus 7 out-of-scope e2e fixture config failures: Package 'zod' not found in catalog"
}
```

```json
{
  "gate": "run-deno-fmt.ts --root packages/cli --ext ts,tsx",
  "exitCode": 2,
  "verdict": "NO_VALID_PACKAGE_GATE",
  "filesSelected": 883,
  "batches": 5,
  "excludedBatches": 4,
  "formatFindings": 0,
  "diagnostic": "batch-size 1 confirmed 713 Deno-excluded targets"
}
```

An explicit wrapper run for only `agent-docs.generated.ts` also exited `2` with its sole batch
excluded for both lint and format. Therefore neither wrapper is represented as a pass. The
canonical barrel generator itself pipes the emitted file through `deno fmt --ext ts -`, and the
green regenerate-then-diff gate proves that canonical output is stable.

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

## Further downstream audit

A fourth stale generated link exists, outside this repair's authorization:

```json
{
  "gate": "deno task check:publish-assets",
  "exitCode": 1,
  "verdict": "OUT_OF_SCOPE_GENERATED_DRIFT",
  "stalePaths": ["packages/mcp/src/publish-assets.generated.ts"]
}
```

`generate-publish-assets.ts` independently reads `.llm/assets/agent-docs/provenance.json` and writes
the MCP fallback corpus provenance. The current MCP output still embeds
`sourceCommit: 504de3f67`; the canonical asset now records `0fed4d7ff`. The changed Query Bridge page
is not one of `MCP_EMBEDDED_DOC_PATHS`, so the selected MCP document payload is unaffected, but its
release-source provenance is stale.

This fourth link is a sibling consumer of the canonical prose assets, not an output derived from
the CLI barrel. It was discovered with the check-only task and was not regenerated or edited.

The executed whole-repo consumer search found no fifth checked-in generated artifact:

- `packages/mcp/src/publish-assets.generated.ts` is imported directly by MCP runtime code and tests.
- `.llm/tools/validation/check-netscript-jsr-specifiers.ts` reads it for validation.
- release tooling lists it in `PUBLISH_ASSET_OUTPUTS` and invokes `check:publish-assets`.
- no generator consumes the MCP generated file to write another tracked artifact.

No root suite, Aspire, Docker, CLI E2E, evaluator, or review dispatch was run.
