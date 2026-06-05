# Architecture

`@netscript/plugin-streams-core` is an Archetype 1 small-contract package.
It owns the schema, producer, config, telemetry, testing, and diagnostics
surface consumed by NetScript stream-aware packages.

The package intentionally has no dependency on `@netscript/plugin-streams`.
The runtime HTTP service belongs to the plugin package.

```text
consumer package
  -> @netscript/plugin-streams-core
       -> @durable-streams/state
       -> @durable-streams/client
```

The only runtime effect inside the package is producer network IO through
`@durable-streams/client`, which callers opt into by constructing a producer.

The telemetry subpath publishes NetScript-owned registration metadata without
importing `@netscript/telemetry`. URL discovery reads server env vars and
Vite-injected browser env vars directly, without depending on
`@netscript/sdk/discovery`.
