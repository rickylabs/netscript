# Drift Log — feat-package-quality-wave2-adapters--adapters

> Record every deviation from the carried-in nested per-package plans, every
> subpath/folder rename, and the OQ-1 sub-wave decision here.

## Re-baseline drift (seed)

- Carried-in authority: nested `plan_{logger,telemetry,aspire,kv,database,queue,cron}.md`
  under `…/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`.
  These predate the plugin-platform merge + PR #84; their slow-type / doc-lint
  counts are **stale** and are NOT carried into this run's findings.
- Reviewer seed captured **structural** state only (README/docs/tests/metadata/
  folder vocab). Dynamic gates (`deno publish --dry-run`, `deno doc --lint`) are
  marked `MEASURE-FIRST` in `research.md` and MUST be re-run as Research step 1.
- New unit vs the 2026-05 inventory: `@netscript/prisma-adapter-mysql` (post-PR #84);
  no nested `plan_prisma-adapter-mysql.md` exists — derive its plan from the A2
  archetype + STANDARDS, not a carried-in doc.

## Dynamic re-baseline — REAL numbers (Research step 1)

Run on `feat/package-quality-wave2-adapters` @ `ca4d9c4`.

| Unit | publish dry-run | `deno doc --lint` | Delta vs carried-in |
|------|-----------------|-------------------|---------------------|
| logger | **0 slow types** ✓ | **Clean** ✓ | Carried-in claimed dirty; real is clean |
| telemetry | **0 slow types** ✓ | **2 errors** (private-type-ref `SpanAttributes`, `SpanAttributeValue` from `@opentelemetry/api` re-exports) | Carried-in unknown; real is 2 doc-lint |
| aspire | **0 slow types** ✓ | **20 errors** (private-type-ref `ZodType` on schema exports) | Carried-in unknown; real is 20 doc-lint |
| kv | **0 slow types** ✓ | **Clean** ✓ | Carried-in unknown; real is clean |
| database | **1 slow type** (`extensions/sql-json.extension.ts:286` missing explicit return type) | **22+ errors** (private-type-ref Prisma types + missing-jsdoc) | Carried-in unknown; real is dirty |
| prisma-adapter-mysql | **0 slow types** ✓ | **14+ errors** (private-type-ref Prisma driver types + missing-jsdoc + missing-explicit-type) | No carried-in plan; real is dirty |
| queue | **0 slow types** ✓ | **19+ errors** (missing-jsdoc on exported symbols) | Carried-in unknown; real is dirty |
| cron | **0 slow types** ✓ | **5 errors** (private-type-ref `CronProviderRegistry` + missing-jsdoc) | Carried-in unknown; real is dirty |

### Key drift findings

1. **logger is ALREADY clean** — 0 slow types, doc-lint clean. Scope = docs + task hygiene only (not a refactor).
2. **telemetry is almost clean** — 0 slow types, only 2 doc-lint errors from re-exporting `@opentelemetry/api` private types. Scope = fix re-exports + docs parity.
3. **aspire is almost clean** — 0 slow types, 20 doc-lint errors from Zod schema exports lacking explicit annotations. Scope = fix schema types + drop `./helpers` alias.
4. **kv is ALREADY clean** — 0 slow types, doc-lint clean. Scope = folder vocab (`bridges/` → `adapters/`, `core/` → `application/`) + docs + `./testing`.
5. **database is the dirtiest** — 1 slow type + 22 doc-lint. Also missing README, docs, tests, metadata. This is the "runtime-config" of Wave 2 (from-scratch build).
6. **prisma-adapter-mysql** — 0 slow types but 14 doc-lint errors. Missing README length, docs, tests. `skipLibCheck:true` present but does not mask slow types.
7. **queue** — 0 slow types, 19 doc-lint (missing-jsdoc). Needs `interfaces/` → `ports/`, `utils/` → role rename, docs, `./testing`, defensive I/O tests.
8. **cron** — 0 slow types, 5 doc-lint. Needs `interfaces/` → `ports/`, docs, `./testing`, defensive I/O tests.

## Decisions / renames (append during plan + implement)

## Implementation drift — Sub-wave 2a

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | significant | Telemetry doc-lint re-baseline is much larger when every `exports` entrypoint is checked | Root-only `deno doc --lint ./mod.ts` reports the planned 2 private-type-ref errors (`Context`, `Span`). The required full export sweep `deno doc --lint ./mod.ts ./config.ts ./tracer.ts ./context.ts ./attributes.ts ./instrumentation.ts ./src/runtime/mod.ts ./orpc.ts` reports 168 documentation lint errors. The failures include upstream OTEL private/missing docs plus package missing-jsdoc errors in config, core, instrumentation, runtime, and oRPC subpaths. `deno publish --dry-run --allow-dirty` remains clean with 0 slow types. | Stop and escalate before widening slices 4-6. The locked plan's telemetry scope was based on root-only evidence and is not enough to satisfy the run instruction to re-measure every exported entrypoint. |

| Date | Item | Decision | Consumer impact |
|------|------|----------|-----------------|
| 2026-06-06 | OQ-1 sub-wave split | **Split Wave 2 into three sub-waves** (2a / 2b / 2c) — see plan.md § Sub-waves | Changes registry's single-group assumption; escalated per supervisor.md §4 |
| 2026-06-06 | OQ-3 `interfaces/` → `ports/` | **Rename now** (alpha, no back-compat). database/queue/cron all rename `interfaces/` → `ports/` and update subpath exports | Zero external consumers found for `@netscript/database/interfaces`, `@netscript/queue/types`, `@netscript/queue/validation`, `@netscript/cron/types`. CLI references `@netscript/database` root/scripts/tracing only. plugins/triggers and plugins/workers import `@netscript/cron` root — unaffected by `./types` → `./ports` rename |
| 2026-06-06 | OQ-4 aspire `./helpers` drop | **Drop now** (alpha, no back-compat). Remove `./helpers` export from `deno.json` | Zero external consumers found for `@netscript/aspire/helpers`. Internal alias already maps to `./application` |
| 2026-06-06 | OQ-5 `./testing` entrypoint | **Required for multi-adapter units**: kv, database, queue, cron each ship `./testing` with in-memory/mock adapters. aspire already has it. logger (flat facade) and telemetry (instrumentation facade) do not need it | None — new entrypoints, no breaking changes |
| 2026-06-06 | OQ-6 `kv/ARCHITECTURE.md` + `prisma-adapter-mysql/examples/` | `kv/ARCHITECTURE.md` → fold into `kv/docs/architecture.md`. `prisma-adapter-mysql/examples/` → exclude from publish via `publish.exclude` (do not move; examples are build-time only) | None |
| 2026-06-06 | OQ-7 `prisma-adapter-mysql` `skipLibCheck` | **Remove `skipLibCheck:true`** from `deno.json`. Package has 0 slow types without it; doc-lint errors are from Prisma driver private types, not from missing lib types | May surface 1–2 new type errors; plan includes a slice to fix them |
| 2026-06-06 | queue `utils/` → `validation/` | Rename `utils/` folder to `validation/` (AP-16). Export subpath becomes `./validation` (already the case) | None — subpath name unchanged |
| 2026-06-06 | queue `./types` subpath | Rename `./types` → `./ports` (matches `interfaces/` → `ports/` rename) | Zero external consumers found |
| 2026-06-06 | cron `./types` subpath | Rename `./types` → `./ports` (matches `interfaces/` → `ports/` rename) | Zero external consumers found |
| 2026-06-06 | database `./interfaces` subpath | Rename `./interfaces` → `./ports` | Zero external consumers found |
| 2026-06-06 | kv folder vocab | `bridges/` → `adapters/` (Redis/Deno KV/kvdex are adapters, not bridges). `core/` → `application/` (composition root + shared logic). `types/` stays (domain types) | Subpaths (`./redis`, `./kvdex`) unchanged; internal imports only |
