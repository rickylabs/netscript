# PLAN-EVAL — sagas-prisma-store

- Plan evaluator session: openhands · run-27859602970-1 · 2026-06-20
- Run: `feat-framework-prime-time--supervisor` (umbrella PR #73)
- Slice: `sagas-prisma-store` (Track-3)
- Surface / archetype: ARCHETYPE-2 (Integration, `PrismaSagaStore`) + ARCHETYPE-5 (Plugin Package, schema contribution, runtime wiring, barrels) + SCOPE-service (composition-root selection in `plugins/sagas/services/src/main.ts`) + CLI touch (`@netscript/cli` saga scaffold backend option)
- Base: `feat/framework-prime-time` (umbrella; contains merged #74 `sagas-durable-store` seam this slice extends)
- Trigger: PLAN-EVAL pass on `research.md`, `plan.md`, `plan-meta.json` (read-only verdict)

## Checklist results

| Plan-Gate item                                                          | Result | Evidence / location |
| ----------------------------------------------------------------------- | ------ | ------------------- |
| Research present and current                                            | PASS   | `research.md` present; post-#74-merge "Formal research" section explicitly re-baselines findings against the merged umbrella (lines 70-133). Spot-checks verified against tree: `SagaStorePort` 7 methods + 1 readonly `id` (no port change), `KvSagaStore` `versionMismatch()` helper at lines 61/69/184-185, `createDurableSagaRuntime` force-opens `Deno.Kv` at line 26, `services/src/main.ts:44` holds `dbClient` and `:67` calls zero-arg factory, `:86` calls `durableRuntime?.kv.close()`, `sagas.prisma` header explicitly frames tables as read-model/projection. |
| Decisions locked                                                        | PASS   | `plan-meta.json` enumerates 9 locked decisions with rationale: plugin placement, dedicated tables, explicit selection, back-compat seam, catalog deps, deferred idempotency, scaffold gate. Each maps to a plan § / design sub-section. |
| Open-decision sweep                                                     | PASS   | `plan-meta.json` `openQuestions` lists 2 decisions with recommended resolution for PLAN-EVAL ratification (dedicated-vs-shared tables → dedicated; explicit-choice-vs-back-compat → reconciled), plus 1 explicit safe-deferral (SagaIdempotencyPort parity). No hidden rework-forcing decisions detected. The plan's reconciliation is internally consistent (see "Open-decision sweep (evaluator-run)" below for ratification). |
| Commit slices (< 30, gate + files each)                                 | PASS   | `plan.md` §5 enumerates 6 ordered slices, each names files touched and the gate that proves it. Slice 1 (schema + migration), 2 (`PrismaSagaStore` + tests), 3 (seam refactor + `dispose()` + barrels + supervisor/main teardown), 4 (env/appsettings selection + tests), 5 (`@netscript/cli` scaffold backend option), 6 (docs reconciliation). All slices < 30. |
| Risk register                                                           | PASS   | `plan.md` §7 names 4 risks with mitigations: seam-teardown (mitigated: `kv` optional + KV-path behavior-identical + supervisor/runtime tests), no-live-DB Prisma testing (mitigated: pglite/embedded Postgres or transaction-rollback fixture + full assertions under `scaffold.runtime`), optimistic-write parity (covered by parity tests), scaffold output changes (mitigated: e2e-cli-gate label + `scaffold.runtime` smoke). |
| Gate set selected                                                       | PASS   | `plan.md` §6 specifies: scoped `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts --ext ts,tsx` over `plugins/sagas`, `packages/plugin-sagas-core` (unchanged-surface verify), `@netscript/cli` touch; `deno test --unstable-kv --allow-all` over `packages/plugin-sagas-core plugins/sagas` with Prisma store suite; `deno publish --dry-run` + JSR audit; `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` REQUIRED at eval (scaffold output changed) with `e2e-cli-gate` label; `deno task arch:check`; lock-hygiene guard for `@prisma/client`. Covers ARCHETYPE-2 (F-1/F-2/F-3/F-4/F-5/F-6/F-7/F-8/F-9/F-10/F-11/F-12/F-14/F-15), ARCHETYPE-5 (F-1/F-3/F-5/F-6/F-7/F-8/F-9/F-10/F-11/F-12/F-13-subtype/F-14/F-15) — see minor note below re: F-13 explicit naming, SCOPE-service contract/runtime/consumer checks. |
| Deferred scope explicit                                                 | PASS   | `plan.md` §1 Out-of-scope explicitly lists: Prisma `SagaIdempotencyPort` parity (deferred, debt-logged), migration of existing read-model/projection tables, any change to core `@netscript/plugin-sagas-core` public surface. Idempotency-port deferral is also captured in `plan-meta.json` locked decisions + risks. |
| jsr-audit surface scan (pkg/plugin)                                     | PASS   | Plugin surface (in scope for JSR): `PrismaSagaStore` + `PrismaSagaStoreOptions` + optional `close()`/`entries()`/`transitions()`; extended `DurableSagaRuntimeOptions` (`backend?` / `prisma?`) and `DurableSagaRuntime` (new `dispose()`, `kv` optional). Core `@netscript/plugin-sagas-core` surface unchanged → no JSR audit delta for core. Plan §6 names `deno publish --dry-run` for touched publishable units and JSR audit (slow-types acceptable per sibling precedent). Acceptable for a plugin-only delta. |

## Open-decision sweep (evaluator-run)

Two open decisions surfaced by the plan were re-evaluated against the tree:

1. **Dedicated durable runtime tables vs promoting projection `SagaInstance`.** Plan recommends dedicated (`saga_runtime_state` / `saga_runtime_transition` / `saga_runtime_correlation`). Ratified.
   - Rationale: `SagaStorePort` keys primarily on `instanceId`; `SagaInstance` PK is composite `[sagaName, id]` — structural mismatch. Promoting would require a PK migration, overload projection semantics, and break #74's read-model/projection framing. Dedicated tables mirror KV namespaces exactly, keep durable-write and read-model concerns separate, and do not require migration of existing rows.
   - Alternative considered and rejected by the plan is sound (no rework-forcing concern hidden).

2. **No-implicit-default vs back-compat.** Plan retains zero-arg `createDurableSagaRuntime()` KV default for existing internal callers (`saga-supervisor.ts:132`, `services/src/main.ts:67`) while scaffold + docs always present an explicit KV/Prisma choice, and the multi-backend entrypoint (env-reading helper) errors on unresolved. Ratified.
   - Rationale: the zero-arg function is the KV-entrypoint; the multi-backend helper is a separate function. Both can coexist. Internal callers are plugin-controlled (no public-API breakage); public scaffold output always requires explicit choice; the spec's "no silent default" requirement is honored on the public surface (scaffold + multi-backend helper).
   - One minor ambiguity worth resolving at IMPL-EVAL: the plan should explicitly state that the **existing** zero-arg `createDurableSagaRuntime()` keeps KV for back-compat, and the **new** multi-backend helper (which reads `NETSCRIPT_SAGA_STORE` env / appsettings) is a distinct function that errors on unresolved. This is implied by §4.3 but the wording could be tightened. Not a rework-forcing issue.

No additional open decisions were detected. Specifically: the choice between `PrismaSagaStore` and `PostgresSagaStore` naming (note that `.llm/harness/profiles/sagas/extension-axes.md:15` currently uses `PostgresSagaStore (planned)`) is a documentation consistency fix, not an open architectural decision; the plan's reconciliation step §4.5 covers updating that line.

## Verdict

`PASS`

Every plan-gate checkbox is satisfied. The plan is additive, contract-first (no `SagaStorePort` change, no `#74` rework), honors catalog law (`@prisma/client ^7.8.0` already cataloged at `deno.json:106`), specifies byte-intended error-shape parity for `SagasError.validationFailed("Saga store version mismatch for <instanceId>")`, makes the seam refactor backward-compatible (`kv` becomes optional, `dispose()` added, supervisor + main updated), surfaces the deferred Prisma idempotency port scope explicitly (recorded as debt, not silently dropped), and selects the right gate set for ARCHETYPE-2 + ARCHETYPE-5 + SCOPE-service including the required `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` smoke + `e2e-cli-gate` label (scaffold output changes).

Both open decisions are ratified as proposed by the plan.

### Doc-precision notes for IMPL-EVAL (non-blocking, apply during slicing)

These do not fail any plan-gate box; they are corrections to fold into the plan (or directly into the implementation) so the IMPL pass runs clean.

1. **Error-string trailing period** — `plan.md` §3 quotes the error shape as `SagasError.validationFailed("Saga store version mismatch for <instanceId>")`, but both `KvSagaStore` (`plugins/sagas/src/runtime/kv-saga-store.ts:185`) and `MemorySagaStore` (`packages/plugin-sagas-core/src/testing/memory-saga-store.ts:48`) include a trailing period: ``Saga store version mismatch for ${instanceId}.``. The plan correctly claims "byte-identical" but the literal string it gives would not produce a byte-identical message. Fix: render the spec as ``Saga store version mismatch for ${instanceId}.`` (with the period) so parity tests asserting on the message substring (e.g. `kv-saga-store_test.ts:58`, `durable-saga-restart_test.ts:58` match the prefix `'Saga store version mismatch'`) stay in sync with what `PrismaSagaStore` will actually throw.

2. **`extension-axes.md` reconciliation** — `plan.md` §4.5 says to update `.llm/harness/profiles/sagas/extension-axes.md:15` to mark `PostgresSagaStore` as "implemented, not 'planned'". The plan uses the name `PrismaSagaStore` throughout; the extension-axes.md line uses `PostgresSagaStore`. Either rename to `PrismaSagaStore` in extension-axes.md (preferred, matches plan + new `id = 'prisma-saga-store'` convention), or add `PrismaSagaStore` as the chosen class name alongside a one-line note. Decide at slice 6 (docs reconciliation) and apply consistently.

3. **F-13 explicit naming** — ARCHETYPE-5 lists F-13 (Saga/runtime invariants) as a subtype gate "when runtime declarations require it". This slice does change runtime teardown (`createDurableSagaRuntime` return shape, `saga-supervisor.ts:142`, `services/src/main.ts:86`). Add F-13 to the gate-set list in `plan.md` §6 with the test-plan items that satisfy it (round-trip save/load, appendTransition ordering, correlation save/findByCorrelation, delete cascade, version-mismatch parity) so the IMPL evaluator can map slices to gates without inference.

### If FAIL_PLAN — required fixes

(none — verdict is PASS)
