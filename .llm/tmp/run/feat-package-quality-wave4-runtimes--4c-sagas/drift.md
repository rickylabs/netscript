# Drift Log — feat-package-quality-wave4-runtimes--4c-sagas

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a+4b pull-forward)

| Item | Status | Action for 4c |
|------|--------|---------------|
| `plugin-sagas-core` doc-lint = 397 (48 ptr + 349 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-sagas` doc-lint = 122 (71 ptr + 51 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| `plugin-sagas` tests = 0 | A5 ⇒ F-10 required | Build real test layer (manifest/CLI/Aspire/E2E/runtime). |
| 19-export core surface | F-5/F-16 challenge | Consumer scan; trim or justify each. |
| ports/adapters/transports/stores/middleware cluster | F-3 layering | Audit: transports swappable behind a port? |
| F-1 over-cap: services/routers/v1 **716** (biggest on board), redis-transport 481 | measured | Concept-split both; v1 router is also the #96 service-typing-drift area. |
| `sagas-core` missing `test` task; `plugin-sagas` missing `publish:dry-run` | F-6 | Add. `check` should enumerate all entrypoints. |
| `*-sagas-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 (saga invariants) + Runtime/Aspire required. |
| `sagas-core ./streams` re-exports plugin-streams-core | couples to 4a | Re-measure after 4a pull-forward. |
| `sagas-core ./integration/workers` couples to plugin-workers(-core) | couples to 4b | Re-measure after 4b pull-forward. |
| `plugin-sagas` README 99 LOC (<150) | F-7 | Lift. |
| Possible `4c-core`/`4c-plugin` split | sizing | Decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-09 | info | C14 consumer-import split between core-facing sagas surfaces and full plugin export sweep | `core/slice-c14-consumer-sagas-core-import-check.txt` passes for `mod.ts`, public/plugin/Aspire/runtime/contracts; `core/slice-c14-consumer-sagas-check.txt` fails in `plugins/sagas/streams/factory.ts` with a `StreamStateDefinition` assignability error. The failing file is inside the locked upcoming plugin unit, not the core runtime package. | Record as pending P-slice evidence; no core rescope. Keep plugin full-export failure visible for P1-P13 and final plugin sweep. |
| 2026-06-09 | info | P1 task hygiene exposes the same plugin stream type failure through `check` and dry-run | `plugin/slice-p1-deno-check.txt` and `plugin/slice-p1-publish-dry-run.txt` both exit 1 at `plugins/sagas/streams/factory.ts`; dry-run has `slow-type-count=0`. | Do not pull stream typing repair into P1. Keep the locked slice order and resolve in the relevant plugin implementation slice before P13 final validation. |
| 2026-06-09 | info | Pull-forward done by supervisor | 4a merged (umbrella `2c24662`) + 4b merged (umbrella `1896f854`, PR #19); 4c merged the umbrella (`128a0a8`), merge-base now `1896f854` | Base current. Re-measure `sagas-core ./streams` (re-exports the now-A3 `plugin-streams-core`) **and** `./integration/workers` (re-exports the now-A3 `plugin-workers-core`, doc-lint 0) per entrypoint — both upstreams are now clean, so attribute remaining 4c debt to sagas-owned surface. |
| 2026-06-09 | info | **MEASURE-FIRST re-baseline complete** | `plugin-sagas-core` doc-lint = **397** (48 ptr + 349 jsdoc, 19 entrypoints); `plugin-sagas` doc-lint = **122** (71 ptr + 51 jsdoc, 12 entrypoints); family = **519**. Both dry-run PASS (0 slow types). `deno check --unstable-kv` all entrypoints PASS (exit 0). | All findings match pre-research within measurement variance. 4c-owned debt confirmed. |
| 2026-06-09 | info | **F-1 over-cap count revised** | `list-transport.ts` = 453 LOC (was not counted in pre-research); total over-cap = 3 files (v1.ts 715, redis-transport.ts 480, list-transport.ts 453) | Plan updated to split all 3. |
| 2026-06-09 | info | **F-3 layering verdict** | `ports/` → pure contracts; `adapters/` → implement `SagaBusPort`; `transports/` → implement `SagaTransportPort`; `stores/` → pass-through barrel; `middleware/` → consumes ports | **CLEAN** — transports swappable behind port. `stores/` pass-through retained with documented rationale. |
| 2026-06-09 | info | **A3 archetype confirmed** | `plugin-sagas-core` owns SagaEngine + SagaScheduler + SagaCompensator + state transitions + transport implementations + composition root | A3 declared; gate delta = F-13 (saga invariants) + Runtime/Aspire validation + consumer-import REQUIRED. |
| 2026-06-09 | info | **Split decision locked** | 4c-core (~14 slices) + 4c-plugin (~13 slices) = 27 total, <30 per sub-wave | Core merges first; plugin forks off core-merged umbrella. |
| 2026-06-09 | info | Umbrella-level `deno.lock` drift inherited (NOT a 4c finding) | Umbrella carries lock churn introduced by the 4b PLAN-EVAL OpenHands automation (`@opentelemetry/semantic-conventions` 1.40.0→1.28.0 + esbuild/preact/loader additions; +179/−63 vs `2c24662`). 4b validated green on it. | Do NOT revert here (would re-churn). 4c inherits it; MEASURE-FIRST dry-runs run against it. Terminal reconcile = Wave 4 closeout (umbrella→track), via a deliberate reviewed lock pass. Tracked in supervisor registry + `lessons/platform.md`. |
| 2026-06-09 | info | **Umbrella-level carry from 4a/4b IMPL-EVAL** | `packages/cli` `deno task check` fails TS9016/TS9027 in `src/maintainer/features/sync/plugin/copy-official-plugin.ts` (byte-identical to base; pre-existing Wave 6 CLI debt) | NOT a 4c concern. When running consumer-import against `packages/cli`, scope to type-resolution of the sagas surface; do not treat the pre-existing isolated-declarations failure as a 4c regression. Tracked in `arch-debt.md`. |

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-09 | info | P3 uses package-owned structural Aspire contribution types instead of re-exporting upstream `@netscript/aspire` public types | Targeted before-measure showed the upstream Aspire type graph introduced private-type-ref noise into the plugin doc surface; `plugin/slice-p3-doc-lint.txt` passes after the local structural boundary while behavior still registers the same service/background resources. | Keep the A5 plugin surface package-owned per LD-8. Later Aspire registration tests should assert the contribution shape and resource registration contract, not subclass identity. |
