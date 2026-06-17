# Research — Wave 4 · 4c: sagas

Run ID: `feat-package-quality-wave4-runtimes--4c-sagas`
Branch: `feat/package-quality-wave4-runtimes-4c` (PR #20 → umbrella #16)
Base: umbrella `1896f854` (4a `2c24662` + 4b merged, pull-forward `128a0a8`)
Author: GENERATOR, 2026-06-09

## 1. Re-baseline findings (4a + 4b pull-forward confirmed)

| Check | Result |
|-------|--------|
| 4a merged into umbrella | `2c24662` |
| 4b merged into umbrella | `1896f854` (PR #19) |
| 4c base-synced | merge `128a0a8`, merge-base `1896f854` |
| `sagas-core ./streams` surface | Re-exports `@netscript/plugin-streams-core` (A3, doc-lint 0 post-4a) |
| `sagas-core ./integration/workers` surface | Re-exports `@netscript/plugin-workers-core` (A3, doc-lint 0 post-4b) |

**Conclusion:** Base is current. No merge work required. The upstream `./streams` and `./integration/workers` re-export surfaces are now clean (0 doc-lint attributed to upstream). All remaining 4c debt is sagas-owned.

## 2. Full-export `deno doc --lint` per entrypoint

Tool: `.llm/tools/run-deno-doc-lint.ts`.
Output: `measure-doc-lint-core.json` + `measure-doc-lint-plugin.json`.

### `@netscript/plugin-sagas-core` (19 entrypoints)

| Entrypoint | ptr | jsdoc | total | Top file (errors) |
|-----------|-----|-------|-------|-------------------|
| `./mod.ts` | 17 | 0 | 17 | root re-exports |
| `./src/abstracts/mod.ts` | 27 | 24 | 51 | `abstract-saga-bus.ts` (8), `abstract-saga-store.ts` (7) |
| `./src/adapters/mod.ts` | 23 | 23 | 46 | `saga-bus-legacy.ts` (14), `saga-bus-bridge.ts` (9) |
| `./src/agent/mod.ts` | 1 | 0 | 1 | `define-agent.ts` (1) |
| `./src/builders/mod.ts` | 14 | 0 | 14 | `define-saga.ts` (1) |
| `./src/config/mod.ts` | 11 | 0 | 11 | `saga-config-schema.ts` (10) |
| `./src/contracts/v1/mod.ts` | 19 | 18 | 37 | `sagas.contract.ts` (35) |
| `./src/domain/mod.ts` | 0 | 4 | 4 | `errors.ts` (4) |
| `./src/integration/publisher/mod.ts` | 6 | 3 | 9 | `saga-publisher-port.ts` (3) |
| `./src/integration/workers/mod.ts` | 8 | 2 | 10 | `types.ts` (6) |
| `./src/middleware/mod.ts` | 14 | 5 | 19 | `sse-events-middleware.ts` (4), `saga-middleware.ts` (4) |
| `./src/ports/mod.ts` | 35 | 40 | 75 | `saga-transport-port.ts` (9), `saga-bus-port.ts` (8), `saga-history-store-port.ts` (4) |
| `./src/presets/mod.ts` | 5 | 2 | 7 | `start-sagas.ts` (2) |
| `./src/runtime/mod.ts` | 58 | 48 | 106 | `saga-engine.ts` (9), `create-saga-runtime.ts` (9), `saga-scheduler.ts` (11) |
| `./src/stores/mod.ts` | 11 | 8 | 19 | pass-through to ports |
| `./src/streams/mod.ts` | 4 | 0 | 4 | `schema.ts` (3) |
| `./src/telemetry/mod.ts` | 6 | 53 | 59 | `instrumentation.ts` (43), `attributes.ts` (15) |
| `./src/testing/mod.ts` | 34 | 43 | 77 | `memory-saga-store.ts` (13), `recording-saga-store.ts` (10), `memory-saga-bus.ts` (13) |
| `./src/transports/mod.ts` | 24 | 84 | 108 | `list-transport.ts` (23), `redis-transport.ts` (20), `list-transport-subscription.ts` (18) |
| **TOTAL** | **48** | **349** | **397** | |

### `@netscript/plugin-sagas` (12 entrypoints)

| Entrypoint | ptr | jsdoc | total | Top file (errors) |
|-----------|-----|-------|-------|-------------------|
| `./contracts/v1/mod.ts` | 17 | 26 | 43 | `sagas.contract.ts` (40) |
| `./mod.ts` | 11 | 0 | 11 | root re-exports |
| `./services/src/main.ts` | 1 | 0 | 1 | `services/src/main.ts` (1) |
| `./src/aspire/mod.ts` | 7 | 0 | 7 | `sagas-contribution.ts` (7) |
| `./src/cli/mod.ts` | 11 | 7 | 18 | `commands.ts` (11), `sagas-cli-backend.ts` (3) |
| `./src/e2e/mod.ts` | 0 | 0 | 0 | — |
| `./src/plugin/mod.ts` | 11 | 0 | 11 | plugin re-exports |
| `./src/public/mod.ts` | 11 | 3 | 14 | `src/public/mod.ts` (11) |
| `./src/runtime/mod.ts` | 16 | 6 | 22 | `saga-publisher.ts` (10), `saga-supervisor.ts` (9) |
| `./src/scaffolding/mod.ts` | 0 | 6 | 6 | `saga-scaffolders.ts` (6) |
| `./streams/mod.ts` | 5 | 0 | 5 | `producer.ts` (3), `factory.ts` (1) |
| `./streams/server.ts` | 6 | 3 | 9 | `server.ts` (6) |
| **TOTAL** | **71** | **51** | **122** | |

**Family total: 519** (48 ptr + 349 jsdoc core + 71 ptr + 51 jsdoc plugin).

**Note:** The root `./mod.ts` undercounts for both packages (17 and 11 ptr respectively). The combined per-entrypoint run dedupes shared re-exports and gives the true surface count.

## 3. `deno publish --dry-run --allow-dirty`

| Unit | Result | Slow types | Notes |
|------|--------|------------|-------|
| `plugin-sagas-core` | **PASS** | 0 | Clean file list reviewed |
| `plugin-sagas` | **PASS** | 0 | 2 `unanalyzable-dynamic-import` warnings (non-blocking) |

Both PASS. No slow-type rebuild required.

## 4. `deno check --unstable-kv` over all entrypoints

| Unit | Command | Result |
|------|---------|--------|
| `plugin-sagas-core` | `deno check --unstable-kv` all 19 entrypoints | **PASS** (exit 0) |
| `plugin-sagas` | `deno check --unstable-kv` all 12 entrypoints | **PASS** (exit 0) |

**Pre-existing umbrella carry:** `packages/cli` fails TS9016/TS9027 in `src/maintainer/.../copy-official-plugin.ts` — byte-identical to base, Wave 6 CLI debt. NOT a 4c concern.

## 5. Consumer scan (F-5/F-16 challenge)

### `@netscript/plugin-sagas-core` entrypoint consumers

| Entrypoint | External consumers (outside sagas family) | Plugin-family consumers | Verdict |
|-----------|-------------------------------------------|------------------------|---------|
| `.` (root) | `packages/cli` fixture, `plugins/triggers` | `plugins/sagas` | **Retain** |
| `./builders` | None found | None found directly | **Retain** — builder API surface (defineSaga) |
| `./domain` | `plugins/triggers` (types) | `plugins/sagas` (4 imports) | **Retain** |
| `./ports` | None found | None found directly | **Retain** — port contract surface |
| `./runtime` | `plugins/triggers` | `plugins/sagas` (2 imports) | **Retain** |
| `./adapters` | None found | None found directly | **Retain** — adapter surface |
| `./transports` | JSDoc module ref only | None found directly | **Retain** — transport implementations |
| `./stores` | None found | None found directly | **Retain** — stable subpath for store implementers |
| `./middleware` | JSDoc module ref only | None found directly | **Retain** — Hono middleware surface |
| `./integration/workers` | `plugins/workers` | `plugins/sagas` (runtime) | **Retain** |
| `./integration/publisher` | None found | `plugins/sagas` (runtime) | **Retain** |
| `./telemetry` | None found | None found directly | **Retain for alpha** — OTEL instrumentation |
| `./config` | `packages/cli` fixture | `plugins/sagas` (CLI) | **Retain** |
| `./contracts/v1` | `packages/cli` (jsr-specifiers) | `plugins/sagas` (contracts) | **Retain** |
| `./streams` | None found | `plugins/sagas` (deno.json import map) | **Retain** — re-exports upstream |
| `./presets` | None found | None found directly | **Retain for alpha** — startSagas preset |
| `./abstracts` | None found | None found directly | **Retain for alpha** — abstract contracts |
| `./testing` | None found | None found directly | **Retain for alpha** — testing helpers |
| `./agent` | None found | None found directly | **Retain for alpha** — agent runtime surface |

**Zero-external-consumer entrypoints:** `./abstracts`, `./testing`, `./telemetry`, `./presets`, `./agent`. All retained for alpha (no-shim removal allowed) but flagged for future trimming post-alpha if consumer evidence remains zero.

### `@netscript/plugin-sagas` entrypoint consumers

| Entrypoint | External consumers | Verdict |
|-----------|-------------------|---------|
| `.` (root) | None found directly | **Retain** — manifest surface |
| `./public` | None found directly | **Retain** — public API |
| `./plugin` | None found directly | **Retain** — plugin contribution aliases |
| `./cli` | None found directly | **Retain** — CLI composition surface |
| `./scaffolding` | None found directly | **Retain** — scaffold surface |
| `./e2e` | None found directly | **Retain** — E2E gate surface |
| `./aspire` | None found directly | **Retain** — Aspire contribution |
| `./runtime` | None found directly | **Retain** — HTTP publisher, runner, supervisor |
| `./contracts` | None found directly | **Retain** — versioned contract re-export |
| `./services` | None found directly | **Retain** — service entrypoint |
| `./streams` | None found directly | **Retain** — stream surface |
| `./streams/server` | None found directly | **Retain** — server stream surface |

All 12 entrypoints retained. The plugin manifest (`src/public/mod.ts`) is the primary consumer-facing surface.

## 6. F-3 Layering audit (ports / adapters / transports / stores / middleware)

| Layer | Imports | Exports | Verdict |
|-------|---------|---------|---------|
| `ports/` | `domain/` only | Type-only contracts (SagaBusPort, SagaTransportPort, SagaStorePort, etc.) | **Clean** — pure contracts |
| `adapters/` | `ports/`, `domain/`, `@saga-bus/core` | `SagaBusBridge`, `SagaBusLegacy` — implement `SagaBusPort` | **Clean** — adapter implements port |
| `transports/` | `ports/` (SagaTransportPort) | `GarnetListTransport`, `NetScriptRedisTransport` — implement `SagaTransportPort` | **Clean** — transports swappable behind port |
| `stores/` | `ports/` (re-exports) | Pass-through barrel for store ports | **Acceptable** — provides stable subpath for store implementers without importing test-only memory stores |
| `middleware/` | `ports/`, `domain/`, `hono` | Hono middleware + SSE events | **Clean** — consumes ports, not adapters |

**Verdict:** Transports ARE swappable behind `SagaTransportPort`. The `stores/` barrel is a deliberate pass-through to separate store-contract imports from test-only memory stores. Retain with documented rationale.

## 7. F-1 over-cap files

| File | LOC | Cap | Over by | Package |
|------|-----|-----|---------|---------|
| `plugins/sagas/services/src/routers/v1.ts` | 715 | 350 | 365 | plugin |
| `packages/plugin-sagas-core/src/transports/redis-transport.ts` | 480 | 350 | 130 | core |
| `packages/plugin-sagas-core/src/transports/list-transport.ts` | 453 | 350 | 103 | core |

**3 over-cap files** (pre-research reported 2; `list-transport.ts` at 453 is also over-cap). All need concept-splits.

## 8. #96 carry triage (`services/routers/v1.ts` typing drift)

| Symptom | Classification | Action |
|---------|---------------|--------|
| v1 router uses `SagaServiceDatabaseClient` hand-typed Prisma interface | **Package debt** — type mismatches between generated Prisma client and hand-typed interface | Fix during ptr-fix / split slices |
| Generated-DB artifacts missing | **Generated artifact/environment** — Prisma schema generation | NOT package debt; requires `prisma generate` in CI/env |
| `check:sagas` task failure | **Environment** — depends on generated artifacts | Out of scope for 4c; document in drift |

**Conclusion:** Genuine package debt = the hand-typed Prisma interface leaks and the 715-LOC monolith. Generated-DB artifacts = environment. Do NOT scope Prisma generation fixes into 4c.

## 9. JSR audit surface scan

| Check | Core | Plugin |
|-------|------|--------|
| Scoped package name | ✓ `@netscript/plugin-sagas-core` | ✓ `@netscript/plugin-sagas` |
| Description | ✓ ≤250 chars | ✓ ≤250 chars |
| Valid exports | ✓ 19 entrypoints | ✓ 12 entrypoints |
| No slow types | ✓ 0 | ✓ 0 |
| Clean file list | ✓ (dry-run reviewed) | ✓ (dry-run reviewed) |
| ESM only | ✓ | ✓ |
| Module docs (`@module`) | Partial — root mod.ts has it; not all entrypoints | Partial — root mod.ts has it; not all entrypoints |
| Symbol docs | **397 missing** | **122 missing** |
| `publish:dry-run` task | ✓ Present | **✗ MISSING** (F-6) |
| `test` task | **✗ MISSING** (F-6) | ✓ Present |
| `check` enumerates entrypoints | **✗ NO** — only `mod.ts` | **✗ NO** — only `mod.ts` + `services/src/main.ts` |
| README LOC | 165 (≥150) | **99 (<150)** (F-7) |

**JSR score impact:** Documentation is the dominant factor. The 519 doc-lint errors directly impact the "Has docs for most symbols" and "Has module docs in all entrypoints" factors.

## 10. `unanalyzable-dynamic-import` warnings

| Unit | Count | Location | Decision |
|------|-------|----------|----------|
| `plugin-sagas` | 2 | `services/src/main.ts:82` (bootstrapModule), `src/runtime/saga-runner.ts:99` (specifier) | Accept-and-document (non-blocking) |

## 11. Open questions

1. **Zod / oRPC / `@saga-bus/core` ptr leaks:** 48 core + 71 plugin ptr errors. Third-party type leaks through public barrels. Fix strategy: package-owned structural types (Wave 3 `PluginPayloadSchema` precedent) or `@ignore` on derived exports.
2. **v1 router split scope:** The 715-LOC file contains handlers, helpers, Prisma interfaces, and KV fallback. Splitting it may expose additional typing drift from #96.
3. **Transport split consumers:** `redis-transport.ts` and `list-transport.ts` are imported by `transports/mod.ts` only. Internal split is safe; no external consumers reference the classes directly.

## 12. Research tooling note

Tool `.llm/tools/run-deno-doc-lint.ts` used for per-entrypoint attribution. Provides:
- Auto-discovery of entrypoints from `deno.json exports`
- Per-entrypoint doc-lint attribution (ptr + jsdoc + total)
- Per-file attribution (sorted by error count)
- JSON output for plan consumption
