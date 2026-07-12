## feat(runtime-config): mutation use-cases — set/unset + versioned `current` pointer bump (S3 write-back co-req)

### Summary
`@netscript/runtime-config` today exposes only read+watch use-cases (`loadRuntimeConfig`, the per-topic getters, `isFeatureEnabled`, `watchRuntimeConfig`, `summarizeRuntimeConfig`); the CLI's `runtime-config-writer.ts` is a deploy-provisioning adapter, not an operator mutation path. Add first-class **operator mutation use-cases** — set/unset an override (feature flag, disabled job/saga/trigger, task override) plus the versioned `current` pointer bump — so the dashboard's S3 write-back (#NUM_DDX20) and any future CLI verb share one write path.

### DX thesis
One write path, observed like any other: a mutation must land in the same store the watcher observes and round-trip as a normal watcher change event (S3 renders it live). One generator, two callers — the epic's acceptance line 2.

### Scope
- Contract-first: schema/type contract for `setOverride` / `unsetOverride` per topic + `bumpCurrentVersion` (new version, atomic pointer move), then use-case implementations in `@netscript/runtime-config`.
- Thin oRPC mutation route under `/_netscript/config/runtime` (#423 mount), confirm-gated at the caller.
- CLI-equivalent surfaced for every mutation (`netscript config set ...` — exact verb naming decided in-slice).

### Non-goals
- No UI (that is S3 / DDX-20 #NUM_DDX20). No new store/persistence — write through the existing store the watcher reads. Not the deploy-provisioning writer path.

### Acceptance criteria
- A set/unset round-trips: store write → watcher hot-reload → change event on `/_netscript/config/runtime/subscribe` (SSE).
- Version history reflects the bump; `deno check --unstable-kv` green.

### Dependencies
Blocks the S3 write-back controls (DDX-20 #NUM_DDX20). Framework-source work → WSL Codex slice, never the docs/design lane. Part of #400.
