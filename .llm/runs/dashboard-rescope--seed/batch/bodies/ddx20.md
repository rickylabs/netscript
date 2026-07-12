## DDX-20 / S3: Runtime-Config Monitor & Control (flagship)

### Summary
A live view of the runtime override layer: someone just flipped feature flag `checkout-v2` to 30% rollout / disabled job `nightly-reconcile`. Pipes the existing `runtime-config/application/watcher.ts` change events into a dashboard SSE feed.

### DX thesis
The override layer is invisible to both Aspire and Scalar; NetScript's watcher already hot-reloads it but only emits console scrollback. Surfacing it is nearly free.

### Scope
- Live `activity-feed` (generalized, non-chat) of override changes with `data-tone` by kind.
- Current-state `stats-grid` per topic (active flags, disabled jobs/sagas/triggers, task overrides).
- `ns-step-timeline`-shaped version history of the `current` pointer (diff between versions: All/Compact/JSON).
- Follow switch on the SSE tail.
- **Write-back (v2, gated behind co-req #NUM_MUT — beta.7):** flip a feature flag, disable/enable a job/saga/trigger, clear a task override — from the UI, behind `confirmationMessage` + CLI-equivalent CodeBlock. **Surface check (2026-07-06):** `@netscript/runtime-config` exposes only read+watch use-cases (`loadRuntimeConfig`, the 4 getters, `isFeatureEnabled`, `watchRuntimeConfig`, `summarizeRuntimeConfig`); the CLI's `runtime-config-writer.ts` is a deploy-provisioning adapter, not an operator mutation path. **S3 therefore ships read-only in beta.6**; the write controls land once #NUM_MUT (runtime-config mutation use-cases) ships and must round-trip through the store the watcher observes.
- Data: existing watcher over 5 topics + versioned `current` pointer, piped to `/_netscript/config/runtime/subscribe` (SSE) — no new backend for the read path.

### Non-goals
- Not Aspire config/env display (that's infra config); this is NetScript runtime *overrides*. Writes never bypass the store the watcher observes — a dashboard write must round-trip as a watcher change event (one write path, observed like any other).

### Acceptance criteria
- Flipping an override emits a live SSE event that renders in the feed; per-topic current state accurate; version diff renders.
- Write-back (post-#NUM_MUT): a UI flag-flip lands in the store, hot-reloads via the watcher, and appears in the feed as a normal change event with its CLI-equivalent recorded.
- Deep-link: disabled entity → its capability console (S7–S10); in ← S1 stat card.

### Dependencies
#423 (`/_netscript/config/runtime` + SSE). Watcher already exists. Write-back: co-req #NUM_MUT (beta.7).
