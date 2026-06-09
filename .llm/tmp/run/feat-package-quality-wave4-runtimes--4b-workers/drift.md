# Drift Log — feat-package-quality-wave4-runtimes--4b-workers

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a pull-forward)

| Item | Status | Action for 4b |
|------|--------|---------------|
| `plugin-workers-core` doc-lint = 460 (180 ptr + 280 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-workers` doc-lint = 143 (83 ptr + 60 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| `plugin-workers` tests = 0 | A5 ⇒ F-10 required | Build real test layer. |
| 17-export core surface | F-5/F-16 challenge | Consumer scan; trim or justify each. `./contracts`==`./contracts/v1` duplicate alias → candidate fold. |
| F-1 over-cap: workers.contract 501, worker/scheduler 469 | measured | Concept-split (per-layer for `.contract.ts` if warranted). |
| `plugin-workers` missing `publish:dry-run` task | F-6 | Add. `check` should enumerate all entrypoints. |
| `*-workers-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 + Runtime/Aspire required. |
| `workers-core ./streams` re-exports plugin-streams-core | couples to 4a | Re-measure after 4a pull-forward. |
| Possible `4b-core`/`4b-plugin` split | sizing | Decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-09 | info | Pull-forward done by supervisor | 4a merged (umbrella `2c24662`); 4b merged it (`173357c`), merge-base now `2c24662` | Base current. Re-measure `workers-core ./streams` surface (plugin-streams-core went 1→0 doc-lint + A1→A3 in 4a) — attribute per entrypoint. |
| 2026-06-09 | info | **Umbrella-level carry from 4a IMPL-EVAL** | `packages/cli` `deno task check` fails TS9016/TS9027 in `src/maintainer/features/sync/plugin/copy-official-plugin.ts` (byte-identical to base `ee9f26b`; pre-existing Wave 6 CLI debt) | NOT a 4b concern. When running consumer-import checks against `packages/cli`, scope to type-resolution of the workers surface; do not treat the pre-existing isolated-declarations failure as a 4b regression. Tracked in `arch-debt.md`. |
| 2026-06-09 | **significant** | **Core archetype A3 declared** | `plugin-workers-core` owns JobDispatcher, InProcessJobRunner, KvExecutionState, MultiRuntimeTaskExecutor, WorkflowExecutor, ShutdownManager — all long-running stateful behavior with lifecycle | Gate delta: F-13 **required** (was n/a), Runtime/Aspire validation **required** (was optional), consumer-import **required** (was optional). Recorded in `docs/architecture.md` (slice C1). |
| 2026-06-09 | info | `./contracts` duplicate alias folded | Both `./contracts` and `./contracts/v1` pointed to `src/contracts/v1/mod.ts`; only `./contracts/v1` retained. Consumer `plugins/workers/contracts.ts` updated. | Reduces entrypoints 17→16. F-5/F-16 surface challenge mitigated. |
| 2026-06-09 | info | Plugin version mismatch found | `plugins/workers/src/public/mod.ts` declares `0.1.0`, `deno.json` says `0.0.1-alpha.0` | Fix in slice C3 (core) / P1 (plugin). |
| 2026-06-09 | info | Zod schema ptr leaks classified | 75 of 180 core ptr errors originate from `zod/4.4.3/v4/classic/schemas.d.cts` via `public-schema.ts` | Third-party type leak — fix with package-owned structural types or `@ignore` fallback (slice C8). |
| 2026-06-09 | info | #96 carry triaged | Worker-job typing drift = package debt (ptr-fix slices); generated-DB artifacts = environment (out of scope) | Documented in research.md §6. |
| 2026-06-09 | info | New tool promoted | `.llm/tools/run-deno-doc-lint.ts` created for MEASURE-FIRST, promoted to `.llm/tools/` | Available for future package-quality waves. |

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
