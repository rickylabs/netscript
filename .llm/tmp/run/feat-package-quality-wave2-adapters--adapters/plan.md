# Plan — feat-package-quality-wave2-adapters--adapters

## Authority

- Archetype: A2 — Integration (all 8 units)
- Scope overlay: `SCOPE-docs.md`
- Registry: `phase-registry.md` Wave 2 card
- Base: `feat/package-quality` @ `4c57867`
- Branch: `feat/package-quality-wave2-adapters`

## Locked decisions

### 1. Sub-wave split (OQ-1) — RESOLVED

Wave 1 spent 27 slices for 3 units. 8 units at comparable density exceeds the Plan-Gate `< 30 slices` hard cap. **Wave 2 is split into three sub-waves**, each with its own branch, PR, Plan-Gate, and evaluator pass.

| Sub-wave | Units | Branch | PR target | Est. slices | Rationale |
|----------|-------|--------|-----------|-------------|-----------|
| **2a** — observability/host | logger, telemetry, aspire | `feat/package-quality-wave2-adapters-2a` | `feat/package-quality` | ~10 | logger is clean (docs only); telemetry is clean (2 doc-lint fixes + docs parity); aspire is clean (schema doc-lint + drop `./helpers`) |
| **2b** — data | kv, database, prisma-adapter-mysql | `feat/package-quality-wave2-adapters-2b` | `feat/package-quality` | ~22 | kv is clean (folder vocab + docs + `./testing`); database is from-scratch (metadata → README → docs → tests → slow-type/doc-lint sweep); prisma-adapter-mysql needs README + docs + tests + doc-lint |
| **2c** — messaging | queue, cron | `feat/package-quality-wave2-adapters-2c` | `feat/package-quality` | ~14 | queue needs `interfaces/`→`ports/`, `utils/`→`validation/`, docs, `./testing`, defensive I/O tests; cron needs `interfaces/`→`ports/`, docs, `./testing`, defensive I/O tests |

**Escalation:** This changes the registry's Wave-2 single-group assumption. The supervisor `phase-registry.md` must be updated to record 2a/2b/2c as separate phase groups with dependency ordering (2a → 2b → 2c). 2a has no intra-wave deps; 2b depends on logger (kv → logger); 2c depends on kv (queue → kv). Inter-sub-wave ordering is preserved by the natural dependency chain.

### 2. `interfaces/` → `ports/` rename (OQ-3) — RESOLVED

**Decision:** Rename `interfaces/` → `ports/` in database, queue, cron. Update subpath exports (`./interfaces` → `./ports`, `./types` → `./ports`). Alpha = no back-compat shims.

**Rationale:** AP-17 violation. Doctrine 05 requires `ports/` for consumed contracts. All three units have active debt entries (`packages/database — AP-17`, `packages/cron — AP-17`, `packages/queue — AP-16/AP-17`).

**Consumer impact:** Grep found **zero external consumers** of `@netscript/database/interfaces`, `@netscript/queue/types`, `@netscript/queue/validation`, or `@netscript/cron/types`. CLI references `@netscript/database` root/scripts/tracing only. plugins/triggers and plugins/workers import `@netscript/cron` root — unaffected by subpath rename. Consumer gate = `deno check` on CLI + plugins after rename.

### 3. aspire `./helpers` drop (OQ-4) — RESOLVED

**Decision:** Remove `./helpers` export from `packages/aspire/deno.json`. Consumers must use `./application`.

**Rationale:** AP-16 + AP-17. `./helpers` is a generic-named duplicate alias for `./application`. Debt entry `aspire-helpers-subpath-shim` was accepted for Foundation alpha only; S1 alpha closes it.

**Consumer impact:** Grep found **zero external consumers** of `@netscript/aspire/helpers`.

### 4. `./testing` port-contract entrypoint (OQ-5) — RESOLVED

**Decision:** Multi-adapter units (kv, database, queue, cron) each ship a `./testing` subpath with in-memory/mock adapters. aspire already has one. logger and telemetry do not need one (facade packages with no adapter split).

**Rationale:** A2 doctrine: "Testing helpers expose `./testing` with in-memory adapters." This is the registry success criterion "each adapter ships a `./testing` port-contract entrypoint."

### 5. Publish hygiene (OQ-6) — RESOLVED

**Decision:**
- `kv/ARCHITECTURE.md` → move content to `kv/docs/architecture.md` (STANDARDS §7).
- `prisma-adapter-mysql/examples/` → add to `publish.exclude` (examples are build-time only, not docs).

### 6. `prisma-adapter-mysql` `skipLibCheck` (OQ-7) — RESOLVED

**Decision:** Remove `skipLibCheck: true` from `packages/prisma-adapter-mysql/deno.json`.

**Rationale:** Package already has 0 slow types without it. `skipLibCheck` masks real type problems and violates F-6 integrity. Doc-lint errors are from Prisma driver private types, not missing lib types — those must be fixed with explicit annotations or re-export strategy.

## Open-decision sweep

| # | Question | Status | Resolution |
|---|----------|--------|------------|
| OQ-1 | Slice budget / sub-wave split | **RESOLVED** | 2a / 2b / 2c sub-waves |
| OQ-2 | Per-unit real slow-type + doc-lint counts | **RESOLVED** | Re-baselined in drift.md |
| OQ-3 | `interfaces/` → `ports/` rename + consumers | **RESOLVED** | Rename now; zero external consumers |
| OQ-4 | aspire `./helpers` drop + consumers | **RESOLVED** | Drop now; zero external consumers |
| OQ-5 | `./testing` entrypoint requirement | **RESOLVED** | Required for kv, database, queue, cron |
| OQ-6 | `ARCHITECTURE.md` + `examples/` hygiene | **RESOLVED** | Fold into docs; exclude from publish |
| OQ-7 | `skipLibCheck:true` removal | **RESOLVED** | Remove; 0 slow types confirmed without it |

**No open decisions remain.** Every decision above is safe to lock; deferring any would force rework.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| database from-scratch build exceeds slice budget | Medium | High | Database is isolated in 2b (22-slice cap). If it grows, rescope by deferring `./tracing` and `./extensions` doc-lint to debt. |
| Prisma private-type-ref doc-lint errors are unfixable without upstream changes | Medium | Medium | Use explicit type annotations + `satisfies` or re-export wrappers. If still failing, accept debt with `DEBT_ACCEPTED` and F-7 gate note. |
| Consumer `deno check` fails after rename (false negative from grep) | Low | Medium | Consumer gate runs `deno check` on `packages/cli`, `plugins/*` after every rename slice. |
| `deno task e2e:cli` fails due to unrelated Wave-0/1 drift | Low | High | Run e2e:cli as final slice of last sub-wave (2c). If unrelated failure, log in drift.md and escalate — do not block merge on out-of-scope issues. |
| kv folder rename (`bridges/` → `adapters/`, `core/` → `application/`) breaks internal imports | Low | Low | Single-package change; `deno check` inside package catches it immediately. |

## Full A2 gate set

Per `archetypes/ARCHETYPE-2-integration.md` + `gates/archetype-gate-matrix.md`:

### Static gates (required for every slice)
- `deno check` on affected entrypoints
- `deno fmt --check`
- `deno lint`
- `deno doc --lint <entrypoints>`
- `deno publish --dry-run --allow-dirty` (0 slow types)

### Fitness gates (F-1..F-12, F-14, F-15, F-16, F-17, F-18; F-13 n/a)

Per `gates/archetype-gate-matrix.md` (source of truth), Arch 2 requires the full universal
F-\* family except F-13 (saga/runtime invariants, n/a for A2). F-16/F-17/F-18 are listed in the
matrix but not yet in `archetypes/ARCHETYPE-2-integration.md`'s fitness line — the matrix governs.

| Gate | How verified |
|------|--------------|
| F-1 File-size lint | `.llm/tools/fitness/release-readiness.ts` or manual check |
| F-2 Helper-reinvention scan | No new `utils/` / `helpers/` folders; use `@std/*` |
| F-3 Layering check | `ports/` imports no adapters; `adapters/` imports `ports/` + external |
| F-4 Inheritance audit | Adapters are named classes, not deep hierarchies |
| F-5 Public surface audit | Exports match `deno.json` map; no orphaned files |
| F-6 JSR publishability | `deno publish --dry-run` 0 slow types |
| F-7 Doc-score gate | README ≥ 150; `/docs` present; JSDoc on exported symbols |
| F-8 Workspace lib check | `deno check` passes with workspace flags |
| F-9 Permission decl check | README documents `--allow-*` requirements |
| F-10 Test-shape audit | Tests exist; defensive I/O tests for timers/polling/connections |
| F-11 Forbidden-folder lint | No `interfaces/`, `utils/`, `helpers/` (post-rename) |
| F-12 Naming-convention lint | Adapters named by technology (`deno-kv`, `redis`, `postgres`) |
| F-14 Console-log lint | No `console.log` outside `diagnostics/` |
| F-15 Re-export-upstream lint | Re-exports have explicit types; no naked `export * from 'npm:...'` |
| F-16 Folder-cardinality lint | Each folder (`ports/`, `adapters/`, `application/`, `testing/`) holds ≥2 siblings or is justified; verified during each rename slice (kv 2b-1/2, queue 2c-1, cron 2c-10) |
| F-17 Abstract-derived co-location | Port contract and its adapters live under the same package; `./testing` in-memory adapters co-located with the port they satisfy |
| F-18 Sub-barrel lint | `mod.ts` barrels re-export only their own subtree; no cross-folder sub-barrels introduced by the renames/`./testing` additions |

### Consumer gates (required for renames)
- `deno check` on `packages/cli` after database/queue/cron/aspire changes
- `deno check` on `plugins/triggers`, `plugins/workers` after cron changes
- `deno check` on `plugins/workers` after queue changes

### Runtime gates (optional — where real backend exercised)
- Not required for S1 alpha (no real backends in CI). Deferred to S2.

### Merge-readiness gate
- `deno task e2e:cli` PASS as final slice of 2c (last sub-wave).

## Deferred scope

| Item | Why deferred | Target |
|------|--------------|--------|
| Real backend runtime tests (Redis, Postgres, AMQP, MySQL) | S1 stops at publish-clean dry-run; runtime gates need CI infrastructure | S2 |
| `@netscript/telemetry` instrumentation extraction (saga/worker/scheduler) | Active debt `telemetry-plugin-instrumentation-extraction`; consumers still depend on it | Future plugin-platform pass |
| `@netscript/database` `./tracing` and `./extensions` deep doc-lint | Prisma upstream private types may require debt acceptance | 2b implementation or debt |
| `@netscript/prisma-adapter-mysql` deep doc-lint (Prisma driver private types) | Same upstream issue; may require wrapper types | 2b implementation or debt |
| `packages/shared` datetime refactor | Out of Wave 2 scope | Wave 4+ |
| `deno task e2e:cli` per sub-wave | Run once at end of 2c (final sub-wave); intermediate sub-waves run `deno task check` | 2c final slice |

## Commit slices

### Sub-wave 2a — observability/host (logger · telemetry · aspire)

Target: ~10 slices. Branch: `feat/package-quality-wave2-adapters-2a`.

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | logger: scaffold `/docs` (overview + getting-started) | F-7, doc-lint | `packages/logger/docs/*.md` |
| 2 | logger: add `lint`, `fmt`, `publish:dry-run` tasks; verify 0 slow types | F-6, static | `packages/logger/deno.json` |
| 3 | logger: add `tests/_fixtures/docs-examples_test.ts` doctest | F-10, F-7 | `packages/logger/tests/_fixtures/docs-examples_test.ts` |
| 4 | telemetry: fix 2 doc-lint errors (`SpanAttributes`/`SpanAttributeValue` explicit re-export types) | F-6, F-7 | `packages/telemetry/src/core/types.ts` or re-export site |
| 5 | telemetry: docs parity — verify `/docs` completeness per DOCS-STRUCTURE | F-7 | `packages/telemetry/docs/**/*.md` |
| 6 | telemetry: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 7 | aspire: fix 20 doc-lint errors (Zod schema explicit type annotations) | F-6, F-7 | `packages/aspire/config.ts`, `packages/aspire/types.ts` |
| 8 | aspire: drop `./helpers` export from `deno.json` | F-5, F-11, consumer | `packages/aspire/deno.json` |
| 9 | aspire: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 10 | 2a: consumer gate — `deno check` on CLI + plugins | Consumer | — |

### Sub-wave 2b — data (kv · database · prisma-adapter-mysql)

Target: ~22 slices. Branch: `feat/package-quality-wave2-adapters-2b`.

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | kv: consolidate `bridges/` into existing `adapters/`, rename `core/` → `application/` (note: `adapters/` already exists — merge bridge files in, do not overwrite) | F-3, F-11, F-16 | `packages/kv/bridges/*` → `packages/kv/adapters/*`, `packages/kv/core/*` → `packages/kv/application/*` |
| 2 | kv: update all internal imports after rename | F-3, static | `packages/kv/**/*.ts` |
| 3 | kv: scaffold `/docs` (overview + architecture + recipes) | F-7 | `packages/kv/docs/**/*.md` |
| 4 | kv: move `ARCHITECTURE.md` content into `docs/architecture.md` | F-7 | `packages/kv/docs/architecture.md` |
| 5 | kv: add `./testing` entrypoint with in-memory KV adapter | F-5, F-3 | `packages/kv/src/testing/mod.ts`, `packages/kv/src/testing/memory-kv.ts` |
| 6 | kv: add `lint`, `fmt`, `publish:dry-run` tasks | F-6, static | `packages/kv/deno.json` |
| 7 | kv: add `tests/_fixtures/docs-examples_test.ts` doctest | F-10, F-7 | `packages/kv/tests/_fixtures/docs-examples_test.ts` |
| 8 | kv: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 9 | database: add metadata (`description`, `license`, `publish` block) | F-5, F-6 | `packages/database/deno.json` |
| 10 | database: rename `interfaces/` → `ports/`, update subpath export | F-3, F-11, consumer | `packages/database/interfaces/*` → `packages/database/ports/*`, `packages/database/deno.json` |
| 11 | database: fix 1 slow type (`extensions/sql-json.extension.ts:286` explicit return type) | F-6 | `packages/database/extensions/sql-json.extension.ts` |
| 12 | database: fix doc-lint errors (explicit types on Prisma re-exports, JSDoc on exports) | F-7 | `packages/database/mod.ts`, `packages/database/ports/*.ts`, `packages/database/adapters/*.ts` |
| 13 | database: write README (≥150 LOC) | F-7 | `packages/database/README.md` |
| 14 | database: scaffold `/docs` (overview + adapters + recipes) | F-7 | `packages/database/docs/**/*.md` |
| 15 | database: scaffold `tests/` with basic adapter contract tests | F-10 | `packages/database/tests/adapter-contract_test.ts` |
| 16 | database: add `lint`, `fmt`, `publish:dry-run` tasks | F-6, static | `packages/database/deno.json` |
| 17 | database: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 18 | prisma-adapter-mysql: remove `skipLibCheck:true` | F-6 | `packages/prisma-adapter-mysql/deno.json` |
| 19 | prisma-adapter-mysql: fix type errors surfaced by `skipLibCheck` removal | F-6, static | `packages/prisma-adapter-mysql/src/*.ts` |
| 20 | prisma-adapter-mysql: fix doc-lint errors (explicit types + JSDoc) | F-7 | `packages/prisma-adapter-mysql/src/*.ts` |
| 21 | prisma-adapter-mysql: expand README to ≥150 LOC + scaffold `/docs` | F-7 | `packages/prisma-adapter-mysql/README.md`, `packages/prisma-adapter-mysql/docs/**/*.md` |
| 22 | prisma-adapter-mysql: add `lint`, `fmt`, `publish:dry-run` tasks; exclude `examples/` from publish | F-6, static | `packages/prisma-adapter-mysql/deno.json` |
| 23 | 2b: consumer gate — `deno check` on CLI + plugins | Consumer | — |

### Sub-wave 2c — messaging (queue · cron)

Target: ~14 slices. Branch: `feat/package-quality-wave2-adapters-2c`.

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | queue: rename `interfaces/` → `ports/`, `utils/` → `validation/` | F-3, F-11 | `packages/queue/interfaces/*` → `packages/queue/ports/*`, `packages/queue/utils/*` → `packages/queue/validation/*` |
| 2 | queue: update subpath exports (`./types` → `./ports`, `./validation` stays) | F-5, consumer | `packages/queue/deno.json` |
| 3 | queue: update all internal imports after rename | F-3, static | `packages/queue/**/*.ts` |
| 4 | queue: fix doc-lint errors (JSDoc on all exported symbols) | F-7 | `packages/queue/ports/*.ts`, `packages/queue/adapters/*.ts`, `packages/queue/factory/*.ts` |
| 5 | queue: add `./testing` entrypoint with in-memory queue adapter | F-5, F-3 | `packages/queue/src/testing/mod.ts`, `packages/queue/src/testing/memory-queue.ts` |
| 6 | queue: add defensive I/O tests (abort/cleanup for kv-polling + amqp timers) | F-10 | `packages/queue/tests/abort-cleanup_test.ts` |
| 7 | queue: add `lint`, `fmt`, `publish:dry-run` tasks | F-6, static | `packages/queue/deno.json` |
| 8 | queue: add `tests/_fixtures/docs-examples_test.ts` doctest | F-10, F-7 | `packages/queue/tests/_fixtures/docs-examples_test.ts` |
| 9 | queue: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 10 | cron: rename `interfaces/` → `ports/`, update subpath (`./types` → `./ports`) | F-3, F-11, consumer | `packages/cron/interfaces/*` → `packages/cron/ports/*`, `packages/cron/deno.json` |
| 11 | cron: fix doc-lint errors (JSDoc + `CronProviderRegistry` visibility) | F-7 | `packages/cron/ports/*.ts`, `packages/cron/mod.ts` |
| 12 | cron: add `./testing` entrypoint with in-memory scheduler adapter | F-5, F-3 | `packages/cron/src/testing/mod.ts`, `packages/cron/src/testing/memory-scheduler.ts` |
| 13 | cron: add defensive I/O tests (abort/cleanup for scheduler timers) | F-10 | `packages/cron/tests/abort-cleanup_test.ts` |
| 14 | cron: add `lint`, `fmt`, `publish:dry-run` tasks; scaffold `/docs` | F-6, F-7, static | `packages/cron/deno.json`, `packages/cron/docs/**/*.md` |
| 15 | cron: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |
| 16 | 2c: consumer gate — `deno check` on CLI + plugins | Consumer | — |
| 17 | **Merge-readiness: `deno task e2e:cli`** | Runtime/merge | — |

## Debt implications

The following debt entries will be **closed** by this wave:

| Debt entry | Closing slice | How |
|------------|---------------|-----|
| `packages/database — AP-17 / doctrine verdict Refactor` | 2b slice 10 | `interfaces/` → `ports/` rename |
| `packages/cron — AP-17 / doctrine verdict Refactor` | 2c slice 10 | `interfaces/` → `ports/` rename |
| `packages/queue — AP-16 / doctrine verdict Refactor` | 2c slice 1 | `utils/` → `validation/`, `interfaces/` → `ports/` |
| `packages/aspire/deno.json — ./helpers alpha compatibility subpath` | 2a slice 8 | Remove `./helpers` export |

The following debt entries remain **open** (not touched by this wave):

| Debt entry | Status |
|------------|--------|
| `packages/kv — AP-1 / doctrine verdict Refactor` | OPEN — bridge_test.ts god file not touched |
| `packages/telemetry — doctrine verdict Refactor` | OPEN — instrumentation extraction deferred |
| `telemetry-plugin-instrumentation-extraction` | OPEN — deferred per plan |

## jsr-audit surface scan (post-plan)

| Unit | Meta | README ≥150 | `/docs` | 0 slow types | doc-lint clean | `./testing` |
|------|------|-------------|---------|--------------|----------------|-------------|
| logger | ✓ | ✓ 202 | Planned | ✓ | ✓ | N/A (facade) |
| telemetry | ✓ | ✓ 233 | ✓ (verify) | ✓ | Planned clean | N/A (facade) |
| aspire | ✓ | ✓ 369 | ✓ (verify) | ✓ | Planned clean | ✓ (exists) |
| kv | ✓ | ⚠ 155 | Planned | ✓ | ✓ | Planned |
| database | Planned | Planned | Planned | Planned | Planned | Planned |
| prisma-adapter-mysql | Planned | Planned | Planned | ✓ | Planned | N/A (single adapter) |
| queue | ✓ | ✓ 251 | Planned | ✓ | Planned | Planned |
| cron | ✓ | ✓ 175 | Planned | ✓ | Planned | Planned |
