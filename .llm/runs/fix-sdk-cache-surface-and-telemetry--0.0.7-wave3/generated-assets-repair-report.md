# Post-IMPL-EVAL generated-assets repair receipt

## Scope and cause

Readiness CI run `31892668157`, quality job `95031217843`, reported
`check:agent-docs-prose` stale for `prose.json.gz` and `provenance.json`. The authorized S3 edit to
`docs/site/web-layer/query-bridge.md` changes the rendered
`pages/web-layer/query-bridge/index.md` input included in the checked-in agent-docs bundle.

This repair changes exactly:

- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- harness run artifacts in this run directory

No package, plugin, test, further site page, surface baseline, or JSR policy file is part of this
repair.

## Canonical regeneration and confinement

The assets were regenerated with the repository-owned command:

```text
deno task gen:agent-docs-prose
```

The immediate post-generation `git status --porcelain` output was:

```text
 M .llm/assets/agent-docs/prose.json.gz
 M .llm/assets/agent-docs/provenance.json
```

No other generated file, docs page, package source, test, or lockfile changed. Provenance advanced
from source commit `504de3f67` to the repair base `0fed4d7ff`; the new compressed bundle SHA-256 is
`6df99eb856ebf1cd8b1daf6bd610a6f3ee4db804c41e465ca5be500ef35853fe`.

## Gate verdicts

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
  "gate": "deno task --cwd docs/site verify",
  "exitCode": 0,
  "verdict": "PASS",
  "evidence": {
    "sourceFormat": "OK",
    "renderedOutput": "OK (227 HTML files; 4 documented-syntax allowances)",
    "internalLinks": "35342 across 227 pages; all resolve",
    "caveatMarkers": "18 across 14 pages; all references resolve"
  }
}
```

```json
{
  "gate": "run-deno-lint.ts --root packages/sdk --ext ts,tsx",
  "exitCode": 0,
  "verdict": "PASS",
  "filesSelected": 84,
  "findings": 0
}
```

```json
{
  "gate": "run-deno-fmt.ts --root packages/sdk --ext ts,tsx",
  "exitCode": 0,
  "verdict": "PASS",
  "filesSelected": 84,
  "failedBatches": 0,
  "findings": 0
}
```

The raw documentation lint baseline remains honestly red and unchanged:

```json
{
  "gate": "deno doc --lint (all 12 SDK entrypoints)",
  "exitCode": 1,
  "verdict": "EXPECTED_BASELINE_RED",
  "diagnostics": [
    "private-type-ref: QueryClientPort -> QueryClient at packages/sdk/src/ports/query-client.ts:41:1",
    "private-type-ref: createNetScriptQueryClient -> QueryClient at packages/sdk/src/query-client/query-client-factory.ts:44:1",
    "private-type-ref: DurableStreamProducerOptions[\"instrumentation\"] -> StreamsInstrumentation at packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3"
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
    "private-type-ref: KvCacheStore -> CacheStore at packages/sdk/src/cache/kv-cache-store.ts:48:1",
    "private-type-ref: KvCacheStore.prototype.get -> CacheKey at packages/sdk/src/cache/kv-cache-store.ts:97:3",
    "private-type-ref: KvCacheStore.prototype.get -> CacheStoreEntry at packages/sdk/src/cache/kv-cache-store.ts:97:3"
  ],
  "newDiagnostics": 0
}
```

No root suite, Aspire, Docker, CLI E2E, evaluator, or review dispatch was run for this bounded
repair.
