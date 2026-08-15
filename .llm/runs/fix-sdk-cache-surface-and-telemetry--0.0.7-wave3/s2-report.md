# S2 Report: real Deno KV cache-write isolation

## Scope

- Base: `0e4e26c51e9dcbac7dbd0e30eb5db19130e4d7d0` (S1 Tier-A PASS).
- Product: `packages/sdk/src/cache/cache-query.ts` only.
- Proof: new `packages/sdk/tests/cache/cache-query-kv-limit_test.ts`.
- Run artifacts: this report, `worklog.md`, and `context-pack.md`.
- S1 and S3 files remain untouched.

## Behavioral RED

The new test ran before any product edit. It initialized the process-global singleton with a real
in-memory Deno KV, constructed a real `KvCacheStore`, and loaded a structured payload containing an
80,000-character value. The pre-fix `fetchAndCache()` recorded the failure and rethrew the actual
Deno KV limit error:

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","packages/sdk/tests/cache/cache-query-kv-limit_test.ts"],"cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","exitCode":1,"durationMs":4511,"summary":{"passed":0,"failed":1,"ignored":0,"totalResults":1,"uniqueFailures":1},"failures":[{"message":"TypeError: Value too large (max 65536 bytes)\n    at doAtomicWriteInPlace (ext:deno_kv/01_db.ts:<line>:<column>)\n    at Kv.set (ext:deno_kv/01_db.ts:<line>:<column>)\n    at DenoKvAdapter.set (file://<cwd>/packages/kv/adapters/deno-kv.adapter.ts:<line>:<column>)\n    at async KvCacheStore.set (file://<cwd>/packages/sdk/src/cache/kv-cache-store.ts:<line>:<column>)\n    at async CacheQuery.fetchAndCache (file://<cwd>/packages/sdk/src/cache/cache-query.ts:<line>:<column>)\n    at async CacheQuery.queryInsideSpan (file://<cwd>/packages/sdk/src/cache/cache-query.ts:<line>:<column>)\n    at async file://<cwd>/packages/sdk/src/cache/cache-query.ts:<line>:<column>\n    at async RecordingCacheTelemetry.withSpan (file://<cwd>/packages/sdk/tests/cache/cache-query-kv-limit_test.ts:<line>:<column>)\n    at async file://<cwd>/packages/sdk/tests/cache/cache-query-kv-limit_test.ts:<line>:<column>","count":1,"tests":[{"name":"CacheQuery returns loaded data when real Deno KV rejects an oversized cache write","file":"./packages/sdk/tests/cache/cache-query-kv-limit_test.ts","line":50}]}]}
```

This is RED for the issue's stated reason, not a synthetic store error.

## Implementation and GREEN

Only the post-loader `store.set()` catch changed: it still calls `recordCacheProviderError()` with
`CacheOperations.READ` and `CacheEvents.WRITE`, then returns the already-resolved data instead of
rethrowing the persistence error. Lookup and loader failures remain outside this catch. The explicit
`setCachedData()` path is unchanged and the real-KV proof additionally asserts that it still throws.

Final structured GREEN result after formatting:

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","packages/sdk/tests/cache/cache-query-kv-limit_test.ts"],"cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","exitCode":0,"durationMs":1663,"summary":{"passed":1,"failed":0,"ignored":0,"totalResults":1,"uniqueFailures":0},"failures":[]}
```

The test proves the caller receives the identical payload object, the loader runs once, the read
span has a `cache.write` event with `outcome=error` and `topology_complete=false`, and a subsequent
cache lookup misses. Its `finally` block awaits both `closeKv()` and `resetKv()`.

## Gate Verdicts

| Gate | Structured verdict |
| --- | --- |
| Focused SDK check | PASS — `filesSelected=84`, `batches=1`, `failedBatches=0`, zero diagnostics |
| Real-KV focused test | PASS — `passed=1`, `failed=0`, `ignored=0` |
| Full SDK test | PASS — `passed=66`, `failed=0`, `ignored=0` |
| SDK lint | PASS — `filesSelected=84`, `batches=1`, zero findings |
| SDK format, first run | FAIL — one formatting finding in the new test import; corrected with targeted formatting |
| SDK format, final run | PASS — `filesSelected=84`, `failedBatches=0`, zero findings |
| Repo-root `deno task check` | PASS — `filesSelected=2925`, `batches=25`, `failedBatches=0`, zero diagnostics |
| Repo-root `deno task test` | PASS — final rerun: `passed=4203`, `failed=0`, `ignored=19`, `totalResults=4222`, `durationMs=323024` |
| `deno task quality:gate` | PASS — quality scan `ok=true`, no findings, seven existing allowances; architecture check has zero failures and existing warnings |

Final wrapper JSON, in the order required by the slice:

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":84,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","packages/sdk/"],"cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","exitCode":0,"durationMs":15238,"summary":{"passed":66,"failed":0,"ignored":0,"totalResults":66,"uniqueFailures":0},"failures":[]}
```

```json
{"source":{"mode":"command","cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","exitCode":0},"selection":{"filesSelected":84,"batches":1},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

```json
{"command":"deno fmt --check","cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","mode":"check","summary":{"filesSelected":84,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
```

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2925,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all"],"cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","exitCode":0,"durationMs":323024,"summary":{"passed":4203,"failed":0,"ignored":19,"totalResults":4222,"uniqueFailures":0},"failures":[]}
```

The first SDK format invocation was honestly red before the targeted formatting correction:

```json
{"command":"deno fmt --check","cwd":"/home/codex/repos/netscript-007-leaf-sdk-cache","mode":"check","summary":{"filesSelected":84,"batches":1,"failedBatches":1,"findings":1,"ignoredFindings":0},"findings":[{"path":"/home/codex/repos/netscript-007-leaf-sdk-cache/packages/sdk/tests/cache/cache-query-kv-limit_test.ts","reason":"-import {"}]}
```

Raw `deno doc --lint` was not run in S2. Aspire, Docker, and `e2e:cli` were not run.

## PR Metadata

PR #1665's body now explicitly explains that D2 deliberately replaced the former
`assertRejects` guard with a fail-safe loader-return assertion plus error/incomplete span evidence.
No acceptance checkbox, label, readiness state, or issue metadata was changed.
