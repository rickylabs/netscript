# Research — feat-package-quality-wave2-adapters--adapters

> **Reviewer-seeded staging draft.** Re-baselined **structurally** against
> `feat/package-quality` @ `4c57867` (PR #7 / Wave 1 merge commit). Carried-in
> per-package authority lives in
> `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
> (`plan_{logger,telemetry,aspire,kv,database,queue,cron}.md`) and **predates the
> plugin-platform merge + PR #84** — its slow-type / doc counts are STALE and must
> not be trusted. The structural findings below were verified by reading the tree
> in this worktree. The **dynamic gate numbers (slow-types, `deno doc --lint`
> error counts) were NOT measured during staging** (no deno in the staging
> sandbox) and are marked `MEASURE-FIRST` — running them is Research step 1 for
> the implementation agent.

## Re-baseline protocol (Research step 1 — do this before planning)

Per the supervisor plan Validation Plan gate #1 ("Baseline re-audit"), run and
record REAL current numbers before locking any decision:

```
deno run -A .llm/tools/fitness/release-readiness.ts \
  --out .llm/tmp/run/feat-package-quality-wave2-adapters--adapters/audit --include-plugins
# then per unit, in dependency order:
cd packages/<unit> && deno publish --dry-run --allow-dirty   # 0 slow types?
deno doc --lint <entrypoints>                                 # error count + kind
```

Log every delta vs the carried-in counts in `drift.md`. **If any unit's real
slow-type count is > 0, that is the headline scope for that unit** — the Wave 1
lesson was the opposite (stale audit said dirty, real was 0); do not assume the
direction of the drift either way.

## Surface (8 units, A2 — Integration)

Dependency-ordered per `phase-registry.md` Wave 2 + nested PLAN § 4:
**logger → telemetry → aspire → kv → database → prisma-adapter-mysql → queue → cron**

Intra-wave import edges (confirmed in `deno.json` imports):
- `kv` → `@netscript/logger`
- `queue` → `@netscript/kv`
- `database` / `prisma-adapter-mysql` share the Prisma/MySQL axis.

So the registry order is sound: producers before consumers.

## Per-unit findings (structural, verified)

### `@netscript/logger`  — README 202 ✓ · no `/docs` ✗ · tests ✓
| # | Finding | Verify |
|---|---------|--------|
| L1 | Flat layout, **no `src/`**: `config.ts`, `constants.ts`, `creators.ts`, `middleware.ts`, `orpc.ts`, `orpc-plugin.ts`, `types.ts` at package root. | `ls packages/logger` |
| L2 | `orpc-plugin.ts` exists at root but is **not in `exports`** — confirm it is internal (re-exported) and not orphaned. | `grep -r orpc-plugin packages/logger` |
| L3 | **No `/docs`** (STANDARDS § 7) — needs overview/concepts/getting-started/recipes/reference. | `ls packages/logger/docs` fails |
| L4 | `deno.json` missing `lint`, `fmt`, `publish:dry-run` tasks (has `check`, `test`). | `cat deno.json` |
| L5 | Slow-types: `MEASURE-FIRST`. `deno doc --lint mod.ts middleware.ts orpc.ts`: `MEASURE-FIRST`. |  |
| L6 | Pattern is a logging **facade + sink creators**, not ports/adapters — confirm it should stay flat-with-`src/` rather than invent a port (AP-3 risk if over-abstracted). | doctrine 06 A2 "one adapter → no port" |

### `@netscript/telemetry`  — README 233 ✓ · `/docs` ✓ · tests + `_fixtures` ✓
| # | Finding | Verify |
|---|---------|--------|
| T1 | **Already A2-canonical**: `src/{attributes,config,context,core,diagnostics,instrumentation,orpc,public,runtime}` + `docs/{recipes,reference}` + `tests/_fixtures`. Likely **verify + docs-parity**, not refactor. | `find packages/telemetry -maxdepth 2 -type d` |
| T2 | 8 subpath exports incl `./registry` → `src/runtime/mod.ts`. `strict` + `noUncheckedIndexedAccess` on. | `cat deno.json` |
| T3 | Inherited debt (registry): platform-rewrite **instrumentation** foundation-alpha debt — close if touched, else carry in `arch-debt.md`. | `arch-debt.md` |
| T4 | Slow-types / doc-lint: `MEASURE-FIRST`. Has `publish:dry-run` task already. | |
| T5 | `tests/_fixtures` is the **doctest pattern** to replicate elsewhere (see Wave 1 review lesson R-4). | `ls packages/telemetry/tests/_fixtures` |

### `@netscript/aspire`  — README 369 ✓ · `/docs` ✓ · tests ✓
| # | Finding | Verify |
|---|---------|--------|
| A1 | **Most canonical A2 on the board**: `src/{adapters,application,domain,ports,public,runtime,testing,diagnostics}`. Has a `./testing` port-contract entrypoint already. | `find packages/aspire/src -maxdepth 1 -type d` |
| A2 | **`./helpers` AND `./application` both map to `./src/application/mod.ts`** — `./helpers` is a duplicate, generic-named subpath alias (AP-16 + the registry's "aspire `./helpers` subpath" debt). Alpha = no back-compat → **drop `./helpers`**, grep consumers first. | `cat deno.json` + `grep -r "@netscript/aspire/helpers"` |
| A3 | Slow-types / doc-lint: `MEASURE-FIRST`. Has `publish:dry-run`. | |
| A4 | Verify the `./testing` entrypoint matches the Wave-2 "each adapter ships a `./testing` port-contract entrypoint" success criterion — aspire is the reference. | nested PLAN § 4 Wave 2 |

### `@netscript/kv`  — README 155 ⚠ (thin) · no `/docs` ✗ · tests ✓
| # | Finding | Verify |
|---|---------|--------|
| K1 | Layout `adapters/`, `bridges/`, `core/`, `types/` — **no `src/`**; `kvdex.ts`, `redis.ts` at root as subpath entrypoints. | `ls packages/kv` |
| K2 | **`ARCHITECTURE.md` at root** — non-standard; fold into `/docs` (overview/architecture page). | `ls packages/kv/ARCHITECTURE.md` |
| K3 | `bridges/` + `core/` are **generic folder names** (AP-16 candidates) — classify by role (ports/adapters/application). `types/` is acceptable. | doctrine 05 |
| K4 | **No `/docs`** ✗. README **155** is barely over the 150 floor — thin for an adapter with 3 backends (Redis/Deno KV/in-memory). | `wc -l README.md` |
| K5 | `deno.json` missing `lint`/`fmt`/`publish:dry-run` tasks. Depends on `@netscript/logger` (build logger first). | `cat deno.json` |
| K6 | Slow-types / doc-lint: `MEASURE-FIRST`. Three backends → real port/adapter split worth confirming (AP-3: port must not mirror every Redis op). | |

### `@netscript/database`  — **README ✗ · `/docs` ✗ · tests ✗ · metadata ✗**  (LEAST DEVELOPED — the "runtime-config" of Wave 2)
| # | Finding | Verify |
|---|---------|--------|
| D1 | **No README** at all (F-? README ≥ 150 fails outright). | `ls packages/database/README.md` fails |
| D2 | **No `/docs`**, **no `tests/`**. | `ls packages/database/docs tests` fails |
| D3 | `deno.json` is **bare**: no `description`, no `license`, no `tasks`, no `publish` block. | `cat deno.json` |
| D4 | **`interfaces/` folder → AP-17** (should be `ports/`); exported as `./interfaces`. Also `extensions/`, `scripts/`, flat (no `src/`), `prisma-tracing.ts` at root. | `ls packages/database` |
| D5 | 3 DB adapters (postgres/mssql/mysql) exported as subpaths + `./tracing`, `./extensions`, `./scripts`. Wide public surface → high doc-lint + slow-type exposure. | `cat deno.json` |
| D6 | Slow-types / doc-lint: `MEASURE-FIRST` — **highest risk unit**; Prisma 7 generated types + no `isolatedDeclarations`-friendly return types is the likely slow-type hotspot. | |
| D7 | This unit will dominate the slice budget — treat like runtime-config in Wave 1 (scaffold metadata → layer → README → docs → tests → sweep). | |

### `@netscript/prisma-adapter-mysql`  — README **123 ✗ (<150)** · no `/docs` ✗ · tests ✗
| # | Finding | Verify |
|---|---------|--------|
| P1 | Newest unit (post-PR #84). `exports: "./src/mod.ts"` (single string, not map). README **123 LOC < 150 floor**. | `wc -l README.md` |
| P2 | `deno.json` missing `description`, `license`, `publish` block; has `check`/`test`. | `cat deno.json` |
| P3 | **`skipLibCheck: true`** — may be masking type/slow-type problems; re-measure with it in mind (do not silently keep it to dodge F-6). | `cat deno.json` |
| P4 | `examples/` at package root — publish-hygiene: exclude from `publish.include` or move under `docs/`. | `ls packages/prisma-adapter-mysql` |
| P5 | No `/docs`, no `tests/`. Slow-types / doc-lint: `MEASURE-FIRST`. | |

### `@netscript/queue`  — README 251 ✓ · no `/docs` ✗ · tests ✓
| # | Finding | Verify |
|---|---------|--------|
| Q1 | `adapters/`, `factory/`, `interfaces/`, `internal/`, `utils/` — **no `src/`**. | `ls packages/queue` |
| Q2 | **`interfaces/` → AP-17** (exported as `./types` AND `./errors`). **`utils/` → AP-16** (exported as `./validation`). Renames break consumer subpaths → consumer gate required. | `cat deno.json` + `grep -r "@netscript/queue/\(types\|validation\)"` |
| Q3 | 4 adapters (deno-kv, redis, amqp, kv-polling). zod used for validation — re-check for unsafe `as`/`.transform()` casts (Wave 1 review lesson R-3). | `cat utils/mod.ts` |
| Q4 | `kv-polling` + amqp adapters use timers / long-lived connections → defensive cleanup + abort tests (Wave 1 review lessons R-1/R-2 on watcher/timer leaks). | adapter sources |
| Q5 | No `/docs`. Missing `lint`/`fmt`/`publish:dry-run` tasks. Depends on `@netscript/kv` (kv first). Slow-types/doc-lint: `MEASURE-FIRST`. | |

### `@netscript/cron`  — README 175 ✓ · no `/docs` ✗ · tests ✓
| # | Finding | Verify |
|---|---------|--------|
| C1 | `adapters/`, `interfaces/` — **no `src/`**. Simplest unit after metadata/docs. | `ls packages/cron` |
| C2 | **`interfaces/` → AP-17**; exported as `./types` → `./interfaces/types.ts`, but `check` task references `./interfaces/mod.ts` — confirm both files / the canonical entrypoint. | `cat deno.json` + `ls interfaces` |
| C3 | Scheduler timers → abort/cleanup tests (R-1/R-2). No `/docs`. Missing `lint`/`fmt`/`publish:dry-run` tasks. Slow-types/doc-lint: `MEASURE-FIRST`. | |

## jsr-audit surface scan (Plan-Gate input — PLANNED surface)

| Unit | Meta (name/ver/desc/license) | README ≥150 | `/docs` | Tests | Folder vocab | Subpath-rename risk |
|------|------|------|------|------|------|------|
| logger | ✓ (all present) | ✓ 202 | ✗ | ✓ | flat (no `src/`) | low |
| telemetry | ✓ | ✓ 233 | ✓ | ✓ | canonical | low (verify) |
| aspire | ✓ | ✓ 369 | ✓ | ✓ | canonical | **`./helpers` drop** |
| kv | ✓ | ⚠ 155 | ✗ | ✓ | `bridges/`,`core/` (AP-16?) | low |
| database | **✗ desc+license** | **✗ none** | ✗ | ✗ | **`interfaces/` AP-17** | **`./interfaces`** |
| prisma-adapter-mysql | **✗ desc+license** | **✗ 123** | ✗ | ✗ | `examples/` hygiene; `skipLibCheck` | low |
| queue | ✓ | ✓ 251 | ✗ | ✓ | **`interfaces/` AP-17, `utils/` AP-16** | **`./types`,`./validation`** |
| cron | ✓ | ✓ 175 | ✗ | ✓ | **`interfaces/` AP-17** | **`./types`** |

**Dominant surface risks:** (1) `database` is a from-scratch metadata+README+docs+tests build, like runtime-config in Wave 1; (2) AP-17 `interfaces/` → `ports/` renames on database/queue/cron each break a published subpath → **consumer gates are mandatory**; (3) aspire `./helpers` alias removal; (4) `prisma-adapter-mysql` `skipLibCheck` may hide F-6 slow types; (5) zod validation (queue/aspire) must avoid unsafe coercion casts.

## Open questions for the plan agent (resolve at Plan & Design, before slicing)

| # | Question | Why it must be resolved now |
|---|----------|------------------------------|
| OQ-1 | **Slice budget / sub-wave split.** Wave 1 spent ~9 slices/unit (27 for 3 units). 8 units at that density ≈ 50–70 slices, which **violates the Plan-Gate `< 30 slices` hard cap.** Does Wave 2 stay one PR, or split into sub-waves (e.g. 2a logger·telemetry·aspire, 2b kv·database·prisma-adapter-mysql, 2c queue·cron)? **Deferring this forces a mid-implementation rescope → must resolve now.** Reviewer recommendation: **split** (telemetry+aspire are cheap verify+docs; database is heavy). | Plan-Gate slice cap + rework risk |
| OQ-2 | Per-unit real slow-type + doc-lint counts (`MEASURE-FIRST`). | Direction of drift unknown; scope depends on it |
| OQ-3 | AP-17 `interfaces/`→`ports/` on database/queue/cron: rename now (break subpath) or carry as debt? Who consumes `@netscript/{database/interfaces,queue/types,queue/validation,cron/types}`? | Alpha no-backcompat says rename; needs consumer-impact grep |
| OQ-4 | aspire `./helpers` alias: drop now? Any consumer still on it? | Same |
| OQ-5 | Does every adapter unit owe a `./testing` port-contract entrypoint (registry success criterion), or only the multi-adapter ones (kv/database/queue/cron)? aspire already ships one. | Defines deliverable surface |
| OQ-6 | `kv/ARCHITECTURE.md` and `prisma-adapter-mysql/examples/`: fold into `/docs` or exclude from publish? | Publish hygiene + docs shape |
| OQ-7 | `prisma-adapter-mysql` `skipLibCheck:true` — remove to honestly measure F-6, or document why it must stay? | F-6 integrity |

## Wave 1 review lessons to carry in (apply during plan + slicing)

- **R-1 / R-2 — defensive guards + cleanup.** Wave 1's runtime-config watcher leaked unhandled rejections / late timer fires. Wave 2 has timers/polling/connections everywhere (cron, queue kv-polling/amqp, kv backends, db pools): plan explicit abort/cleanup + malformed-input slices **with tests**.
- **R-3 — no unsafe schema coercion.** Wave 1 shipped `z.unknown().transform(v => v as X)`. Queue/aspire zod surfaces must use explicit schemas, not casts.
- **R-4 — runnable docs + doctests.** Per `docs/architecture/DOCS-STRUCTURE.md`: published examples use `jsr:` specifiers and each runnable recipe has a `tests/_fixtures/docs-examples_test.ts` doctest. telemetry/aspire already do this — replicate.
- **R-5 — JSDoc examples must reference real exported symbols** (Wave 1 referenced non-existent `publishConfigSummary`).
- **R-6 — `deno task e2e:cli` is the merge-readiness gate** (AGENTS.md). Make it an explicit final slice, not an afterthought.
- **R-7 — select the FULL A2 matrix.** Wave 1's plan under-selected gates and PLAN-EVAL had to add them. A2 required fitness set (per `archetypes/ARCHETYPE-2-integration.md`): **F-1..F-12 + F-14 + F-15**, static gates (check/fmt/lint/doc-lint/publish dry-run), **consumer gates** (ports/adapter/subpath renames), runtime gates where a real backend is exercised. List them all in `plan.md` up front.
