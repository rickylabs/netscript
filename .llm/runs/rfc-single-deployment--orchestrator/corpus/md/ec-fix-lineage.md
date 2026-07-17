# eis-chat fix lineage (#135 #136 #137 #147 #149)

## #135 — fix(kb): shared Garnet queue fixes multi-process split-brain Deno KV (#133) + desktop perms (#118)
- state: closed (closed 2026-07-03T10:43:13Z) | milestone: none | labels: none
- url: https://github.com/rickylabs/eis-chat/pull/135

Closes the mechanism half of #133. Live-verified via the Aspire CLI/MCP.

## Problem
The Aspire generator no-ops the `DenoKv` cache engine, so in **multi-process** mode workers-api (enqueue) and the workers processor (listen) each open their OWN per-process Deno KV → the `embed-document` job is enqueued in one KV and listened on another, so it never runs (KB doc pins `pending`). This is the real root cause of the stalled KB ingestion (deeper than the previously-suspected release blocker).

## Fix (Docker-less Windows bare metal)
Shared Deno KV Connect (`denokv`) needs Docker, which this host lacks, so run **Garnet** (RESP-compatible, .NET-native) as an Aspire **executable** and point the workers at it. The SDK's `@netscript/kv/redis` + `@netscript/queue` `RedisAdapter` then give a real cross-process queue (`LPUSH`/`BRPOPLPUSH`).

- `aspire/.helpers/register-infrastructure.mts` — `addExecutable('garnet','garnet-server', …)` (hand-edit, keep on regen).
- `aspire/.helpers/register-plugins.mts` + `register-background.mts` — inject `GARNET_URI`/`REDIS_URI`/`CACHE_PROVIDER=garnet` + `waitFor(garnet)` into workers-api + the workers processor.
- `workers/runtime.ts` — `import jsr:@netscript/kv/redis` to self-register the KV adapter before `getKv()`.
- `apps/dashboard/deno.json` — `--allow-all` on `desktop:dev`/`desktop:build` so the deno-desktop runtime can read env (was crashing on `PORT`). (Partial #118; full desktop render is a follow-up PR.)

## Verification (Aspire CLI/MCP only — shared stack never hacked)
garnet Running/Healthy; workers-api + workers both `WaitFor(garnet)` + carry `GARNET_URI`; a job triggered on **workers-api** was **executed by the separate workers processor** (cross-process delivery over Garnet). See #133 for logs.

## Requires / upstream
`dotnet tool install -g garnet-server`. Proper generator fix + self-provisioning: rickylabs/netscript#372 (Garnet executable) + #371 (Deno KV Connect).

## Reconciliation
Overlaps #134 (NetScript beta.1 bump) on `register-plugins.mts` (different hunks) and `deno.lock`, and this branch's `workers/runtime.ts` redis import is pinned to `alpha.19`. To be rebased onto master after #134 merges, with the redis import bumped to `beta.1`.

## #136 — fix(desktop): render the deno desktop window (blank WebView2)
- state: closed (closed 2026-07-03T10:46:54Z) | milestone: none | labels: none
- url: https://github.com/rickylabs/eis-chat/pull/136

## Problem
The `deno desktop` app opens a window frame but the webview surface is BLANK.

**Verified diagnosis so far:** the internal Fresh server is fine (returns the full 23KB eis-chat HTML after the `--allow-all` permission fix on the base branch). WebView2 Runtime v149 is installed. The remaining failure is `Failed to create WebView2 environment` at webview creation time.

> **Stacked on `fix/garnet-kb-queue`** (contains the prerequisite desktop `--allow-all` fix + Garnet wiring). Diff includes that branch until it merges.

## Plan
- **Phase A - standalone:** get `deno task desktop:dev` (apps/dashboard) to actually render in an interactive session. Investigate WebView2 environment creation (user-data folder, desktop config block, launch context).
- **Phase B - within Aspire:** fix the desktop resource PORT collision with `dashboard` (:8010) in `aspire/.helpers/register-apps.mts`, and determine the launch mode (interactive `aspire run` vs detached `aspire start`) that allows WebView2 env creation.

## Status
- [ ] Phase A: standalone render + evidence
- [ ] Phase B: Aspire resource render + evidence
- [ ] Root-cause writeup

Generated with [Claude Code](https://claude.com/claude-code)

## #137 — fix(desktop): stop CEF bundle crashing at launch on MCP stdio require('./windows.js')
- state: closed (closed 2026-07-03T23:18:03Z) | milestone: none | labels: none
- url: https://github.com/rickylabs/eis-chat/pull/137

## Problem
The `deno desktop` CEF window died at launch with:
```
Error: Cannot find module './windows.js'
  ...\_fresh\server\mcp.mjs:18635  code: MODULE_NOT_FOUND
```
`@tanstack/ai-mcp/stdio` pulls in `cross-spawn -> which -> isexe`, whose top-level `require("./windows.js")` the desktop bundler flattens to **eager module-init** but never emits the sibling file. So merely LOADING the embedded Fresh server bundle crashed the window — before any chat/tool call.

## Fix
1. **`lib/mcp.ts`** — lazy `await import('@tanstack/ai-mcp/stdio')` inside the stdio branch of `transportFor`, replacing the static top-level import. Deno code-splits the isexe chain into a deferred `_fresh/server/stdio.mjs` chunk that only loads when a real stdio child is actually spawned (bare `deno task dev`), keeping it out of the eager module graph the desktop bundle evaluates on load. `transportFor`/`mcpTransportFor` become async; `mcpPool` + `mcp-status.ts` updated to await.
2. **`aspire/.helpers/register-apps.mts`** — the desktop resource now sets `LEGACY_ARCHEO_MCP_URL` / `EXCALIDRAW_MCP_URL` (the envs `mcp.ts` actually reads), mirroring the dashboard block. Previously it set only the `services__...` discovery vars, so under Aspire the window fell into the broken stdio path instead of the HTTP transport.

## Verification
Rebuilt `_fresh`: `mcp.mjs` (eager, loaded at launch) now has **0** `windows.js` references (was the crash site); the reference lives only in the deferred `stdio.mjs` chunk, which the Aspire path never imports.

## Follow-up (not in this PR)
Switch the desktop resource from build-mode (`desktop:predev`) to a true dev/watch flow for easier debugging — tracked separately.

Generated with [Claude Code](https://claude.com/claude-code)

## #147 — Add local model and vision provider support
- state: closed (closed 2026-07-14T09:24:04Z) | milestone: none | labels: none
- url: https://github.com/rickylabs/eis-chat/pull/147

## Summary

- add configurable local and cloud OCR providers, including offline Tesseract support
- add local embedding and model discovery configuration
- move OpenAI chat to the native Responses adapter and update provider reasoning/output options
- extend contracts, workers, settings UI, documentation, and tests

## Validation

- `deno task check`
- `deno task test` (135 passed)

## #149 — Harden local inference, dependency catalogs, and desktop runtime
- state: closed (closed 2026-07-15T13:55:48Z) | milestone: none | labels: none
- url: https://github.com/rickylabs/eis-chat/pull/149

## Summary

This change set completes the local and air-gapped inference work and folds in the related dependency, rendering, desktop, and repository cleanup discovered during validation.

### Local OCR and embeddings

- supports offline screenshot OCR through Tesseract.js and configurable local vision providers
- supports keyless OpenAI-compatible local embedding endpoints such as LM Studio
- isolates the embedding query cache by provider/model configuration
- allows embeddings to be explicitly disabled without issuing network requests
- avoids sending air-gapped sessions to OpenAI when a local provider is selected

### Vector compatibility

- prevents Turso cosine-distance failures after changing embedding models
- filters knowledge chunks, memories, and skill vectors by query-vector dimension
- preserves keyword-only degradation when no compatible vector is available
- adds regression coverage for mixed-dimension data in all three stores

### Chat, screenshots, and analytics

- serves persisted screenshot attachments back through the dashboard
- renders attachment previews with an accessible native-dialog lightbox
- improves attachment ingestion sequencing so chat messages reference persisted documents
- adds estimated output cost grouped by model and serving router to usage analytics
- retains OpenAI Responses API behavior for reasoning models with function tools

### Dependency and schema stability

- moves npm dependency ownership into the root package catalog with member package manifests
- updates and aligns TanStack AI adapters, Prisma, Preact, Tailwind, and supporting packages
- anchors the Zod 4 peer while leaving dependencies that legitimately require Zod 3 isolated
- replaces affected TanStack tool schemas with raw JSON Schema at the provider boundary
- pins and aliases Preact Signals to one SSR module identity, fixing the server-side `Cycle detected` failure

### Desktop and Aspire

- uses CEF for reliable Windows rendering
- keeps Fresh/Vite HMR enabled for desktop development
- merges Vite output and disables terminal decoration so Deno Desktop can discover the dev-server URL
- removes the unnecessary production prebuild before desktop HMR
- wires the Aspire desktop resource directly to `desktop:dev`

### Cleanup

- removes stale design-sync previews and obsolete scaffold coverage
- updates lockfiles and Deno workspace configuration for Deno 2.9
- includes the remaining UI polish and package-manifest cleanup from the working tree

## Root causes addressed

1. OCR and embedding selection were independent; choosing offline OCR did not stop embeddings from using OpenAI.
2. Turso vector functions reject comparisons between vectors with different dimensions.
3. TanStack's Standard Schema converter observed an incompatible Zod runtime at the tool boundary.
4. Fresh/NetScript and the app loaded Preact Signals under different Vite module identities, installing nested render hooks.
5. Deno Desktop 2.9.2 scans only child stdout for an undecorated Vite `Local:` URL.
6. The generated Aspire helper still invoked the removed `desktop:predev` task.

## Validation

- `deno check`
- dashboard production Vite build (client and SSR)
- 34 focused tests covering embeddings, vector stores, skills, OpenAI, OpenRouter, and the chat route
- Aspire desktop resource reports `Running / Healthy`
- Fresh HMR handshake succeeds at `http://localhost:5173/`
- CEF runtime loads and starts successfully

