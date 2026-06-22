# PR-B Research — JSR-readiness deprecation-shim removal (breaking)

- Run id: `chore-jsr-prod-readiness-shim-removal`
- Baseline: `origin/main @ df67038d` (post PR-A #111 + arch-debt #112).
- Archetype: multi-package edit across ARCHETYPE-2/3/5 surfaces (cli, database, fresh, telemetry,
  plugin-workers-core, plugin-sagas-core). Scope overlay: SCOPE-service where runtime paths change.
- Origin of scope: the `release/jsr-readiness` umbrella's "breaking prod-readiness" valid set. Key
  finding (2026-06-22 consumer-check): **main already absorbed the prod-readiness substance** — it
  carries every canonical API plus `@deprecated` back-compat shims. PR-B removes ONLY those shims.

## Removal manifest (verified against origin/main)

### Tier 1 — pure 0-consumer aliases (trivial; delete export + barrel line)
- `packages/cli/src/kernel/constants/windows.ts` — 8 `@deprecated` aliases in the `LEGACY ALIASES`
  block (lines 218-232). **EXACT alias identifiers (verified against the file 2026-06-23):**
  `SERVY_CLI_PATH` (218), `WINDOWS_TARGET` (220), `WINDOWS_SERVICE_PREFIX` (222),
  `BUNDLE_EXTERNAL_PACKAGES` (224), `BUNDLE_EXTERNAL_IMPORTS` (226), `COMPILE_TIMEOUT_MS` (228),
  `BUNDLE_TIMEOUT_MS` (230), `V8_HEAP_MB` (232) → each aliases a `DEFAULT_*` canonical.
  **NAME CORRECTION (2026-06-23):** an earlier draft of this manifest mislabeled 3 aliases by their
  canonical suffix — it wrote `COMPILE_TARGET`/`SERVICE_PREFIX`/`BUNDLE_EXTERNAL`, but the actual
  exported alias names are `WINDOWS_TARGET`/`WINDOWS_SERVICE_PREFIX`/`BUNDLE_EXTERNAL_PACKAGES`.
  Implementation MUST target the exact identifiers above (the `@deprecated` block), not the canonical
  suffixes. **Consumer proof (grep over `packages/` + `plugins/`, 2026-06-23):** the ONLY consumer of
  any of the 8 aliases is `packages/cli/src/kernel/adapters/windows/runtime/v8-profiles.ts:12,46,73`
  → `V8_HEAP_MB`. The other 7 are genuinely 0-consumer (only their definition lines match;
  `plugins/` has zero matches). The user's cycle-1 "3 of 8 have consumers" concern traced to a stale
  inventory mis-attribution (it wrongly listed v8-profiles importing `SERVY_CLI_PATH` +
  `BUNDLE_EXTERNAL_IMPORTS`; the file imports only `NO_SPARKPLUG_FLAG` (a current, NON-deprecated
  constant) and `V8_HEAP_MB`). S1 folds `V8_HEAP_MB`→`DEFAULT_V8_HEAP_MB` (value-identical) before
  deleting the alias; the file stays (Windows V8 heap-sizing path). Mechanical, proven — not a blocker.
- `packages/database/mod.ts:256` — `export const buildConnectionString = buildPostgresConnectionString`
  (`@deprecated`, line 254). 0 import consumers (the `buildConnectionString()` private methods on the
  mysql/postgres adapters are unrelated same-name class methods — keep them).
- `packages/database/extensions/sql-json.extension.ts:556` + `extensions/mod.ts:8` + `mod.ts:100` —
  `mssqlJsonExtension` (`@deprecated` → `sqlJsonExtension`). 0 consumers beyond the re-export chain.
- `packages/telemetry/src/context/job.ts` — entire module is a 4-line `@deprecated` re-export of
  `createJobTraceEnv`/`extractJobTraceContext` from `payload-context.ts`. 0 importers of `context/job`.
  Remove file + any barrel reference.

### Tier 2 — deprecated option fields (remove option + handling branch + tests)
- `packages/database/adapters/mssql.adapter.ts` — `trustedConnection?: boolean` option (line 66) +
  its translation branch (line ~416 sets `config.options.trustedConnection = true`), `@deprecated` →
  `authentication.type = 'ntlm'`. Only consumed inside the adapter itself. Verify the `ntlm` path is
  the complete replacement before removing.
- `packages/fresh/src/runtime/server/define-fresh-app.ts` — `serveStaticFiles?` (line 50) and
  `registerFsRoutes?` (line 73) options, `@deprecated` → `staticFiles`/`fsRoutes`. Used only in the
  impl (`define-fresh-app.ts`) and its test (`define-fresh-app.test.ts`). Remove the deprecated
  option fields + the `options.serveStaticFiles !== false` / `options.registerFsRoutes` branches,
  fold callers onto `staticFiles`/`fsRoutes`, update the test cases.

### Tier 3 — deprecated subsystems (entangled; isolate, verify canonical, retire legacy path + tests)
- `packages/plugin-workers-core` — deprecated public `schedule()` builder method
  (`builders/job-builder.ts:50` decl, `:131` impl; mirrored on `public/root.ts:185`), `@deprecated`
  → `defineScheduledTrigger(...).enqueueJob(...)`. The `schedule` FIELD threads through
  `builder-types.ts`, `config/job-config.ts`, `config/task-config.ts`, `domain/job-definition.ts`,
  and the v1 contract schemas (66 grep hits). REQUIRED: confirm the scheduled-trigger canonical path
  fully replaces legacy cron scheduling before removal; decide whether to drop only the public
  `schedule()` method or the entire legacy-schedule field plumbing. Larger than an alias.
- `packages/plugin-sagas-core` — `adapters/saga-bus-legacy.ts` (8 exports incl. `SagaBusLegacy`,
  `createSagaBusLegacy`) + the opt-in deprecated legacy saga runtime (`runtime/create-saga-runtime.ts:77`).
  0 external consumers; canonical = `SagaBusBridge`/native runtime. Removing means retiring the whole
  legacy adapter + runtime branch + its tests.

## Open questions for PLAN-EVAL / Codex
1. Tier 3 scope: retire the legacy subsystems wholesale, or only their deprecated public entrypoints?
2. Does removing these warrant a coordinated **major-version** bump across the 6 affected packages
   (vs per-package)? Record the version policy in plan.
3. Are any of these symbols referenced by generated scaffold output / docs code samples that would
   also need updating (scaffold templates, tutorials)? Verify before merge.

## Gates
`deno task check --unstable-kv` (affected roots), `deno task lint`, scoped fmt (src ts only),
`deno task test` (affected packages), `deno task arch:check`, and — because Tier 2/3 touch runtime
and scaffold-relevant packages — `deno task e2e:cli run scaffold.runtime --cleanup` at IMPL-EVAL.
