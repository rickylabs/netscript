# @netscript/watchers

Composable file-watching primitives for NetScript runtime packages.

`@netscript/watchers` builds a small pipeline around filesystem watch events: strategy selection,
event normalization, glob filtering, stability checks, and content deduplication. It is a
runtime/behavior package because `FileWatcher` owns a long-running async watch loop with explicit
`stop()` and `AbortSignal` shutdown paths.

## Install

```ts
import { createWatcher } from '@netscript/watchers';
```

The package is published for Deno and JSR consumers as:

```ts
import { FileWatcher, GlobFilter } from 'jsr:@netscript/watchers';
```

## Quick Start

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create', 'modify'],
  stabilityThreshold: {
    checkIntervalMs: 250,
    stableChecks: 2,
  },
});

for await (const event of watcher.watch()) {
  console.log(`${event.kind}: ${event.path}`);
  watcher.stop();
}
```

## Network Share Example

Network shares are best watched with polling because native filesystem events can be incomplete or
unavailable across SMB/NFS boundaries.

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['//fileserver/erp-share/sales/incoming'],
  patterns: ['*.csv'],
  forcePolling: true,
  pollIntervalMs: 3000,
  stabilityThreshold: {
    checkIntervalMs: 1000,
    stableChecks: 3,
  },
});

watcher.stop();
```

## Explicit Abort

Use an `AbortController` when another runtime owns shutdown.

```ts
import { createWatcher } from '@netscript/watchers';

const controller = new AbortController();
const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.json'],
  signal: controller.signal,
});

controller.abort();
watcher.stop();
```

## Public Surface

The root entrypoint exports the stable runtime API:

- `createWatcher(options)` creates a `FileWatcher`.
- `FileWatcher` owns the watch loop and filter pipeline.
- `WatchEvent` describes normalized file events.
- `WatcherOptions` configures paths, patterns, strategies, and cancellation.
- `GlobFilter` filters events by filename patterns.
- `StabilityFilter` waits for file size and modified time to settle.
- `DedupFilter` removes duplicate content events inside a time window.
- `computeContentHash(path)` returns a SHA-256 hex digest for files.
- `safeStat(path)` and `safeReadFile(path)` wrap filesystem reads with null results for expected
  access failures.
- `AccessFailureTracker` records repeated read/stat failures.

## Runtime Model

`FileWatcher.watch()` returns an async iterable. The iterable runs until one of these conditions
occurs:

- the caller stops consuming,
- `watcher.stop()` is called,
- the configured `AbortSignal` is aborted,
- the selected strategy ends.

The watcher does not spawn hidden global workers. Each instance owns its own strategy, filters,
abort handling, and running state.

## Strategy Selection

The watcher chooses a strategy from `WatcherOptions`:

- `forcePolling: true` uses polling for every path.
- local paths default to native filesystem watching where available.
- network-looking paths default to polling.
- hybrid strategy can combine native events with polling checks.

The strategy names are exposed as the `KnownWatchStrategy` union:

```ts
import type { KnownWatchStrategy } from '@netscript/watchers';

const strategy: KnownWatchStrategy = 'polling';
console.log(strategy);
```

## Filters

Filters are async transforms over `WatchEvent` streams. The built-in filter order is:

1. glob filter,
2. stability filter,
3. dedup filter.

You can use the filters directly in tests or adapters:

```ts
import { GlobFilter } from '@netscript/watchers';

const filter = new GlobFilter(['*.csv', '*.xlsx']);
console.log(filter.matches('/data/sales.csv'));
```

## Event Shape

Every emitted event includes:

- `path`,
- `kind`,
- `timestamp`,
- `fileInfo`,
- `contentHash`.

`kind` is one of `create`, `modify`, or `remove`.

## Delivery Guarantee

The watcher provides at-least-once-effective file event delivery within one watcher instance.
Filesystem backends can emit duplicate or coalesced events, so the package normalizes events and
uses `DedupFilter` when content hashes are available. Consumers that perform durable side effects
should still use their own idempotency keys.

## Concurrency

One `FileWatcher` instance processes its async event stream serially. Different watcher instances
can run in parallel. The package does not own a worker pool or global concurrency budget.

## Stop Semantics

`watcher.stop()` is idempotent. It marks the watcher as stopped and aborts the internal controller.
Calls after the first stop are ignored.

When a caller supplies `signal`, aborting that signal also stops the runtime. This lets plugin
runtimes attach watcher lifetime to a larger supervisor.

## Required Permissions

Typical runtime permissions:

```text
--allow-read
```

Tests or applications that create temporary files also need:

```text
--allow-write
```

The package does not require network, environment, process, or FFI permissions.

## Network Paths

Network path detection is conservative. UNC paths such as `//fileserver/share/incoming` are treated
as network paths. If access checks fail, the package falls back to caller-selected strategy behavior
and records failures through `AccessFailureTracker`.

## Testing Guidance

Use temporary directories and short stability intervals in tests:

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./tmp'],
  patterns: ['*.txt'],
  stabilityThreshold: {
    checkIntervalMs: 10,
    stableChecks: 1,
  },
});

watcher.stop();
```

## See Also

- `@netscript/plugin-triggers` uses this package through a file-watch adapter.
- `@std/fs` supplies filesystem primitives used by the implementation.
- `@std/path` supplies path normalization helpers.
