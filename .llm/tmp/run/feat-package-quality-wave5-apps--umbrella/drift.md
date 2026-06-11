# Drift Log — feat-package-quality-wave5-apps--umbrella

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Re-baseline drift (pre-research, 2026-06-08)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | **decision-needed** | **All 4 packages FAIL `deno publish --dry-run`** | Slow types (missing-explicit-return-type): service 8, fresh-ui 6, fresh 4, sdk 2. Unlike Wave 4 (9/9 PASS). | F-6 is RED. Fix slow types **first** per sub-wave before doc-lint. This is real publishability debt — not fine-tuning. |
| 2026-06-08 | **decision-needed** | `private-type-ref` = 138 (sdk 9 / service 14 / fresh 115) | Full-export `deno doc --lint`. Public APIs reference unexported internal types. | Each is a surface decision: export the type (widens surface — weigh F-16) **or** change the signature to a public type. Do NOT blanket-export. Plan per cluster. |
| 2026-06-08 | note | Canonical `evaluate_*`/`plan_*` are pre-rewrite/stale | Predate RFC 12/13/15/16/17 landing + doctrine. | Structural intent only. Re-measure doc-lint + dry-run per sub-wave. |
| 2026-06-08 | **decision-needed** | `fresh` is multi-archetype (A4 builders + A3 route/defer/streams/query + Browser) | 12 subpaths, 13.2k LOC, 276 doc-lint, 13 over-cap. | Declare per-entrypoint-cluster archetype in `docs/architecture.md`; gate set = union. Split into 5d-1..5d-6 (`split-strategy.md`). PLAN-EVAL confirms cut. |
| 2026-06-08 | note | F-16 cardinality risk: sdk + fresh each 12 subpaths | RFC-era additions: sdk `query-client`/`collections`/`streams`; fresh `query`/`streams`/`vite`/`interactive`. | Justify each public subpath or fold. F-18 sub-barrel shape per entrypoint. |
| 2026-06-08 | note | `service` = roughest unit (no README, no tasks, 0 tests, 2 over-cap) | README 0L; deno.json tasks=[]; 0 test files. | Greenfield-quality lift: README ≥150 doctested, task block, tests-from-zero, docs/ + ./testing. Comparable to Wave 4 `watchers`. |
| 2026-06-08 | note | `docs/` + `./testing` missing on all 4; tasks missing on sdk+service | Stat + deno.json. | Net-new per unit: docs scaffold, `./testing` port-contract entrypoint, standardized task block. |
| 2026-06-08 | note | fresh-ui doc-lint = 0 but dry-run FAIL ×6 | Clean `.ts` barrels; slow types in transitively-reached `.tsx` component return types. | fresh-ui work = component-factory return-type annotation + Browser validation, NOT jsdoc. |
| 2026-06-08 | note | Earlier "17k LOC" for fresh included test files | Tests-excluded src = 13,285 LOC across 60 files (16 test files separate). | Use 13.2k src LOC as the planning figure. |

## Reconcile + re-baseline drift (post-Wave-4-merge, 2026-06-10 @ `dfab7a4`)

Wave 4 merged to track (closeout PR #16 → `f0e1441`, all sub-waves IMPL-EVAL PASS). Track
reconciled into this umbrella (`dfab7a4`, merge clean — no conflicts). Apps layer re-baselined
against the merged Wave 4 surface + blessed lock (`wave5-rebaseline.json` + `wave5-doclint.json`,
`research.md` §0.5).

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-10 | **resolved** | All 4 packages now PASS `deno check --unstable-kv` on the merged surface | `wave5-rebaseline.json`: service/sdk/fresh-ui/fresh all exit 0. Earlier baseline (9b27fb4) predated merged Wave 4 runtimes/plugins. | The merged Wave 4 streams/plugin surface resolves the cross-package type references. Type-check is no longer a blocker; F-6 (dry-run) + doc-lint remain. |
| 2026-06-10 | note | Doc-lint + dry-run headline **unchanged** vs 9b27fb4 | Combined doc-lint = **328** (service 23 / sdk 29 / fresh-ui 0 / fresh 276); `private-type-ref` = **138**; all 4 `deno publish --dry-run` exit 1. Identical to pre-merge baseline. | The re-architecture scope (surface encapsulation + slow-type fixes) is unchanged by the merge. Plan to the same numbers. |
| 2026-06-10 | **decision-needed** | Barrel-vs-combined doc-lint gap is large on `fresh` | `fresh` root-barrel `mod.ts` doc-lint = **23** but combined-over-all-entrypoints = **276**. service 23==23, sdk barrel 20 vs combined 29. | **Ground truth = COMBINED run over all `exports` entrypoints.** Generator MEASURE-FIRST + IMPL-EVAL must use the combined sweep (root-barrel undercounts ×12 on fresh). Mirrors the Wave 4c `SagaCorrelation` full-barrel trap (`lessons/validation.md`). |
| 2026-06-10 | note | `fresh/streams` + `sdk/streams` ↔ merged Wave 4 streams: consumer scan re-confirmed | 27 `fresh` files reference sdk/streams/plugin surfaces; all `deno check` PASS against the in-tree `@netscript/plugin-streams(-core)`. | Stream coupling is now against a *real merged* surface, not a moving target. Lock the exact stream surface decision at the 5d-4 plan (no longer "wait for reconcile" — reconcile is done). |
| 2026-06-10 | note | Tooling drift: `parse-deno-check-errors.ts` removed → `run-deno-check.ts` | Wave 4 tail commits 753c431/aa70199; doctrine gained **F-19**. Root `check`/`lint`/`fmt:check` use scoped wrappers excluding Wave 5 app packages + Wave 6 CLI debt + generated targets. | Generator + evaluators use `.llm/tools/run-deno-check.ts`, not the removed path. Scoped wrappers mean a clean root `check` does **not** cover the Wave 5 app packages — run per-package `deno check --unstable-kv` over entrypoints. |

> Exact slow-type counts (missing-explicit-return-type per unit) are re-measured by each sub-wave
> generator at MEASURE-FIRST from `deno publish --dry-run` output; the dry-run summary line was not
> always emitted on this sweep (`dryRunSlowTypes: null`), only the non-zero exit — confirm per unit.

## Carried-in caveats

| Item | Decision | Impact |
|------|----------|--------|
| `fresh/streams` + `sdk/streams` ↔ Wave 4 streams package | **Reconcile DONE** (`dfab7a4`) — merged Wave 4 streams surface is in-tree; all 4 app packages `deno check` PASS against it. Lock the exact stream surface at the 5d-4 plan. | No more double-churn risk; the streams surface is now fixed, not moving. |
| `defineFreshApp` plugin composition (sagas/workers, RFC 14 §10) | **Reconcile DONE** — consumer scan re-confirmed against the merged Wave 3+4 plugin surface (27 `fresh` files). | 5d-6 (defineFreshApp final surface) remains the last cut; surface is now stable to plan against. |
| RFC 14 unified mode | **Out of scope to implement.** Protect seams only (transport, defineFreshApp extension). | Deliverable = "unified-mode seam audit" note per package's `docs/architecture.md`. |
| `@netscript/ui-primitives` | RFC-deferred — do NOT create. | fresh-ui ships the seams; no new package. |

## Implementation drift

(append during Plan + Implement, per sub-wave)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-11 | note | **5a (service) COMPLETE** — PR #25 implemented + merged to umbrella | All locked gates green: dry-run exit 0 (0 slow types, 0 excluded-module), doc-lint 0, tests 17/17, jsr-audit 8/10 (target ≥7), root check/lint/fmt green, `packages/service/` lifted from root exclude. 15/15 slices, each paired with a gate-evidence commit. | Calibration successful: structural-mirror-types + interface-builder + root-exclude-lift pattern is proven; reuse on 5b/5c/5d. |
| 2026-06-11 | note | 5a retro: `src/builder/service-builder.ts` = 604L, over the 350 F-1 cap, and not found in `arch-debt.md` | `wc -l` post-merge; grep of `.llm/harness/debt/arch-debt.md` finds no service-builder entry. | Record a debt entry (or split the builder file) in a 5a follow-up or fold into the engine-seam follow-up below. |
| 2026-06-11 | **decision-needed** | **USER FEEDBACK (post-5a, non-blocking): service still relies directly and heavily on Hono** — doctrine (SOLID/DIP) wants an engine seam so tomorrow's engines (h3, elysia, kito, or spikard for true polyglot services) can plug in without public-surface change | 5a confined Hono to ONE file (`src/builder/service-builder.ts` imports `hono` + `hono/cors`; everything else uses package-owned structural types — `ServiceApp`, `ServiceContext`, `ServiceMiddleware`...). But `ServiceBuilderImpl` still composes `new Hono()` concretely: the *types* are ported, the *engine* is not. | (1) Add `service` follow-up debt entry: introduce an internal `HttpEngine` port (create app, mount middleware/routes, produce `ServiceApp`, serve) with Hono as the first adapter — public surface already engine-neutral, so this is internal-only. (2) 5b+ research must treat "engine/transport adapter seam" as a first-class architecture deliverable, not just package hygiene. |
| 2026-06-11 | **decision-needed** | **USER FEEDBACK (direction): all NetScript packages should converge on the multi-layer composable DSL** that fresh/fresh-ui already sketch — Layer 1 one-liner preset → Layer 2 builder/factory system → Layer 3 primitives + seams (reusable ports) | service already has the 3-layer shape (defineService → createService builder → primitives); fresh has definePage/defineFreshApp presets over builders over route/defer/streams primitives. The doctrine names the layers but does not yet mandate the composability contract between them (each layer expressible in terms of the layer below; seams reusable across packages). | 5b (sdk) research+plan must include an explicit architecture-design section: layer map, DX target (one-liner → escape hatch without cliff), full type inference across layers, and seam reuse (RFC 14 transport, RFC 17 query-client). Candidate doctrine amendment ("composability layers") to propose at umbrella close. |
