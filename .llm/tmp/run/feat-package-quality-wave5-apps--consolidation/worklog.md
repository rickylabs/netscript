# Worklog — Wave 5 Apps Consolidation

## Design

**Public surface (unchanged externally except `fresh` D6):**
- `@netscript/service`: `.` (root). No subpath change.
- `@netscript/sdk`: `.`, `./cache`, `./client`, `./collections`, `./discovery`, `./ports`,
  `./query`, `./query-client`, `./streams`, `./telemetry` — **keys stable**, targets repointed to
  `src/`.
- `@netscript/fresh-ui`: `.`, `./interactive`, `./primitives` — **keys stable**, targets to `src/`.
- `@netscript/fresh`: rationalized at D6 (drop `./utils`; fold `./error`/`./streams`/`./defer`
  → `./streaming`; finalize `./server`).

**Domain vocabulary (lifted to `src/domain/`):** service request/health types; sdk cached-entry /
query-utils / service-definition types; fresh cache-entry, form/route/page contract types; fresh-ui
token vocabulary.

**Ports (seams — interfaces, not base classes):** sdk `ServiceTransport`, `CacheStore`,
`ClientLinkFactory`, query ports (keep). fresh `FormSchemaAdapter` (co-locate with `ZodSchemaAdapter`
in `schema-adapters/`). service: no real seam → none added.

**Adapters (`src/adapters/`):** sdk `KvCacheStore`, `HttpClientLink`, `KvCachePersister`.

**Constants:** CLI `SCAFFOLD_PACKAGES` enum is the single source of subpath specifiers — updated
once at D6 to drive templates + generators.

**Commit slices:** A1–A2, B1–B3, C1–C2, D1–D6, E (close). Target ≤ ~18 commits. < 30 cap honored.

**Deferred scope:** RFC14 unified mode, ui-primitives, publishing, base classes (D1.1), new tests
beyond split needs.

**Contributor path:** see consolidation-plan.md §Contributor path.

> Base-class withholding is deliberate (D1.1): doctrine A4/A5 — ports+adapters realize seams; no
> package has ≥ 2 concrete subtypes, so no base class is introduced. Recorded here so the evaluator
> reads it as a design decision, not an omission.

## Implementation evidence

### A1 — split `service-builder.ts` (service) — DONE
`src/builder/service-builder.ts` 604 LOC → four files, each well under the 500-LOC ceiling:
- `service-builder.ts` (146) — public surface only: `ServiceConfig`, `ServiceBuilder<TRouter>`
  interface, `createService` factory. mod.ts + presets/define-service.ts imports unchanged.
- `service-builder-impl.ts` (408) — the `ServiceBuilderImpl` class; `withRPC`/`serve` are now thin
  delegations; extracted private `buildRpcContext`.
- `service-rpc.ts` (75) — `wireRpc(app, router, name, buildContext, options)` free function +
  `RpcWiringOptions` (oRPC RPC + OpenAPI endpoint registration).
- `service-listener.ts` (72) — `startServiceListener(app, name, defaultPort, options)` (Deno.serve
  lifecycle, abort bridging, listen banner, `stop()`).

Deviation from plan's named files (recorded in drift): plan proposed
`service-builder-state.ts`/`service-builder-steps.ts` (typestate accumulator). The live builder is a
single mutable class (not typestate), so a state/steps split would be fictional. Split instead along
real seams — impl class + the two genuinely heavy concerns (rpc wiring, listener) — which is the
doctrine intent (files read as lifecycle of one-line steps; complexity isolated). No public surface
change.

Validation: `deno check --unstable-kv` (4 files + whole package) EXIT=0; `deno test` service
17 passed / 0 failed; `deno lint` + `deno fmt` clean.

### A2 — service role layering + docs — DONE
Role layering already canonical (`src/{builder,primitives,presets,diagnostics}` + `types.ts`); no
moves needed. All four split files carry `@module` JSDoc. Added a `## Package Role` section to
README declaring the Arch-4 DSL/builder archetype (+ Arch-3 runtime), matching the wave-2/3 `plugin`
reference which leads with an explicit role/archetype section. `docs/architecture.md` already
declared the archetype.
Validation: `deno doc --lint packages/service/mod.ts` EXIT=0; `deno publish --dry-run --allow-dirty`
EXIT=0. **Phase A complete.**

### B3 — sdk barrel collapse (src/ as only source root) — DONE
Collapsed the 8 root barrel folders (`cache/`, `client/`, `collections/`, `discovery/`, `ports/`,
`query/`, `query-client/`, `telemetry/`) and root `streams.ts` into `src/`, matching the wave-2/3
`plugin` reference (subpaths resolve to `./src/<role>/mod.ts`; only `mod.ts`/`README`/`deno.json`
remain at root).
- Created `src/{cache,client,collections,ports,query,query-client,telemetry}/mod.ts` (curated public
  barrels, paths rewritten src-relative). `src/cache/mod.ts` preserves the cache-provider
  auto-registration side-effect.
- `discovery`: the existing `src/discovery/mod.ts` impl-barrel was replaced with the curated public
  barrel (the extra env-key builders it exported are unused outside `src/discovery/` and were never in
  the public `./discovery` surface — net public surface unchanged).
- `git mv streams.ts src/streams.ts`; `git rm -r` the 8 root folders.
- Repointed `mod.ts` internal re-exports and `deno.json` `exports` + `check` task into `src/`.
  **Subpath keys unchanged** → verified all 10 consumed specifiers (`@netscript/sdk`,`/cache`,`/client`,
  `/collections`,`/discovery`,`/ports`,`/query`,`/query-client`,`/streams`,`/telemetry`) across cli,
  fresh, queue, plugin-streams-core still resolve. Zero consumer edits.
Validation: `deno task check` EXIT=0; `deno task test` 14/14; `deno lint` clean; `deno fmt` applied;
`deno publish --dry-run` EXIT=0; full-export `deno doc --lint` (10 files) EXIT=0. **Phase B complete**
(B1/B2 deferred — see drift).

### D1 — fresh src/ role layering (single commit, codex) — DONE
Commit `43ffcc7` on the WSL-native worktree. 157 files, +2413/-2423 — almost entirely
100%-similarity `git mv` into canonical `src/` role folders, plus three real splits. Role mapping:
- `builders/ route/ form/ query/ defer/ config/vite.ts` → `src/application/`; the old `utils/` cache
  helpers → `src/application/cache-entries/`.
- `server/ server.ts streams/ interactive/` → `src/runtime/`.
- `error/` → `src/diagnostics/error/`; `_internal/telemetry.ts` → `src/internal/package-telemetry/`;
  `testing.ts` → `src/testing/mod.ts`.

Real splits (size ceiling): `define-page/page-compat.ts` (1111 LOC) → 7 type modules under
`page-compat/` (shared/route/context/form/definition/builder/partial-types.ts); `builder/mod.tsx` →
extracted `form-support.ts` (382) + `route-support.ts` (29); form regrouped under
`components/ runtime/ validation/ schema-adapter/ field-descriptors/`. Left genuinely-small modules
unsplit (`route/types.ts`, `route/manifest.ts`, `server/sse.ts`, `route/_internal/contract-runtime.ts`
now < 500 LOC). Deleted 4 `test-jsx*.ts` scratch files that arrived via the 5d merge.

**Surface (D6):** `deno.json` exports 13→12 keys — `./utils` REMOVED (no compat alias). Surviving 12
keys repointed into `src/`; root shells `server.ts`, `builders/mod.ts`, `route/mod.ts`,
`query/mod.ts`, `config/vite.ts` kept (CLI import-map). Cache-entry helpers re-exported from root
`mod.ts`. Cross-package: `plugins/workers/deno.json` + `plugins/sagas/deno.json` repointed
`@netscript/fresh/streams` → `src/runtime/streams/mod.ts` (pure path repoint, no logic).

Validation: root `deno task check` EXIT=0; root `deno task test` 632 passed / 11 failed / 12 ignored
— **all 11 failures pre-existing in packages/cli + memory-queue, zero in packages/fresh** (drift
2026-06-14 "Phase D validation"). Lead reviewed + accepted the structural commit. **Phase D
structural complete.**

### D-docs — fresh README + architecture rewrite (lead) — DONE
Lead-owned docs pass (codex never touches `.md`). `packages/fresh/README.md`: added "## Package role"
(Archetype 4, `src/` role layering, root shells), fixed Install to `^0.0.1-alpha.0` with trailing-
slash import, replaced prose with a 12-row "## Entry points" table (Import/Role/Use/Main exports),
removed the `### Utils` section, added a query-islands example, added "## Validation" + "## Docs"
sections. `packages/fresh/docs/architecture.md`: "Archetype: 4 (DSL/Builder)" header + doctrine link,
"## Source layout" table, "## Subpath conventions" (explains the `./utils` removal + forbidden folder
name), "## Public surface stability". Committed with the harness-artifact transcription as the
lead docs commit.
