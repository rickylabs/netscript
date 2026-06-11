# Worklog — Sub-wave 5a: `@netscript/service`

## Bootstrap

- Forked `feat/package-quality-wave5-apps-5a-service` from umbrella tip `09f4845`
  (mandate said dfab7a4; 09f4845 = docs/handover commit atop it — drift D-1).
- Worktree: `.worktrees/wave5-apps-5a-service`; run dir created.

## Measure-first

- `.llm/temp/measure-5a-service.ts` (raw deno via `Deno.Command`, bypasses rtk) →
  `measure-5a.json`. check PASS; doc-lint 23 (14 ptr / 8 ret / 1 jsdoc); dry-run FAIL
  = 8 slow-types + 6 excluded-module; 0 tests. Matches umbrella re-baseline exactly,
  except excluded-module ×6 now root-caused to root `deno.json` exclude (drift D-2).

## Research

See `research.md`. Highlights: full ptr decomposition; telemetry `src/orpc/_types.ts`
identified as the template for `StandardHandlerPlugin` removal; RFC 14 §5.3 seam =
router-as-input + `build()` preserved; consumer census shows zero users of `build()`,
`addHealthCheck`, `addReadinessCheck`, or the `ServiceBuilder` type name.

## Design

**Public surface (after 5a, single `.` entrypoint):**

- Layer 1 primitives: `createHealthHandler`, `createLivenessHandler`,
  `createReadinessHandler`, `healthChecks`, `HealthCheck`, `HealthResponse`,
  `HealthHandlerOptions`; `createRPCPlugins`, `createRPCHandler`,
  `createOpenAPIHandler`, `createNotFoundHandler`, `createErrorHandler`,
  `RPCHandlerConfig`; `createOpenAPISpec`, `createScalarDocs`, `createScalarJs`,
  `OpenAPIConfig`, `ScalarDocsOptions`
- Layer 2 builder: `createService`, `ServiceBuilder` (interface), `ServiceConfig`
- Layer 3 preset: `defineService`, `DefineServiceOptions`
- Types module: `ServiceRouter`, `ServiceApp`, `RunningService`, `FetchHandler`,
  `ServiceHandlerPlugin`, `ServiceMiddleware`, `CorsOptions`, `Database`,
  `DbContext`, `ContextFactory`, `ServiceHandler`
- Sibling re-export kept: `LoggerMiddlewareOptions` (from `@netscript/logger`)

**Domain vocabulary:** service, router (oRPC, input), builder, preset
(`defineService`), primitives (handler factories), running service (serve handle),
diagnostics (internal DB-connectivity UX).

**Ports / seams:** router is always an input (RFC 14 unified-mode seam); `build()`
returns a non-listening `ServiceApp` (mountable); `serve({signal})` is the only place
`Deno.serve` is touched; logger + telemetry consumed via `@netscript/*` siblings;
oRPC interop via structural types only (telemetry precedent).

**Constants:** ENGINE_CONFIGS (diagnostics, internal), default port/env names
(`PORT`, `DB_PROVIDER`, `NETSCRIPT_DEBUG`, `DENO_ENV`) — keep as documented constants
in src/, not magic strings at call sites.

**Commit slices:** 15 (plan §4). Slice 2 is an intentionally transient rename-only
slice (lesson: rename slices transient). Slice 15 = root-exclude lift + full sweep.

**Deferred scope:** plan §8.

**Contributor path:** README quickstart (defineService) → builder recipes →
docs/architecture (layered surface + seam notes) → tests as living examples
(doctest runner mirrors README).

## Hand-off

Artifacts ready for PLAN-EVAL (separate session): research.md, plan.md (PROPOSED, not
locked), drift.md, context-pack.md, measure-5a.json. No implementation performed.

## Implementation

### Slice 1/15 — D-10 standardize deno.json

| Field | Evidence |
| --- | --- |
| Commit | `0785a8f` — `Standardize service package metadata for publish gates` |
| Changed | `packages/service/deno.json` now declares description, MIT license, local check/test/lint/fmt/publish tasks, and publish include/exclude metadata that keeps `mod.ts`, future `src/`, docs, README, and `assets/scalar.min.js` in the package. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command` from repo root: PASS exit 0, known `No matching files found` warning while root `deno.json` still excludes `packages/service/` until slice 15. Package-local rerun with `--config packages/service/deno.json` produced the same exit-0 warning, consistent with drift D-2. |
| Concept of done | Metadata-only slice; no source files created. Publish metadata preserves D-9 asset inclusion and prepares D-11 root-exclude lift. |
| Drift | none |

PLAN-EVAL advisory fold-ins started in this slice: research records Aspire as N/A for this package, and plan exit gates now name jsr-audit publishability target `>=7/10`.

### Slice 2/15 — D-1 move sources under `src/`

| Field | Evidence |
| --- | --- |
| Commit | `d9897c0` — `Move service sources under src without behavior changes` |
| Changed | `builders/service-builder.ts` moved to `src/builder/service-builder.ts`; `primitives/*` moved to `src/primitives/*`; `presets/define-service.ts` moved to `src/presets/define-service.ts`; root `mod.ts`, preset import, and Scalar asset URL were updated for the new paths. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. A `--no-config` probe reached the moved files and failed only on unresolved bare imports, as expected without `packages/service/deno.json` imports. |
| Concept of done | Every moved file remains reachable from `mod.ts`. No new behavior files or speculative folders were added; `src/` now contains only the planned builder, primitives, and presets roles. |
| Drift | none |

### Slice 3/15 — D-3/D-4/D-6 package-owned public types

| Field | Evidence |
| --- | --- |
| Commit | `88e0cc0` — `Add service public structural types` |
| Changed | Added `packages/service/src/types.ts` and exported its public structural contracts from `mod.ts`: `ServiceRouter`, `ServiceApp`, `RunningService`, `FetchHandler`, `ServiceHandlerPlugin`, `ServiceMiddleware`, `CorsOptions`, `Database`, `DbContext`, `ContextFactory`, and supporting context/result types. |
| Gate | `deno check --unstable-kv packages/service/mod.ts` via raw `Deno.Command`: PASS exit 0 with known root-exclude warning. Root formatter cannot target service while excluded; new code was manually wrapped to root style and final slice 15 owns the authoritative fmt gate. |
| Concept of done | New file is reachable from the public surface, contains only named public vocabulary required by D-3/D-4/D-6, avoids upstream type exports, and gives later slices one file to copy when adding structural mirrors. |
| Drift | none |
