---
layout: layouts/base.vto
title: "@netscript/watchers"
---

# `@netscript/watchers`

Reusable file-watching primitives for NetScript: composable strategies, filters, and a
pipeline-based `FileWatcher` for detecting file-system changes across local and network
filesystems. This page is generated from the package's public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The package exposes a single root entrypoint (`@netscript/watchers` -> `./mod.ts`). There are
no sub-path exports. The watcher auto-selects its strategy (native OS notifications for local
paths, polling for network paths) so most callers only need `createWatcher`; the strategy
classes themselves are internal implementation details.

```ts
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create'],
  stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
});

for await (const event of watcher.watch()) {
  console.log(`${event.kind}: ${event.path}`);
}
```

## Factory

| Symbol | Signature | Description |
| --- | --- | --- |
| `createWatcher` | `function createWatcher(options: WatcherOptions): FileWatcher` | Factory function to create a `FileWatcher` with the given options. |

## Watcher

| Symbol | Kind | Member | Signature | Description |
| --- | --- | --- | --- | --- |
| `FileWatcher` | class | `constructor` | `new FileWatcher(options: WatcherOptions)` | Composable file watcher that combines a strategy with a filter pipeline; auto-selects native vs. polling. |
| | | `watch` | `async *watch(): AsyncGenerator<WatchEvent>` | Start watching and yield file events through the filter pipeline. |
| | | `stop` | `stop(): void` | Stop the watcher by signaling abort. |
| | | `running` | `get running(): boolean` | Whether the watcher is currently running. |

## Filters

Filters consume an async iterable of events and yield only the events that pass. They run in
configured order inside the `FileWatcher` pipeline. Each implements the `WatchFilter` contract.

| Symbol | Kind | Member | Signature | Description |
| --- | --- | --- | --- | --- |
| `GlobFilter` | class | `constructor` | `new GlobFilter(patterns: readonly string[])` | Yields only events whose filenames match at least one glob pattern. |
| | | `apply` | `async *apply(events: AsyncIterable<WatchEvent>): AsyncIterable<WatchEvent>` | Apply the glob filter to an event stream. |
| | | `matches` | `matches(filePath: string): boolean` | Check if a file path matches any configured glob pattern. |
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

Low-level helpers that swallow only "missing/inaccessible" errors and re-throw the rest.

| Symbol | Signature | Description |
| --- | --- | --- |
| `safeReadFile` | `async function safeReadFile(path: string): Promise<Uint8Array<ArrayBuffer> \| null>` | Read a file's content, returning `null` when the file is missing or inaccessible. |
| `safeStat` | `async function safeStat(path: string): Promise<FileInfo \| null>` | Stat a file, returning `null` when the file is missing or inaccessible (only `NotFound`/`PermissionDenied`). |
| `computeContentHash` | `async function computeContentHash(filePath: string): Promise<string \| null>` | Compute a SHA-256 hex digest of a file's content, or `null` if unreadable. |

## Interfaces

| Symbol | Description |
| --- | --- |
| `WatcherOptions` | Configuration for a `FileWatcher` instance (paths, patterns, events, stability threshold, signal, force polling). |
| `WatchEvent` | A single file-system event yielded by a watcher strategy. |
| `WatchFilter` | A filter takes an async iterable of events and yields only those that pass. |
| `WatchStrategyHandler` | A watch strategy produces raw file-system events as an async iterable. |
| `FileInfo` | Metadata about a watched file, built from `Deno.FileInfo`. |
| `StabilityOptions` | Configuration for the stability filter (`checkIntervalMs`, `stableChecks`). |
| `DedupFilterOptions` | Options for creating a `DedupFilter` (`windowMs`, default `60000`). |

## Type aliases

| Symbol | Definition | Description |
| --- | --- | --- |
| `KnownEventKind` | `"create" \| "modify" \| "remove"` | Built-in file-system event kinds the watcher can detect. |
| `EventKind` | `KnownEventKind \| (string & Record<never, never>)` | File-system event kind; new runtime kinds require doctrine review. |
| `KnownWatchStrategy` | `"native" \| "polling" \| "hybrid"` | Built-in watch strategies for detecting file changes. |
| `WatchStrategy` | `KnownWatchStrategy \| (string & Record<never, never>)` | Watch-strategy identifier; built-in factory values remain runtime validated. |

## Internals

The concrete strategy classes (`NativeStrategy`, `PollingStrategy`, `HybridStrategy`) and their
option interfaces (`NativeStrategyOptions`, `PollingStrategyOptions`, `HybridStrategyOptions`)
are marked `@internal`. They are selected automatically by `FileWatcher` based on the configured
paths and are not part of the supported public contract -- construct watchers via `createWatcher`
or `new FileWatcher(...)` instead.

---

Back to the [reference overview](/reference/).
