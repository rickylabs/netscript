---
layout: layouts/base.vto
title: "@netscript/watchers"
---

# `@netscript/watchers`

File-watching primitives for NetScript: a pipeline-based `FileWatcher`, composable filters and
failure tracking for local and network filesystems. Use `createWatcher` when a tool or service must
react to file changes.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/watchers` | `./mod.ts` | [Factory](#factory), [watcher](#watcher), [filters](#filters), [failure tracking](#failure-tracking) and [filesystem helpers](#filesystem-helpers). The package has no other entrypoints. |

With no explicit strategy, the watcher selects native OS notifications with polling fallback for
local paths, or polling for network paths. Set `strategy` when the choice must be explicit.

## Factory

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createWatcher` | function | `function createWatcher(options: WatcherOptions): FileWatcher` | Factory function to create a `FileWatcher` with the given options. |

## Watcher

| Symbol | Kind | Member | Signature | Description |
| --- | --- | --- | --- | --- |
| `FileWatcher` | class | `constructor` | `new FileWatcher(options: WatcherOptions)` | Composable file watcher that combines a strategy with a filter pipeline; auto-selects native vs. polling. |
| | | `watch` | `async *watch(): AsyncGenerator<WatchEvent>` | Start watching and yield file events through the filter pipeline. |
| | | `stop` | `stop(): void` | Stop the watcher by signaling abort. |
| | | `running` | `get running(): boolean` | Whether the watcher is currently running. |

## Strategy selection and failures

| Options | Behavior |
| --- | --- |
| `strategy: 'native'` | Native OS notifications only. A setup or runtime failure emits an `onError` diagnostic and rejects the iterator; it never starts polling. |
| `strategy: 'polling'` | Polling without a native attempt. |
| `strategy: 'hybrid'` | Native first, with polling fallback for native failures other than a missing/removed root. |
| No `strategy`, `forcePolling: true` | Polling, preserving the legacy option. |
| No `strategy`, network path | Polling selected automatically. |
| No `strategy`, local path | Hybrid selected automatically. |

An explicit `strategy` takes precedence over `forcePolling` and network-path heuristics. Unknown
strategy identifiers fail with `TypeError`; there is no implicit fallback for them.
`WATCH_STRATEGIES` exports the accepted built-in values.

`onReady` runs after the strategy acquires resources, independently of matching file events.
Polling retains its consecutive-access-failure grace period during startup, but does not announce
readiness until every root has been scanned successfully. A share that returns within that budget
continues in the same polling session; persistent startup failures reject for supervisor recovery.
Files present when that first successful polling scan completes establish its initial snapshot;
changes during the startup access outage are not replayed.
`onError` receives a `WatcherErrorEvent` containing `type: 'error'`, configured `paths`, the original
`error`, and a `Date` timestamp. This diagnostic is separate from the `WatchEvent` stream: file
filters and file handlers never receive an error as a file change. The original error still rejects
`watch()`, even if the diagnostic hook throws. Cancellation completes without an error diagnostic.

Removing a watched root invalidates the native subscription even when only `create` events were
requested. That failure propagates in native and hybrid modes so a supervisor can reopen the root;
it is not hidden by polling. A standalone watcher does not retry automatically. Create a fresh
watcher for each session or recovery attempt, and call `stop()` to release it. File-watch triggers
use a supervising adapter that retries with bounded backoff and exposes
[per-trigger availability](/reference/triggers/#file-watch-health).

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  strategy: 'native',
  onReady: () => console.info('Native watch ready'),
  onError: ({ error }) => console.error('Native watch failed', error),
});
try {
  for await (const event of watcher.watch()) {
    console.log(event.kind, event.path);
  }
} finally {
  watcher.stop();
}
```

## Filters

Filters consume an async iterable of events and yield only the events that pass. They run in
configured order inside the `FileWatcher` pipeline, and each implements the `WatchFilter` contract.

| Symbol | Kind | Member | Signature | Description |
| --- | --- | --- | --- | --- |
| `GlobFilter` | class | `constructor` | `new GlobFilter(patterns: readonly string[])` | Yields only events whose filenames match at least one glob pattern. |
| | | `apply` | `async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>` | Apply the glob filter to an event stream. |
| | | `matches` | `matches(filePath: string): boolean` | Check if a file path matches any configured glob pattern. |
| `DebounceFilter` | class | `constructor` | `new DebounceFilter(options: DebounceFilterOptions \| number, signal?: AbortSignal)` | Suppresses rapid successive events for the same file path within a configurable window (`debounceMs`). |
| | | `apply` | `async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>` | Apply the debounce filter to an event stream. |
| `StabilityFilter` | class | `constructor` | `new StabilityFilter(options?: StabilityOptions, signal?: AbortSignal)` | Waits for file writes to complete (size stops changing) before yielding events. |
| | | `apply` | `async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>` | Apply the stability filter to an event stream. |
| | | `waitForStability` | `async waitForStability(filePath: string): Promise<WatchEvent["fileInfo"]>` | Wait for a file to stop growing. |
| `DedupFilter` | class | `constructor` | `new DedupFilter(options?: DedupFilterOptions)` | Skips events for files with previously-seen content hashes (in-memory, time-evicted). |
| | | `apply` | `async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>` | Apply the dedup filter to an event stream. |
| | | `clear` | `clear(): void` | Clear all tracked hashes. |

## Failure tracking

| Symbol | Kind | Member | Signature | Description |
| --- | --- | --- | --- | --- |
| `AccessFailureTracker` | class | `constructor` | `new AccessFailureTracker(options: { maxConsecutiveFailures?: number; onPersistentFailure: (path: string, count: number) => void })` | Tracks consecutive access failures per path and surfaces persistent errors via callback. |
| | | `recordSuccess` | `recordSuccess(path: string): void` | Record a successful access -- resets the counter for the path. |
| | | `recordFailure` | `recordFailure(path: string): boolean` | Record a failed access; returns `true` when the threshold is crossed. |
| | | `clear` | `clear(): void` | Clear all tracked state. |

## Filesystem helpers

Low-level helpers that swallow only missing or inaccessible errors and re-throw the rest.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `safeReadFile` | function | `async function safeReadFile(path: string): Promise<Uint8Array<ArrayBuffer> \| null>` | Read a file's content, returning `null` when the file is missing or inaccessible. |
| `safeStat` | function | `async function safeStat(path: string): Promise<FileInfo \| null>` | Stat a file, returning `null` when the file is missing or inaccessible (only `NotFound`/`PermissionDenied`). |
| `computeContentHash` | function | `async function computeContentHash(filePath: string): Promise<string \| null>` | Compute a SHA-256 hex digest of a file's content, or `null` if unreadable. |

## Interfaces

| Symbol | Kind | Description |
| --- | --- | --- |
| `WatcherOptions` | interface | Configuration for a `FileWatcher` instance (paths, patterns, events, debounceMs, contentHash, processExisting, strategy, forcePolling, pollIntervalMs, minFileSize, maxFileAge, stabilityThreshold, onReady, onError, signal). |
| `WatchEvent` | interface | A single file-system event yielded by a watcher strategy. |
| `WatcherErrorEvent` | interface | Failure diagnostic passed to `onError` before the iterator rejects. |
| `WatchFilter` | interface | A filter takes an async iterable of events and yields only those that pass. |
| `WatchStrategyHandler` | interface | A watch strategy produces raw file-system events as an async iterable. |
| `FileInfo` | interface | Metadata about a watched file, built from `Deno.FileInfo`. |
| `StabilityOptions` | interface | Configuration for the stability filter (`checkIntervalMs`, `stableChecks`). |
| `DedupFilterOptions` | interface | Options for creating a `DedupFilter` (`windowMs`, default `60000`). |
| `DebounceFilterOptions` | interface | Options for creating a `DebounceFilter` (`debounceMs`). |

## Type aliases

| Symbol | Kind | Definition | Description |
| --- | --- | --- | --- |
| `KnownEventKind` | type alias | `"create" \| "modify" \| "remove"` | Built-in file-system event kinds the watcher can detect. |
| `EventKind` | type alias | `KnownEventKind \| (string & Record<never, never>)` | File-system event kind: a built-in kind or another string. |
| `KnownWatchStrategy` | type alias | `typeof WATCH_STRATEGIES[number]` | Built-in watch strategies for detecting file changes. |
| `WatchStrategy` | type alias | `KnownWatchStrategy \| (string & Record<never, never>)` | Watch-strategy identifier; built-in factory values remain runtime validated. |

## Internals

The strategy classes (`NativeStrategy`, `PollingStrategy`, `HybridStrategy`) and their option
interfaces (`NativeStrategyOptions`, `PollingStrategyOptions`, `HybridStrategyOptions`) are
`@internal` and not part of the public contract. `FileWatcher` selects one from the configured
paths; construct watchers with `createWatcher` or `new FileWatcher(...)`.

## Examples

### Watch a directory for new CSV files

```ts
import { createWatcher } from '@netscript/watchers';

const controller = new AbortController();
const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create'],
  processExisting: true,
  maxFileAge: 86400000,
  debounceMs: 500,
  stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
  signal: controller.signal,
});

try {
  for await (const event of watcher.watch()) {
    console.log(`${event.kind}: ${event.path}`);
  }
} finally {
  watcher.stop();
}
```
