# Research

Baseline main `7907293f3dad3aeb557923809ddcd3435adae151` includes #2165/#2477. Live issue/comments contain no triage report or duplicate implementation. The only acceptance sentence is: “two modifies of one path, seconds apart, both reach the handler with the default definition.” Owner dispatch adds durable restart, active duplicate and post-completion eligibility proof plus negative controls.

MCP `find_guidance` and then `search_docs` consulted. Focused source and `deno doc --filter defineFileWatch` confirm:

- `WatchersFileWatcherAdapter.#eventFor` emits a process-local counter id and no idempotency key. It already receives optional size/modifiedAt through its existing watcherFactory seam.
- `TriggerProcessor.resolveDedupTtl` always defaults to 24 hours. The core KV store already supports `ttlMs = 0` by atomically deleting active and completed keys. No store changes needed.
- #2165 scopes automatic payload hashes to triggerId and honors definition key callbacks. Preserve both unchanged.
- `defineFileWatch` does not expose deduplication in FileWatchSpec, but the returned FileWatchDefinition supports composing an explicit policy. No builder/API expansion is needed.
- The upstream native strategy normally supplies stat metadata; null/missing metadata remains valid (removal, stat failure or another watcher). Deterministic source events via watcherFactory are necessary to prove this edge; real adapter + real disk KV are required, not the memory watcher/idempotency fakes.
- A metadata-bearing key must ignore callback timestamp, stableChecks and contentHash. A JSON tuple avoids ambiguous separators and includes the trigger id, path, kind, mtime and size. Incomplete metadata must use UUIDs, including null mtime.

Doctrine: Archetype 3, existing verdict Keep for plugin-triggers-core/watchers. Existing runtime layers and store ports suffice. No new exports, dependencies, inheritance, state machine, port or framework helper. Existing active claim TTL is unchanged. Stop/drain and error-hook boundaries stay intact.

JSR planned-surface audit: current package has scoped name/version/license, documented typed exports, strict checking and test exclusions. Runtime types/exports unchanged; explicit local return types preserve fast-type posture. This package has historical slow-type allowlisting in the audit tool, but its current package dry-run passes the normal no-slow-types bar; full-export doc lint has separately reproduced baseline private-type-ref diagnostics. No new public-surface risk or accepted debt.
