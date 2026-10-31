# Validation evidence

Source validated over S0 baseline; product patch unchanged between gates and sign-off review.

| Gate | Exit | Result |
| --- | --- | --- |
| Structured package tests, `run-deno-test.ts -- --unstable-kv --allow-all packages/auth-kv-oauth/tests/` | 0 | 55 passed, none failed/ignored |
| Negative control, same command, only cookies.ts restored from baseline | 1 | 50 passed, 5 failed with URIError |
| Restored fix, same command | 0 | 55 passed |
| Structured `run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx` | 0 | 17 files, no diagnostics, unstable-kv default enabled |
| Structured `run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx` | 0 | no findings |
| Structured `run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx` | 0 | 17 files, no findings |
| `deno task quality:gate` through run-gate.ts | 0 | full quality scan, dependency/reference-lock checks, architecture gate passed; existing warnings remain |
| `deno task publish:dry-run --member packages/auth-kv-oauth` through run-gate.ts | 0 | all 9 export entrypoints checked, 12 intended publish files, no slow-type errors |
| `audit-jsr-package.ts --root packages/auth-kv-oauth --text` | 0 | no failures; one banner false positive (Checking for slow types in the public API...) |
| `deno task doc:lint --root packages/auth-kv-oauth` through run-gate.ts | 1 | pre-existing KV private type reference, also reproduced with baseline parser; changed cookies export has 0 errors |
| CLI scaffold runtime | — | unproven: operator forbids local execution; no scaffold/plugin/runtime wiring change |

## Negative control

Only production cookies.ts was replaced with its baseline bytes; new tests stayed in place. Tests failed in the exact issue example, malformed encoding/UTF-8 positions, duplicate policy, backend authentication and callback cookie fallback. The finally block restored the fix, then the entire package suite passed again. See negative-tests.json and restored-tests.json. No source change was made by any test.

## Doc-lint baseline

The unique diagnostic belongs to `packages/kv/types/watchable-kv.ts`: public WatchableKv.watch references private type. Root mod.ts and store.ts inherit it. Both are untouched by this change. Restoring baseline cookies.ts reproduces exit 1 and the same one privateTypeRef (zero missing docs); cookies.ts entrypoint remains clean. This is recorded as baseline gate failure, not a passing doc gate. No unrelated KV API change or new architecture debt is introduced.

## Manual fitness review

The existing helper encodes URI decoding policy; upstream raw parsing is not compatible. No new files in the package, ports, classes, inheritance, runtime IO, dependency edges, exports, permissions, folders, or re-export changes. Changed source remains small and reachable through public cookies and flow exports. Tests use existing in-memory KV and injected OAuth fetch, with no launched services.
