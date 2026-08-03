Verified against `0.0.2`. Documentation and configuration only — **not** a data-loss defect.

## Two undocumented behaviours

1. The framework prepends `/v1/stream/netscript` to the configured `streamPath`. A caller using the path they configured gets a 404 and reasonably concludes writes are being dropped.
2. The default service leaves `STREAMS_DATA_DIR` unset, which selects **in-memory** storage. Nothing in the scaffold surfaces that the default is non-durable.

## What this is not

A round-two report claimed durable streams drop writes. That is **wrong** — the reporter's own final raw-client test proved append/read works. Filing the accurate, narrower issue instead.

## Acceptance criteria

- [x] The path prefix is documented where `streamPath` is configured, or the configured path is used verbatim.
- [x] The in-memory default is stated explicitly in the scaffold and docs, with the setting needed to make it durable.
- [x] Starting a stream service with in-memory storage logs that its data is not durable.

