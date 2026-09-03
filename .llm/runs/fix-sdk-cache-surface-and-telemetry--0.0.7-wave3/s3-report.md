# S3 receipt — module diagnostic and mandatory-evidence JSDoc

Date: 2026-08-15
Base head: `1cf76c6dd691378eddbbd9cd3c8a82d50c30fa2f`

## Authorized scope

S3 changed exactly the four coordinator-authorized paths plus run artifacts:

- `packages/sdk/src/cache/cache-provider.ts`
- `packages/sdk/src/ports/cache-store.ts`
- `packages/sdk/src/cache/cache-provider_test.ts`
- `docs/site/web-layer/query-bridge.md`

No S1 or S2 source/test/README file changed. No provider ownership changed, `_provider` remains
module-local, and published runtime code performs no file or asset read.

## D4 proof

The uninitialized-provider error now includes the evaluated `import.meta.url`, retains the existing
browser/client-side guidance, and presents duplicate SDK module instances only as a possibility.
The Query Bridge page uses the single install-independent token `<resolved import.meta.url>` in an
otherwise byte-identical, single-line `text` fence.

`cache-provider_test.ts` captures the real error and:

1. extracts only the substring between the stable module prefix and registration-guidance suffix;
2. proves that substring equals `new URL('./cache-provider.ts', import.meta.url).href`;
3. substitutes only that substring with `<resolved import.meta.url>`;
4. reads the authorized Query Bridge fence and compares the complete normalized message
   byte-for-byte.

Focused structured result:

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","packages/sdk/src/cache/cache-provider_test.ts"],"exitCode":0,"summary":{"passed":1,"failed":0,"ignored":0,"totalResults":1,"uniqueFailures":0},"failures":[]}
```

## D5 ports sweep

Executed from the repository root:

```text
rg -n -C 2 '@(?:returns|param|example)' packages/sdk/src/ports
rg -n -C 2 'value: null|Promise<void>|topology|evidence|report' packages/sdk/src/ports
```

The tag census found `@param`/`@returns` documentation in `query-key.ts`, `cache-entry.ts`, and
`cache-store.ts`. The first two describe serialization/key construction and cache-entry conversion
or staleness and match their current signatures. The mandatory-evidence search found the stale
`{ value: null }` return text and missing `set`/`delete` return documentation only in
`cache-store.ts`. No additional evidence-contract JSDoc drift was found in another ports file.

The three repaired comments now describe:

- `get`: `{ value: T | null, report: CacheReadTopologyReport }`, including a `null` miss plus
  ordered lookup evidence;
- `set`: ordered `CacheWriteTopologyReport` write/promotion evidence;
- `delete`: `CacheInvalidationTopologyReport` tier evidence.

These are documentation-only changes to existing published signatures.

## Gate results

| Gate | Verdict | Structured evidence |
| --- | --- | --- |
| SDK check | PASS | `filesSelected=84`, `batches=1`, `failedBatches=0`, `totalOccurrences=0` |
| D4 focused test | PASS | `passed=1`, `failed=0`, `ignored=0` |
| Full SDK test | PASS | `passed=66`, `failed=0`, `ignored=0`, `uniqueFailures=0` |
| SDK lint | PASS | `filesSelected=84`, `totalOccurrences=0` |
| SDK format | PASS | `filesSelected=84`, `failedBatches=0`, `findings=0` |
| Root check | PASS | `filesSelected=2925`, `batches=25`, `failedBatches=0`, `totalOccurrences=0` |
| Root test | PASS | `passed=4203`, `failed=0`, `ignored=19`, `totalResults=4222`, `uniqueFailures=0` |
| Quality scan | PASS | `ok=true`, `findings=[]`, `allowCount=7`, `allowanceFailures=[]` |
| Architecture check | PASS with existing warnings | exit `0`; every package/plugin report has `FAIL=0`; SDK retains the existing source-cardinality warning |
| Exact NetScript JSR specifiers | PASS | `scanned=2361`, `allowances=1`, `ranges=0`, `failures=0` |
| Workspace publish dry run | PASS | exit `0`; workspace entrypoints, including all 12 SDK exports, checked |
| SDK JSR audit | PASS with known warnings | exit `0`; 84 files, 9,681 LOC, 12 exports; existing source-cardinality and slow-type-banner warnings |
| Surface diff | **FAIL — stale repository baseline** | exit `1`; verdict `major`; 524 undeclared major changes across many untouched packages |
| Combined raw doc lint | **EXPECTED RED / no-regression** | exit `1`; exact diagnostics 1–3, no additional diagnostic |
| Cache raw doc lint | **EXPECTED RED / no-regression** | exit `1`; exact diagnostics 4–6, no additional diagnostic |

The first three root-test invocations were discovered still running concurrently because the shell
returned session handles before their wrapper payloads. They emitted no terminal verdict and were
terminated as redundant S3-owned process groups. One retained invocation then completed normally
in 370,476 ms with the authoritative 4,203/0/19 JSON above. The known queue DLQ flake did not occur
in the authoritative run.

### Raw doc-lint baseline (both invocations exit 1; neither is a pass)

Combined all 12 SDK entrypoints:

1. `QueryClientPort` references private `QueryClient` — `src/ports/query-client.ts:41:1`.
2. `createNetScriptQueryClient` references private `QueryClient` —
   `src/query-client/query-client-factory.ts:44:1`.
3. `DurableStreamProducerOptions["instrumentation"]` references private
   `StreamsInstrumentation` —
   `packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3` (not an SDK
   regression).

Cache entrypoint alone:

4. `KvCacheStore` references private `CacheStore` — `src/cache/kv-cache-store.ts:48:1`.
5. `KvCacheStore.prototype.get` references private `CacheKey` —
   `src/cache/kv-cache-store.ts:97:3`.
6. `KvCacheStore.prototype.get` references private `CacheStoreEntry` — the same location.

## Honest limitation

`deno task surface:diff` cannot demonstrate this leaf's patch level because its checked-in baseline
is stale across the repository. It is therefore recorded red, not passed. The S3 diff changes no
export map, barrel, TypeScript declaration, dependency, or signature; only runtime diagnostic text,
one adjacent test, three JSDoc comments, one synchronized site quotation, and run artifacts change.
