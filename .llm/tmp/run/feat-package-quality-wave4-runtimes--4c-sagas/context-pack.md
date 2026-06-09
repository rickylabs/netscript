# Sub-wave Context Pack — Wave 4 · 4c: sagas

Run ID: `feat-package-quality-wave4-runtimes--4c-sagas`
Sub-branch: `feat/package-quality-wave4-runtimes-4c` (forked off umbrella
`feat/package-quality-wave4-runtimes` @ `ee9f26b`).
PR target: the **umbrella** (NOT the track).
Role: SUPERVISOR-authored seed + pre-research. Locked slice authority = this sub-wave's
`plan.md` once PLAN-EVAL-approved.

## STATUS: IMPLEMENTING — PLAN-EVAL PASS

PLAN-EVAL passed in a separate OpenHands evaluator session on 2026-06-09. The locked slice authority
is `plan.md`; implementation is proceeding one slice at a time.

### Progress

| Slice | Status | Evidence |
|-------|--------|----------|
| C1 | complete | `50d17a5` declared `@netscript/plugin-sagas-core` as A3, enumerated all 19 entrypoints in `check`, added `test`; raw `deno check --unstable-kv` PASS; `deno task test` PASS, 17 passed / 0 failed |
| C2 | complete | `4295c3c` fixed root/builders/config/agent private-type references with first-party re-exports and structural config schema contract; targeted raw `deno doc --lint` PASS; raw all-entrypoint `deno check --unstable-kv` PASS |
| C3 | complete | `172f42d` fixed contracts/v1, domain, and streams public docs/type refs with structural schema/contract wrappers and first-party stream type re-exports; targeted raw `deno doc --lint` PASS; raw all-entrypoint `deno check --unstable-kv` PASS |
| C4 | complete | `9226dcc` fixed integration/workers and integration/publisher private-type refs with first-party type re-exports and method docs; targeted raw `deno doc --lint` PASS; raw all-entrypoint `deno check --unstable-kv` PASS |
| C5 | complete | `0ea4771` fixed ports public-surface private-type refs with explicit first-party domain/runtime re-exports and port-member docs; targeted raw `deno doc --lint` PASS; raw all-entrypoint `deno check --unstable-kv` PASS |
| C6 | complete | `64711a1` fixed runtime public-surface private-type refs with explicit first-party domain/port/adapter re-exports; targeted raw `deno doc --lint` has `private-type-ref-count=0` with C11 `missing-jsdoc` remaining; raw all-entrypoint `deno check --unstable-kv` PASS |

Historical seed note: this worktree originally forked before 4a and 4b merged into the umbrella.
The supervisor later pulled both forward, the generator re-ran MEASURE-FIRST, and PLAN-EVAL locked
the resulting plan.

## Scope — 2 publishable units (long pole #2)

| Unit | Tier / archetype (confirm) | exports | src LOC | files | tests | README | docs/ | largest file | doc-lint (full-export) | dry-run |
|------|----------------------------|--------:|--------:|------:|------:|-------:|:-----:|--------------|----------------------:|:-------:|
| `@netscript/plugin-sagas-core` | core — **A3 (decide)** | **19** | 6,768 | 80 | 5 | 166 | ✓ | redis-transport **481** | **397** (48 ptr + 349 jsdoc) | PASS |
| `@netscript/plugin-sagas` | **A5** plugin | 12 | 2,396 | 30 | **0** | 99 | ✓ | services/routers/v1 **716** | **122** (71 ptr + 51 jsdoc) | PASS |

Family doc-lint = **519**. Both `0.0.1-alpha.0`. (`ptr` = private-type-ref.)

## Headline — saga runtime invariants + the 716-LOC router + ports/adapters discipline

- **Fine-tuning, NOT a slow-type rebuild:** both PASS dry-run, 0 slow types (provenance #96). Work =
  519 doc-lint, the 0-test A5 plugin, F-1 over-cap (the **716-LOC `services/routers/v1.ts` is the
  largest file on the whole board**), the **19-export surface challenge**, and the
  ports/adapters/transports/stores/middleware layering audit.
- **`sagas-core` is the canonical F-13 case.** A3 ⇒ **F-13 (saga/runtime invariants) + live
  Runtime/Aspire validation REQUIRED**. Saga state transitions, compensation, and transport
  swappability are the invariants to assert.
- **⚠️ SIZING — split is near-certain.** 519 doc-lint + 19 entrypoints + the 716-LOC router split +
  the 0-test plugin → plan for a **`4c-core` / `4c-plugin`** split (split-strategy "Open sizing
  risk"). Confirm at the Plan Gate.

## The real work items for 4c

1. **Core archetype A3 (decide & declare).** Saga runtime invariants are the canonical F-13 case.
   A3 ⇒ F-13 + Runtime/Aspire validation + consumer-import required. Declare in
   `docs/architecture.md`; gate delta in `drift.md`.
2. **19-export surface challenge (F-5 + F-16).** Confirm the **ports/adapters split is clean
   (F-3 layering)** and transports are swappable behind a port: `./ports ./adapters ./transports
   ./stores ./middleware`. Are `./streams ./presets ./agent ./abstracts ./integration/workers
   ./integration/publisher` all alpha-intended public API? Prove consumers before trimming.
3. **`plugin-sagas` has ZERO tests** (A5 ⇒ F-10 + Runtime/Aspire validation REQUIRED) — real test
   layer (manifest, CLI, Aspire, E2E gates, runtime).
4. **F-1 over-cap — the two biggest:** `services/routers/v1.ts` **716** (concept-split mandatory;
   also the A5 service layer flagged by #96 typing drift), `redis-transport` **481** (likely a
   ports/adapter concern-split). README `plugin-sagas` is only 99 LOC (< 150 → lift).
5. **F-6 task hygiene:** `sagas-core` lacks a `test` task; `plugin-sagas` lacks `publish:dry-run`;
   `check` should enumerate all entrypoints.
6. **`unanalyzable-dynamic-import`:** plugin-sagas ×2 (accept-and-document vs resolve).

## Known-soft area (from #96)

`plugin-sagas` `services/routers/v1.ts` (716) is the A5 service layer; #96 left service-router
typing drift. Triage package-debt vs generated-artifact/environment before scoping.

## Private-type-ref fix strategy (Wave 3 LD-8 + 4a PLAN-EVAL precedent — APPLY)

48+71 leaks. Fix by **type origin** (do NOT blanket-export): first-party `@netscript/*` → type
re-export; third-party (e.g. `StandardSchemaV1`) → package-owned structural type; internal-leak →
F-5 trim; `@ignore` only for genuinely-internal incidental refs.

## MEASURE-FIRST (generator — re-run after the 4a + 4b pull-forward)

- Full-export `deno doc --lint` **per entrypoint** (attribute the 397/122). Supervisor pre-measure
  at `ee9f26b`: core 397 / plugin 122 (see `pre-research.md`).
- `deno publish --dry-run --allow-dirty` per unit (expect PASS).
- `deno check --unstable-kv` over all entrypoints.
- Consumer scan for the F-5 19-export challenge.

## Phase 0 reading

1. This pack + `pre-research.md` + umbrella `research.md` (§§0–8) + `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,5}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*`.
4. Canonical (STALE — intent + Concept-of-Done only): `plan_sagas.md`/`evaluate_sagas.md`,
   `plan_plugin-sagas.md`/`evaluate_plugin-sagas.md` (name map: umbrella `research.md` §7).
5. Focused code: `deno.json` + entrypoints. Prefer `deno doc` over whole-file reads.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL each a SEPARATE session. Handover = Research → Plan & Design.
- PLAN-EVAL routing Option A. Hard stop before code.
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`. Record drift + renames in `drift.md`.

## Close

4c merges into the umbrella after IMPL-EVAL PASS. **4d (triggers) forks off the 4c-merged
umbrella** (runs LAST). If split, `4c-plugin` forks off the `4c-core`-merged umbrella.

## Implementation Progress

- 2026-06-09 C7: `@netscript/plugin-sagas-core` adapters/middleware/presets private-type refs cleared by explicit first-party type closure exports and package-owned structural Hono-compatible middleware types. Implementation `1a3a0f0`; raw doc-lint target exits 1 with `private-type-ref-count=0` and remaining `missing-jsdoc`; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C8: `@netscript/plugin-sagas-core` transports/stores private-type refs cleared by explicit first-party transport, store, domain, and idempotency closure exports from role-named barrels. Implementation `89de256`; raw doc-lint target exits 1 with `private-type-ref-count=0` and remaining transport `missing-jsdoc`; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C9: `@netscript/plugin-sagas-core` abstracts/testing private-type refs cleared by explicit first-party domain, port, idempotency, and runtime closure exports from alpha-retained helper barrels. Implementation `2fcc508`; raw doc-lint target exits 1 with `private-type-ref-count=0` and remaining `missing-jsdoc`; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C10: `@netscript/plugin-sagas-core` telemetry docs completed for `mod.ts`, `instrumentation.ts`, and `attributes.ts`; telemetry durability-tier closure exported. Implementation `285cc54`; raw targeted doc-lint PASS; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C11: `@netscript/plugin-sagas-core` runtime-reachable public member docs completed across native engine, scheduler, runtime facade, compensator, idempotency store, logger, and legacy adapter interfaces. Implementation `9e0fcba`; raw targeted doc-lint PASS; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C12: `@netscript/plugin-sagas-core` transport public docs completed across list/redis transports, delayed processors, subscriptions, and ack helpers; `SagaCorrelationKey` exported from `src/transports/mod.ts` as first-party closure for `SagaMessage`. Implementation `2ac8e04`; raw targeted doc-lint PASS with zero `missing-jsdoc`/`private-type-ref`; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C13: `@netscript/plugin-sagas-core` transport monolith split completed per locked F-1 names: Redis command/key/default-client/pending-claim helpers moved to `redis-transport-commands.ts`; LIST command/key/default-client/orphan-reclaim helpers moved to `list-transport-commands.ts`; class files are now 321/318 LOC and command files are 292/303 LOC. AP-1 packages/sagas transport debt closed in `.llm/harness/debt/arch-debt.md`. Implementation `cecfa65`; raw targeted doc-lint PASS; raw all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 C14: `@netscript/plugin-sagas-core` validation sweep completed. Implementation `70c475b` closed residual public-member docs, lint findings, and scoped package formatting required by raw gates. Evidence files under `core/slice-c14-*`: full-export doc-lint PASS with zero `missing-jsdoc` and zero `private-type-ref`; helper doc-lint JSON PASS; all 19 entrypoints `deno check --unstable-kv` PASS; dry-run PASS with `slow-type-count=0`; lint PASS; fmt check PASS; test task PASS; focused F-13 runtime tests PASS; Runtime/Aspire entrypoint check PASS. Consumer-import PASS for `plugins/triggers`, core-facing `plugins/sagas` surfaces, and `packages/cli`; full `plugins/sagas` export check is captured as a pending plugin-unit failure in `streams/factory.ts`.
- 2026-06-09 P1: `@netscript/plugin-sagas` task hygiene started. Implementation `ed4eae9` makes `check` enumerate all 12 locked entrypoints with `--unstable-kv` and adds `publish:dry-run`. Raw check and dry-run evidence both currently fail in `streams/factory.ts` on `StreamStateDefinition` assignability; `slow-type-count=0`. This is the same plugin-unit issue recorded during C14 consumer-import and remains pending for locked P-slices.
- 2026-06-09 P2: `@netscript/plugin-sagas` root/public/contracts private-type refs cleared. Implementation `bcab195` introduced package-owned structural schema/procedure/router/manifest/contribution types while retaining real oRPC/Zod/plugin manifest values internally. Targeted doc-lint now has `private-type-ref-count=0` and 3 constants `missing-jsdoc` errors left for P6. All-entrypoint check remains blocked only by `streams/factory.ts`.
- 2026-06-09 P3: `@netscript/plugin-sagas` plugin/Aspire/service private-type refs cleared. Implementation `54dfcfa` re-exports P2 structural contribution/manifest helper types, publishes sagas-owned structural Aspire contribution/builder/resource/env/health types, and re-exports `PluginServiceContext` from the service entrypoint. Targeted doc-lint PASS with zero private-type refs and zero missing JSDoc; all-entrypoint check remains blocked only by `streams/factory.ts`.
- 2026-06-09 P4: `@netscript/plugin-sagas` CLI/runtime private-type refs cleared. Implementation `85410b6` adds explicit first-party closure exports from `@netscript/plugin/cli` and `@netscript/plugin-sagas-core` so the runtime and CLI public docs no longer leak private references. Targeted doc-lint has `private-type-ref-count=0` with 13 `missing-jsdoc` findings left for P6/P7; all-entrypoint check remains blocked only by `streams/factory.ts`.
- 2026-06-09 P5: `@netscript/plugin-sagas` stream/server private-type refs cleared and the stream factory type mismatch repaired. Implementation `6496010` publishes stream schema/producer closure exports, documents the Prisma-like mirror record shapes, replaces `SagasStreamDB` with a package-owned structural interface, and casts the durable-streams state schema at the third-party boundary. Targeted doc-lint has `private-type-ref-count=0` with only 6 scaffolding JSDoc findings left for P6; all 12 plugin entrypoints now `deno check --unstable-kv` PASS.
- 2026-06-09 P6: `@netscript/plugin-sagas` contracts/v1 + CLI + scaffolding docs slice completed. Implementation `f4d94f5` documents the remaining CLI and scaffolding public members; contracts/v1 remained clean. Targeted doc-lint PASS with zero private-type refs and zero missing JSDoc; all 12 plugin entrypoints `deno check --unstable-kv` PASS.
- 2026-06-09 P7: `@netscript/plugin-sagas` runtime publisher/supervisor/constants docs slice completed. Implementation `3f5b0c4` documents the remaining runtime members and literal constant type aliases. Targeted doc-lint PASS with zero private-type refs and zero missing JSDoc; all 12 plugin entrypoints `deno check --unstable-kv` PASS.
- 2026-06-09 P8: `@netscript/plugin-sagas` service V1 router F-1 split completed. Implementation `809bc5e` turns `v1.ts` into a 15-line entrypoint and adds `v1-types.ts` (343), `v1-helpers.ts` (255), and `v1-handlers.ts` (265). #96 hand-typed Prisma interface drift is repaired with structural database/query/history/KV fallback types; generated DB artifacts remain out of scope. Targeted doc-lint PASS, targeted service check PASS, and all 12 plugin entrypoints `deno check --unstable-kv` PASS.
- 2026-06-09 P9: `@netscript/plugin-sagas` README lift completed. Implementation `076c2ef` expands README to 205 lines and adds doctested examples for publisher, runtime supervisor, CLI, scaffolding, and Aspire contribution. `deno test --doc README.md` PASS (5/0), full-export doc-lint PASS, and all 12 plugin entrypoints `deno check --unstable-kv` PASS.
- 2026-06-09 P10: `@netscript/plugin-sagas` verifier and manifest contract test completed. Implementation `7ef03e9` adds `verify-plugin.ts` plus `tests/public/manifest_test.ts`; the verifier reports `ok:true` with no findings for the real manifest contribution axes, and the manifest test passes. Targeted doc-lint and all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 P11: `@netscript/plugin-sagas` CLI contribution-registry test completed. Implementation `a4d2ddd` adds `tests/cli/sagas-cli_test.ts` using `SagasCli` with `StaticSagasCliBackend`; focused test PASS (2/0), targeted doc-lint PASS, and all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 P12: `@netscript/plugin-sagas` Aspire contribution and E2E gate tests completed. Implementation `093be5d` adds `tests/aspire/sagas-contribution_test.ts` and `tests/e2e/sagas-gates_test.ts`; focused tests PASS (2/0), targeted doc-lint PASS, and all-entrypoint `deno check --unstable-kv` PASS.
- 2026-06-09 P13: `@netscript/plugin-sagas` validation sweep completed. Implementation `dd707cf` fixes final lint/type/format findings with structural route input/runtime types and small cleanup. Final plugin gates PASS: full-export doc-lint zero errors/private refs/missing JSDoc, all-entrypoint check, dry-run with no slow-type diagnostics, lint, fmt, tests (5/0), verifier `ok:true`, Aspire/E2E focused test (2/0), README `205 >= 150`, and consumer checks for `plugins/triggers`, `plugins/sagas`, and `packages/cli`.
- 2026-06-09 Post-IMPL-EVAL remediation: implementation `d71719c` exports `SagaCorrelation` from the sagas-core public type closure, adds the missing `e2e:cli full` command, aligns generated worker structural interfaces with workers-core runtime returns, and moves trigger behavior/OTEL E2E probes to explicit IPv4 loopback. Evidence PASS: sagas-core doc-lint (`Checked 1 file`), focused `deno check --unstable-kv`, CLI program test (2/0), touched-file fmt check, and full `deno task e2e:cli full --cleanup --format json` (`scaffold.runtime`, 41 passed / 0 failed / 0 skipped).
