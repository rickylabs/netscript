# Plan: Wave 1 — Contracts & schemas

## Run Metadata

| Field          | Value                               |
| -------------- | ----------------------------------- |
| Run ID         | `feat-package-quality-wave1-contracts--contracts` |
| Branch         | `feat/package-quality-wave1-contracts` |
| Phase          | `plan`                              |
| Target         | `@netscript/config`, `@netscript/contracts`, `@netscript/runtime-config` |
| Archetype      | 1 — Small Contract (all three)      |
| Scope overlays | none                                |

## Archetype

**Archetype 1 — Small Contract** for all three units.

- `@netscript/config`: publishes types, Zod schemas, and small loading invariants. The `@std/fs`/`@std/path` usage is for config loading, not integration adapters. No port/adapter split is justified (only one loading strategy). Value = clarity of types.
- `@netscript/contracts`: publishes contract primitives, schema factories, and narrow helpers. The oRPC usage is a dependency, not an adapter surface we own. No builder DSL of our own yet. Value = stable vocabulary across package boundaries.
- `@netscript/runtime-config`: publishes runtime override types and a loader. The `Deno.watchFs` usage is a file-system edge, not an adapter. No second store backend is planned. Value = hot-reloadable config contract.

If `@netscript/contracts` grows a NetScript-defined fluent builder (e.g. `defineContract().route().input().output()`), it escalates to Archetype 4. That is out of scope for this wave.

## Current Doctrine Verdict

From `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`:

| Package | Verdict | Headline action |
|---------|---------|-----------------|
| `@netscript/config` | Refactor | Split `schema.ts` (already done in current tree); rename `helpers.ts` |
| `@netscript/contracts` | Keep | Confirm version-axis shape; `crud/` folder review; rename `helpers/` |
| `@netscript/runtime-config` | Refactor | Split single-file `mod.ts`; add subpaths if exports grow |

## Axioms in Play

| Axiom | Why it matters |
|-------|---------------|
| A1 | Public types first — every exported interface must be documented before implementation touches it. |
| A2 | Simple over easy — the surface is small, named, and predictable. No kitchen-sink exports. |
| A6 | Helpers must be justified — `helpers.ts` and `helpers/` are generic names that hide real concerns. |
| A8 | One concern per folder — `runtime-config/mod.ts` mixes domain, application, and presentation. |
| A9 | Archetype drives shape — all three are Small Contract; no `presentation/` or `state/` needed. |
| A14 | Tests and gates preserve doctrine — every package gets tests and a passing dry-run gate. |

## Goal

Bring all three packages to S1 alpha bar:

- `deno publish --dry-run` with **0 slow-types** and **0 portability errors** ✓ (already true)
- `deno doc --lint` **clean** on every entrypoint (root + all subpaths)
- **README ≥ 150 LOC** per STANDARDS § 6 (all three)
- **`/docs` per STANDARDS § 7** (all three — expand partial, create missing)
- **Archetype gate matrix green** per unit (F-1 through F-18 applicable to Archetype 1)
- **Tests** for every public function (runtime-config missing; config/contracts need expansion)

## Scope

- `@netscript/runtime-config`:
  - Split `mod.ts` into `src/domain/`, `src/application/`, `src/diagnostics/` (doctrine-aligned)
  - Add JSDoc to all exported symbols (34 doc-lint errors)
  - Remove `console.*` from application code (AP-13) — introduce structured diagnostics
  - Add `deno.json` standard tasks, description, publish config
  - Write README.md from scratch (≥ 150 LOC)
  - Scaffold `/docs` per STANDARDS § 7
  - Add tests (`tests/`)

- `@netscript/config`:
  - Rename `helpers.ts` → `src/domain/saga-inputs.ts` (AP-16)
  - Fix `private-type-ref` on `SagaGroupInput` (export from public surface)
  - Add JSDoc to `types.ts` interface properties (32 doc-lint errors)
  - Fix `private-type-ref` in `src/merge/mod.ts` (export `DatabaseEntry`, `ServiceContributionEntry`, `AppContributionEntry`)
  - Fix `missing-jsdoc` in `src/schema/plugins/mod.ts`
  - Fix Zod internal type leak (`z.ZodType` in public schema exports)
  - Expand `/docs` with `recipes/` and `advanced/`

- `@netscript/contracts`:
  - Rename `helpers/` → fold into `src/application/` by role (AP-16)
  - Fix `private-type-ref` on subpaths — export `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure` from public surface so subpaths can reference them
  - Add `getting-started.md` to `/docs`
  - Add `advanced/` to `/docs`

## Non-Scope

- **JSR publish / OIDC / version bumps** — S1 stops at dry-run clean.
- **Aspire integration** — no runtime behavior changes.
- **Docs site generation** — out of scope; we ship on-disk docs only.
- **Back-compat aliases** — path imports are kept; publish rewrites to `jsr:`.
- **Breaking API changes** — all renames are internal file moves; public exports stay stable.

## Hidden Scope

- Downstream import updates: `packages/cli` imports `@netscript/config` types and `@netscript/runtime-config` types. File moves inside packages do not affect these imports (public surface unchanged).
- `plugins/sagas` and `plugins/workers` import `@netscript/contracts` — public surface unchanged.
- The `config/helpers.ts` rename requires updating `src/public/mod.ts` and `mod.ts` re-exports, but not downstream consumers (they import `defineSagas` from `@netscript/config` root).

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| L1 | All three units stay **Archetype 1** | None has ports/adapters worth naming; value is type clarity, not runtime behavior. |
| L2 | `runtime-config/mod.ts` **splits into doctrine layout** | 415 LOC mixing domain/application/presentation violates A8. Split into `src/domain/types.ts`, `src/application/loader.ts`, `src/application/watcher.ts`, `src/diagnostics/summary.ts`. |
| L3 | `config/helpers.ts` → **`src/domain/saga-inputs.ts`** | AP-16 violation. The file contains saga definition input types — pure domain vocabulary. No downstream breakage (same exports via `mod.ts`). |
| L4 | `contracts/helpers/` → **`src/application/` by role** | AP-16 violation. `paginated-query.ts` → `src/application/paginated-query.ts`. `transform.ts` → `src/application/transform-helpers.ts`. |
| L5 | `runtime-config` console usage → **structured diagnostics functions** | AP-13 violation. Replace `console.log` in `watchRuntimeConfig` and `logRuntimeConfigSummary` with return-value diagnostics. Callers (CLI binaries) decide how to emit. |
| L6 | Fix `private-type-ref` by **exporting the referenced types**, not by hiding them | `deno doc --lint` requires public types for public signatures. `ContractSchema`, `ContractObjectSchema`, `BaseContractProcedure` become public exports. |
| L7 | Zod internal leak (`z.ZodType`) → **use inferred schema types** | Instead of `export const schema: z.ZodType<T>`, export `export type Schema = z.infer<typeof schema>` and `export const schema`. This removes the Zod internal from the public signature. |
| L8 | Keep `crud/` at package root | Moving it under `src/` would break the `./crud` subpath export mapping. The inconsistency is acceptable for a subpath concern; debt entry if we want to unify later. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Should `runtime-config` expose `./testing` subpath with in-memory config fixtures? | safe to defer | No consumer needs it today. Add when a test package requests it. |
| Should `config` export `NetScriptConfig` from root (currently only types)? | safe to defer | CLI imports `NetScriptConfig` via `@netscript/config` already. No change needed. |
| Should `contracts` add `./testing` subpath with mock contract builders? | safe to defer | No plugin test uses it today. |
| Should `runtime-config` add a `./watching` subpath for the watcher only? | safe to defer | Only CLI binaries use the watcher. Keep it on root for now. |
| Should `config/src/domain/mod.ts` (sub-barrel) be eliminated? | must resolve now | AP-22 violation. `src/domain/mod.ts` is a pure re-export barrel inside `src/`. Resolution: keep it as the curated public domain surface, add `// arch:barrel-ok <reason>` comment. It is referenced by `src/public/mod.ts`. |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Downstream import breakage from file moves | Low | Medium | Public surface (`mod.ts`, subpath exports) unchanged. Verify with `deno check` on CLI + plugins after each unit's slices. |
| `deno doc --lint` still fails after JSDoc additions due to nested private-type-ref | Medium | Low | Run `deno doc --lint` after every slice. The linter is the gate. |
| `runtime-config` watcher tests are flaky (file system timing) | Medium | Low | Use `Deno.makeTempDir` + manual file writes. Mock `Deno.watchFs` if needed. Test the loader logic, not the OS watcher. |
| Zod v4 internal type changes break schema/plugins exports | Low | High | Mitigated by L7 (remove `z.ZodType` from public signatures). |
| Scope creep — tempted to redesign `runtime-config` API | Medium | High | Locked: split files only, no API changes. The public function signatures stay identical. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| AP-1 (Monolithic file) | existing — `runtime-config/mod.ts` | Resolve: split into domain/application/diagnostics files. |
| AP-13 (console.log in published code) | existing — `runtime-config` | Resolve: replace with return-value diagnostics. |
| AP-14 (Re-export upstream) | risk — `contracts` exports oRPC types | Avoid: do not re-export `@orpc/server` symbols. Only export NetScript-owned types. |
| AP-16 (utils/helpers folders) | existing — `config/helpers.ts`, `contracts/helpers/` | Resolve: rename to role-named folders/files. |
| AP-22 (Useless re-export barrel) | existing — `config/src/domain/mod.ts` | Resolve: add `// arch:barrel-ok` justification; it genuinely aggregates 12 schema files into one import for `src/public/mod.ts`. |

## Fitness Gates

From `gates/archetype-gate-matrix.md` for Archetype 1:

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| F-1 File-size lint | yes | Manual: all files < 500 LOC; `runtime-config` split proves this. |
| F-5 Public surface audit | yes | `deno doc --lint` clean on all entrypoints. |
| F-6 JSR publishability | yes | `deno publish --dry-run --allow-dirty` = 0 slow types, 0 errors. |
| F-7 Doc-score gate | yes | `deno doc --lint` clean + README ≥ 150 LOC + `/docs` per STANDARDS § 7. |
| F-8 Workspace lib check | yes | `compilerOptions.lib` includes `"deno.unstable"` where needed (config already has `--unstable-kv` in check task). |
| F-10 Test-shape audit | yes | No test file > 500 LOC; tests exist for all three packages. |
| F-11 Forbidden-folder lint | yes | No `utils/`, `helpers/`, `common/`, `lib/`, `interfaces/` under `src/`. |
| F-12 Naming-convention lint | yes | No `I*` prefixes, `*_T` suffixes, `*Impl` classes. |
| F-14 Console-log lint | yes | No `console.*` in published non-presentation code. Proves L5 (`runtime-config` console → return-value diagnostics). `grep -rn "console\." packages/*/mod.ts packages/*/src` returns 0 after slices 3–5. |
| F-15 Re-export-upstream lint | yes | No `export * from 'npm:...'` or `jsr:...` except `@netscript/*` and `@std/*`. |
| F-16 Folder-cardinality lint | yes | ≤ 12 immediate children per directory; ≤ 4 nesting levels from `src/`. |
| F-17 Abstract-derived co-location | yes | No abstract/derived class pairs in any of the three Small Contracts (type-only + factory surfaces). Manual review; `PENDING_SCRIPT` with no detected violation. |
| F-18 Sub-barrel lint | yes | `config/src/domain/mod.ts` justified with `arch:barrel-ok`. |
| Static gates | yes | `deno check` passes; `deno lint` passes; `deno fmt --check` passes. |
| Consumer import validation | yes | `deno check` on CLI + plugins after changes. |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `packages/runtime-config` — doctrine verdict Refactor | **close** | Splitting mod.ts resolves the single-file concern. |
| `packages/config` — AP-16 (`helpers.ts`) | **close** | Rename to `src/domain/saga-inputs.ts` resolves. |
| `packages/contracts` — AP-16 (`helpers/`) | **close** | Rename to `src/application/` files resolves. |
| `packages/contracts/crud/` at root (not under `src/`) | **create** | Subpath export concern at root is inconsistent with `src/` layout. Accept for now; unify in a future wave when subpath structure is revisited across all packages. |
| `packages/config/src/domain/mod.ts` — sub-barrel | **create** | Justified barrel with `arch:barrel-ok` comment. Close when `generate-reference.ts` can crawl individual schema files. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|-----------------|-----------------|
| 1 | F-6 | `cd packages/<unit> && deno publish --dry-run --allow-dirty` | Success, 0 slow types |
| 2 | F-5 / F-7 | `cd packages/<unit> && deno doc --lint mod.ts` | 0 errors |
| 3 | F-5 / F-7 | `cd packages/<unit> && deno doc --lint <subpath-entry>` | 0 errors per subpath |
| 4 | F-7 | `wc -l README.md` | ≥ 150 |
| 5 | F-7 | `find docs -type f` | Matches STANDARDS § 7 structure |
| 6 | F-10 | `deno test --allow-all` | Passes |
| 6.5 | F-14 | `grep -rn "console\." mod.ts src/` | 0 matches (runtime-config) |
| 7 | Static | `deno check mod.ts` | 0 errors |
| 8 | Static | `deno lint` | 0 errors |
| 9 | Static | `deno fmt --check` | 0 errors |
| 10 | Consumer | `cd packages/cli && deno check` | 0 errors (after all three units) |

## Dependencies

- `@std/path` — runtime-config, config
- `@std/fs` — config
- `zod@^4.3.6` — config, contracts
- `@orpc/server@^1.13.5` — contracts (dev-only, not re-exported)

## Drift Watch

- If `deno doc --lint` adds new error categories, log in `drift.md`.
- If downstream packages fail `deno check` after file moves, log in `drift.md` as `significant`.
- If any file exceeds 500 LOC during slicing, log as AP-1 finding.
