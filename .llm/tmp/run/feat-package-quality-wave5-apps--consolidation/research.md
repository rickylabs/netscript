# Research — Wave 5 Apps Consolidation

Run ID: `feat-package-quality-wave5-apps--consolidation`
Branch: `feat/package-quality-wave5-apps` (umbrella; all of 5a/5b/5c/5d already merged here)
Date: 2026-06-14
Role: GENERATOR research pass for a structural consolidation of the four merged Wave 5 packages.

## 0. Re-baseline (carried-in plan)

The user referenced a prior cheap-agent plan at
`.llm/tmp/run/openhands/pr-17/run-27496615815-1/plan.md`. **That path does not exist in this
worktree** (verified by `find` + Glob — local openhands runs are `pr-25`, `pr-32` only; no `pr-17`,
no `run-27496615815`). Per `run-loop.md` §2, a carried-in plan is never ground truth; here it is
not even present, so the plan is **re-derived from live package inspection** against the merged
umbrella surface (current `HEAD` = `9226846`). The prior OpenHands work is already merged into this
branch (PRs #25/#29/#30/#31/#32 → service/sdk/fresh-ui/5c1/5c2; 5d-fresh via #30 chain), so its
output is the _current tree_, which is exactly what was inspected.

## 1. Headline finding

The cheap agents made all four packages pass the **type/lint/JSR** gates (slow types, doc-lint,
dry-run) but did **not** restructure them to the **canonical doctrine layering** that Wave 2/3
packages use. Reference: `packages/plugin` (Wave 3) has the full
`src/{domain,ports,application,adapters,diagnostics,...}` shape (doctrine file 05). The Wave 5
packages are still in their RFC-era ad-hoc shapes. The consolidation is **structural**, not
type/lint cleanup.

## 2. Per-package state (live inspection, 2026-06-14)

### 2.1 `@netscript/service` — Archetype 4 (correct)
- `src/` already role-layered: `builder/`, `primitives/`, `presets/`, `diagnostics/`, `types.ts`.
- **Over-cap:** `src/builder/service-builder.ts` = **604 LOC** (`ServiceBuilderImpl` fluent chain).
  Doctrine ceiling 500. Split into `service-builder.ts` (interface+factory) +
  `service-builder-state.ts` (typestate accumulator) + per-step modules.
- No `ports/`/`adapters/` — correct (single concrete builder; composition + injection suffices).
- **No base class justified** (single `ServiceBuilderImpl`, no subtype axis).
- 1 export (`.`). Consumers: `plugins/{workers,streams,sagas,triggers}` + CLI service template.

### 2.2 `@netscript/sdk` — Archetype 4 (correct), structure non-canonical
- **Duplication:** root-level barrel folders (`cache/`, `client/`, `collections/`, `discovery/`,
  `ports/`, `query/`, `query-client/`, `telemetry/`) each contain only a `mod.ts` re-export of
  `src/<feature>/`. Pure navigation noise.
- `src/` uses **feature** names (`cache`, `client`, `query`, `query-client`, `collections`,
  `discovery`) not canonical **role** names. `src/ports/` (11 files) is good.
- Adapters scattered: `src/cache/kv-cache-store.ts` (131), `src/client/http-client-link.ts` (116),
  `src/query-client/kv-cache-persister.ts` (82) implement ports but do not live in `src/adapters/`.
- No `src/domain/`, no `src/application/`.
- No over-cap files (largest 285 LOC). No forbidden folders.
- 10 subpath exports — acceptable; each justified.
- **Genuine seams (ports, not base classes):** `ServiceTransport` (`mode:'http'|'in-process'`;
  only HTTP today — RFC 14 reserves in-process, **unimplemented, protect seam only**),
  `CacheStore` (single `KvCacheStore`), query ports. **No base class** until a 2nd impl lands.

### 2.3 `@netscript/fresh-ui` — Archetype 4 (mislabeled A3), no `src/`
- **No `src/` wrapper.** 14 root items (> 12 cardinality cap): `registry/`, `runtime/`, `tokens/`,
  `scripts/`, `docs/`, `tests/`, `mod.ts`, `interactive.ts`, `primitives.tsx`,
  `registry.manifest.ts`, `registry.schema.ts`, README, deno.json, deno.lock.
- **Over-cap:** `registry.manifest.ts` = **891 LOC**, hand-authored copy-source catalog (NOT
  generated — `scripts/build-tokens.ts` only emits CSS/JSON tokens). Move into
  `src/registry/` and split by item group; keep the 44-item catalog navigable.
- `runtime/<comp>/use-*.ts` hooks (accordion 310, popover 246, ...) — individually justified.
- 3 exports (`.`, `./interactive`, `./primitives`) — correct; registry items are copy-source, not
  exported. **No base class** (concrete Preact components/hooks).
- README/archetype claims A3 → fix to A4.

### 2.4 `@netscript/fresh` — Archetype 4, the long pole (~13.2k LOC)
- **No `src/` wrapper.** 12 top-level feature folders: `builders/`, `components/`, `config/`,
  `defer/`, `error/`, `form/`, `hooks/`, `query/`, `route/`, `server/`, `streams/`, **`utils/`**.
- **Forbidden `utils/`** (93 LOC: `cache-entry.ts` + re-export `mod.ts`). Must be eliminated.
- **Cardinality violation:** `form/` has 28 files (> 12, ~2×). Split into role sub-folders.
- **Over-cap files (6, ~4,656 LOC = 35% of package):**
  `builders/mod.ts` 1110 · `builders/define-page/builder.tsx` 1097 · `route/mod.ts` 755 ·
  `route/contract.ts` 600 · `form/schema-adapter.ts` 576 · `form/field-descriptors.ts` 518.
- 12 subpath exports — at the F-16 ceiling. `./utils` is the lowest-value (eliminate);
  `./error`/`./streams`/`./interactive`/`./vite` are candidates to fold.
- **No base classes** today; correct per archetype. `FormSchemaAdapter` (Zod-only) is a single-impl
  interface — co-locate as a schema-adapter family ready for Valibot, **no base class yet**.

## 3. Blast radius (no-backward-compat consumer update set)

From the CLI/consumer scan. Every item must be updated in lockstep with any subpath change:

- **CLI templates (13)** under `packages/cli/src/kernel/assets/app/**`,
  `.../assets/service/main.ts.template`, `.../assets/generated/plugins/*.template` — hardcoded
  imports of `@netscript/fresh/{server,route,vite,builders,query,streams}`,
  `@netscript/sdk/{client,query,query-client,...}`, `@netscript/fresh-ui/interactive`,
  `@netscript/service`.
- **deno.json generators (3):** `.../adapters/templates/app/generate-app-deno-json.ts`,
  `.../templates/service/generate-service-deno-json.ts`,
  `.../templates/plugins/generate-plugin-deno-json.ts`.
- **Import resolver + constants:** `.../adapters/scaffold/import-resolver.ts`,
  `.../constants/scaffold/scaffold-packages.ts` (`SCAFFOLD_PACKAGES` enum — JSR + local path maps).
- **CLI tests (3):** `templates/app/route-templates_test.ts`,
  `templates/service/generators_test.ts`, `templates/app/generators-config_test.ts` — assert exact
  generated import strings.
- **Plugin runtime:** `plugins/{workers,streams,sagas}/services/src/main.ts` (`@netscript/service`),
  plugin `deno.json` import maps (`@netscript/service`, `@netscript/fresh/streams`).
- **Cross-package:** `packages/queue/factory/create-queue.ts` → `@netscript/sdk/discovery`;
  intra-fresh ↔ sdk imports (`fresh/error/handler.ts`→`sdk/client`, `fresh/query`→`sdk/query-client`,
  `fresh/utils/cache-entry.ts`→`sdk/cache`).
- **Root workspace deno.json** import map + scoped check/lint/fmt excludes.

## 4. jsr-audit surface scan (current)

All four already cleared `deno publish --dry-run` during their sub-waves (no slow types). The
consolidation must **preserve** that: every moved/split file keeps explicit return types; every new
`src/.../mod.ts` keeps a `@module` doc; subpath keys that stay stable keep their JSDoc. Re-run
`deno publish --dry-run --allow-dirty` per package after restructure as the F-6 regate.

## 5. Open questions (closed in plan)

1. Do we keep stable subpath KEYS while restructuring internals, or rationalize subpaths now?
   → Plan D1/D6: **repoint subpaths to `src/` internals first (non-breaking), rationalize fresh's
   surface in a dedicated tail slice with all consumers/templates/tests updated together.**
2. Force base classes per the user's request? → **No.** Doctrine A4/A5: ports+adapters realize the
   seams; base classes only for ≥2 real subtypes. See plan D1 reconciliation.
3. E2E validation location? → `deno task e2e:cli` must run from the **WSL native worktree**
   (`/home/codex/repos/netscript-wave5-apps`); `/mnt/c` DrvFS fails (codex-wsl-remote skill).
