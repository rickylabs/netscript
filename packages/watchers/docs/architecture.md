# Architecture

`@netscript/watchers` is an Archetype 3 runtime/behavior package.

The package owns a long-running watch loop through `FileWatcher`, plus strategy selection, filter
composition, cancellation, and stop semantics.

## Public Surface

The root `mod.ts` forwards to `src/public/mod.ts`.

`src/public/mod.ts` exports:

- `createWatcher`,
- `FileWatcher`,
- watcher option and event types,
- strategy types,
- filter classes,
- filesystem utility helpers.

## Runtime Shape

```text
mod.ts
  -> src/public/mod.ts
       -> src/file-watcher.ts
       -> src/types.ts
       -> src/filters/*.ts
       -> src/strategies/*.ts
       -> src/fs.ts
```

`FileWatcher` composes strategies and filters. Strategies produce raw `WatchEvent` streams. Filters
narrow, stabilize, and deduplicate those events.

## Lifecycle

Each watcher instance owns:

- one options object,
- one abort controller,
- one selected strategy,
- one filter pipeline,
- one running state flag.

`stop()` is idempotent and aborts the internal controller. A caller-supplied `AbortSignal` is also
honored.

## Debt

`src/file-watcher.ts` and `src/strategies/hybrid.ts` still use `console.warn` for runtime fallback
and access-failure visibility. That is tracked as AP-13 debt for the telemetry-integration wave.
