# Research — Wave 4 · 4b: workers

Run ID: `feat-package-quality-wave4-runtimes--4b-workers`
Branch: `feat/package-quality-wave4-runtimes-4b` (PR #19 → umbrella #16)
Base: umbrella `2c24662` (4a merged) + 4b merge `173357c`
Author: GENERATOR, 2026-06-09

## 1. Re-baseline findings (4a pull-forward confirmed)

| Check | Result |
|-------|--------|
| 4a merged into umbrella | `2c24662` |
| 4b base-synced | merge `173357c`, merge-base `2c24662` |
| `workers-core ./streams` surface | Re-exports `@netscript/plugin-streams-core` (A3, doc-lint 0 post-4a) |
| `plugin-streams-core` consumer surface | Clean, no breaking changes to workers imports |

**Conclusion:** Base is current. No merge work required.

## 2. Full-export `deno doc --lint` per entrypoint

Tool: `.llm/tools/run-deno-doc-lint.ts` (new, promoted to `.llm/tools/`).

### `@netscript/plugin-workers-core` (16 entrypoints after fold)

| Entrypoint | ptr | jsdoc | total | Top file |
|-----------|-----|-------|-------|----------|
| `./mod.ts` | 0 | 0 | 0 | — |
| `./src/builders/mod.ts` | 14 | 0 | 14 | `job-builder.ts` (4), `task-builder.ts` (4) |
| `./src/config/mod.ts` | 22 | 0 | 22 | `workers-config.ts` (15), `job-config.ts` (4), `task-config.ts` (2) |
| `./src/contracts/v1/mod.ts` | 23 | 19 | 42 | `workers.contract.ts` (35) |
| `./src/domain/public-schema.ts` | 75 | 64 | 139 | Zod `.d.cts` (75 ptr) + `job-spec.ts` (9) |
| `./src/executor/mod.ts` | 29 | 29 | 58 | `multi-runtime-task-executor.ts` (6), adapters (3×2) |
| `./src/presets/mod.ts` | 2 | 0 | 2 | presets barrel |
| `./src/registry/mod.ts` | 11 | 45 | 56 | `kv-job-registry.ts` (20), `memory-job-registry.ts` (11), `kv-task-registry.ts` (10) |
| `./src/runtime/mod.ts` | 33 | 8 | 41 | `composition-root.ts` (6), `job-dispatcher.ts` (3), `in-process-job-runner.ts` (5) |
| `./src/shutdown/mod.ts` | 0 | 8 | 8 | `shutdown-manager.ts` (8) |
| `./src/state/mod.ts` | 5 | 18 | 23 | `execution-state.ts` (21) |
| `./src/streams/mod.ts` | 7 | 0 | 7 | `schema.ts` (4), `producer.ts` (1) |
| `./src/telemetry/mod.ts` | 1 | 15 | 16 | `instrumentation.ts` (15) |
| `./src/abstracts/mod.ts` | 12 | 45 | 57 | `task-runtime-adapter.ts` (12), `job-scheduler.ts` (7), `task-executor.ts` (5), `workers-command.ts` (5), `workers-item-scaffolder.ts` (5) |
| `./src/testing/mod.ts` | 24 | 32 | 56 | `memory-job-storage.ts` (10), `memory-worker.ts` (10), `job-fixtures.ts` (4) |
| `./src/workflow/mod.ts` | 10 | 21 | 31 | `workflow-executor.ts` (10), `workflow-state.ts` (8), `workflow-step-runner.ts` (3) |
| **TOTAL** | **180** | **280** | **460** | |

**Note:** `./contracts` and `./contracts/v1` both point to `src/contracts/v1/mod.ts` (duplicate alias). The `./contracts` export will be folded into `./contracts/v1` only, reducing the effective entrypoint count from 17 to 16.

### `@netscript/plugin-workers` (9 entrypoints)

| Entrypoint | ptr | jsdoc | total | Top file |
|-----------|-----|-------|-------|----------|
| `./mod.ts` | 0 | 0 | 0 | — |
| `./contracts/v1/mod.ts` | 38 | 19 | 57 | `workers.contract.ts` (40) |
| `./src/aspire/mod.ts` | 6 | 0 | 6 | `workers-contribution.ts` (6) |
| `./src/cli/composition/main.ts` | 13 | 11 | 24 | `commands.ts` (22) |
| `./src/scaffolding/mod.ts` | 8 | 21 | 29 | `task-scaffolders.ts` (16), `job-scaffolders.ts` (8) |
| `./services/src/main.ts` | 1 | 0 | 1 | `services/src/main.ts` (1) |
| `./streams/mod.ts` | 5 | 0 | 5 | `producer.ts` (2), `factory.ts` (1) |
| `./streams/server.ts` | 7 | 0 | 7 | `server.ts` (7) |
| `./worker/mod.ts` | 10 | 9 | 19 | `worker.ts` (9), `scheduler-options.ts` (3) |
| **TOTAL** | **83** | **60** | **143** | |

**Family total: 603** (180 ptr + 280 jsdoc + 143 plugin = 603).

## 3. `deno publish --dry-run --allow-dirty`

| Unit | Result | Slow types |
|------|--------|------------|
| `plugin-workers-core` | **PASS** | 0 |
| `plugin-workers` | **PASS** | 0 |

Both PASS. No slow-type rebuild required.

## 4. `deno check --unstable-kv` over all entrypoints

| Unit | Command | Result |
|------|---------|--------|
| `plugin-workers-core` | `deno check --unstable-kv` all 16 entrypoints | **PASS** (exit 0) |
| `plugin-workers` | `deno check --unstable-kv` all 9 entrypoints | **PASS** (exit 0) |

**Pre-existing umbrella carry:** `packages/cli` fails TS9016/TS9027 in `src/maintainer/.../copy-official-plugin.ts` — byte-identical to base, Wave 6 CLI debt. NOT a 4b concern.

## 5. Consumer scan (F-5/F-16 challenge)

### `@netscript/plugin-workers-core` entrypoint consumers

| Entrypoint | External consumers (outside workers family) | Plugin-family consumers | Verdict |
|-----------|---------------------------------------------|------------------------|---------|
| `.` (root) | `packages/cli` fixture, `plugins/triggers` jobs | `plugins/workers` | **Retain** |
| `./builders` | None found | None found directly | **Retain** — builder API surface |
| `./contracts/v1` | `plugins/triggers` (types), `packages/cli` | `plugins/workers/contracts/v1` | **Retain** |
| `./contracts` (dup) | `plugins/workers/contracts.ts` only | — | **FOLD** into `./contracts/v1` |
| `./registry` | None | `plugins/workers/services` | **Retain** |
| `./state` | None | `plugins/workers/services`, `plugins/workers/worker` | **Retain** |
| `./executor` | None | `plugins/workers/bin/runtime`, `plugins/workers/worker` | **Retain** |
| `./workflow` | None | None found | **Retain for alpha** — no external consumers yet, but part of public API |
| `./streams` | None | `plugins/workers/streams`, `plugins/triggers/streams` | **Retain** |
| `./presets` | None | None found | **Retain for alpha** — startWorkers/startCombined surface |
| `./shutdown` | None | None found | **Retain for alpha** — lifecycle surface |
| `./schemas` | None | `plugins/workers/src/public/mod.ts` | **Retain** |
| `./telemetry` | None | None found | **Retain for alpha** — OTEL instrumentation surface |
| `./abstracts` | None | `plugins/workers/src/cli`, `plugins/workers/src/scaffolding` | **Retain for alpha** — plugin-internal but public seam |
| `./testing` | None | None found | **Retain for alpha** — testing helpers surface |
| `./config` | `packages/cli` fixture | `plugins/workers/src/cli` | **Retain** |
| `./runtime` | `plugins/triggers`, `packages/cli` | `plugins/workers/services`, `plugins/workers/worker`, `plugins/workers/bin/runtime` | **Retain** |

**Fold decision:** `./contracts` → `./contracts/v1`. Only consumer is `plugins/workers/contracts.ts` which can be updated to import from `./contracts/v1`. Reduces entrypoints from 17 → 16.

**Zero-external-consumer entrypoints:** `./abstracts`, `./testing`, `./telemetry`, `./shutdown`, `./presets`, `./workflow`. All are retained for alpha (no-shim removal allowed) but flagged for future trimming post-alpha if consumer evidence remains zero.

### `@netscript/plugin-workers` entrypoint consumers

| Entrypoint | External consumers | Verdict |
|-----------|-------------------|---------|
| `.` (root) | `plugins/sagas/src/public/mod.ts` | **Retain** |
| `./aspire` | None found (Aspire runtime loads dynamically) | **Retain** |
| `./cli` | None found | **Retain** — CLI composition surface |
| `./contracts` | None found | **Retain** — contract re-export |
| `./scaffolding` | None found | **Retain** — scaffold surface |
| `./services` | None found (Aspire runtime loads dynamically) | **Retain** — service entrypoint |
| `./streams` | None found | **Retain** — stream re-export |
| `./streams/server` | None found | **Retain** — server stream surface |
| `./worker` | None found | **Retain** — worker/scheduler surface |

All 9 entrypoints retained. The plugin manifest (`src/public/mod.ts`) is consumed by `plugins/sagas`.

## 6. #96 carry triage (`check:workers` failure)

| Symptom | Classification | Action |
|---------|---------------|--------|
| Worker-job typing drift | **Package debt** — type mismatches between core and plugin | Fix during ptr-fix slices |
| Generated-DB artifacts missing | **Generated artifact/environment** — Prisma schema generation | NOT package debt; requires `prisma generate` in CI/env |
| `check:workers` task fails | **Environment** — depends on generated artifacts | Out of scope for 4b; document in drift |

**Conclusion:** Genuine package debt = the typing drift (private-type-ref leaks between core and plugin). Generated-DB artifacts = environment. Do NOT scope Prisma generation fixes into 4b.

## 7. JSR audit surface scan

| Check | Core | Plugin |
|-------|------|--------|
| Scoped package name | ✓ `@netscript/plugin-workers-core` | ✓ `@netscript/plugin-workers` |
| Description | ✓ ≤250 chars | ✓ ≤250 chars |
| Valid exports | ✓ 16 entrypoints | ✓ 9 entrypoints |
| No slow types | ✓ 0 | ✓ 0 |
| Clean file list | ✓ (dry-run file list reviewed) | ✓ (dry-run file list reviewed) |
| ESM only | ✓ | ✓ |
| Module docs (`@module`) | Partial — root mod.ts has it; not all entrypoints | Partial — root mod.ts has it; not all entrypoints |
| Symbol docs | **603 missing** | **143 missing** |
| `publish:dry-run` task | ✓ Present | **✗ MISSING** (F-6) |
| `check` enumerates entrypoints | **✗ NO** — only `mod.ts` | **✗ NO** — only 4 files |

**JSR score impact:** Documentation is the dominant factor. The 603 doc-lint errors directly impact the "Has docs for most symbols" and "Has module docs in all entrypoints" factors.

## 8. F-1 over-cap files

| File | LOC | Cap | Over by |
|------|-----|-----|---------|
| `packages/plugin-workers-core/src/contracts/v1/workers.contract.ts` | 500 | 350 | 150 |
| `plugins/workers/worker/scheduler.ts` | 468 | 350 | 118 |

Both need concept-splits. The `.contract.ts` file is a generated-like schema contract file (similar to A6 treatment in doctrine). The `scheduler.ts` is runtime behavior.

## 9. `unanalyzable-dynamic-import` warnings

| Unit | Count | Location | Decision |
|------|-------|----------|----------|
| `plugin-workers-core` | 1 | Runtime dynamic loader | Accept-and-document (non-blocking) |
| `plugin-workers` | 2 | CLI + service dynamic imports | Accept-and-document (non-blocking) |

## 10. Open questions

1. **Zod schema `.d.cts` private-type-ref:** 75 of the 180 core ptr errors originate from `zod/4.4.3/v4/classic/schemas.d.cts`. These are third-party type leaks through `public-schema.ts`. Fix strategy: package-owned structural types (Wave 3 `PluginPayloadSchema` precedent) or `@ignore` on the Zod-derived exports.
2. **Plugin version mismatch:** `plugins/workers/src/public/mod.ts` declares version `0.1.0` but `deno.json` says `0.0.1-alpha.0`. This is a real bug to fix.
3. **Plugin manifest type cast:** `workersManifest as unknown as WorkersPluginManifest` — the manifest is built with `definePlugin` but cast to a hand-written interface. This may cause typing drift.

## 11. Research tooling note

New tool `.llm/tools/run-deno-doc-lint.ts` created and promoted. Provides:
- Auto-discovery of entrypoints from `deno.json exports`
- Per-entrypoint doc-lint attribution (ptr + jsdoc + total)
- Per-file attribution (sorted by error count)
- JSON output for plan consumption

Used for this research and available for future package-quality waves.
