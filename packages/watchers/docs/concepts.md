# Concepts

## Watch Event

A `WatchEvent` is the normalized unit emitted by a watcher.

It contains:

- `path`,
- `kind`,
- `timestamp`,
- `fileInfo`,
- `contentHash`.

## Strategy

A strategy is the source of file events.

Native strategies use platform filesystem notifications. Polling strategies scan paths on an
interval. Hybrid strategies combine both where useful.

## Filter

A filter is an async transform over watch events.

The built-in filters are:

- `GlobFilter`,
- `StabilityFilter`,
- `DedupFilter`.

## Stability

Stability checks wait for file metadata to stop changing before an event is emitted. This prevents
consumers from reading half-written files.

## Deduplication

Deduplication computes content hashes and suppresses repeated content events inside a configured
time window.

## Shutdown

Shutdown is explicit. Call `stop()` or abort the configured signal. Consumers should also break out
of their `for await` loop when their surrounding runtime is stopping.
