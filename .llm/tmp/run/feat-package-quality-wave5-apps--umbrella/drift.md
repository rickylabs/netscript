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

## Carried-in caveats

| Item | Decision | Impact |
|------|----------|--------|
| `fresh/streams` + `sdk/streams` ↔ Wave 4 streams package | Lock these surfaces **after** the post-Wave-4 reconciliation pass. | Avoids double-churn when Wave 4 fixes the streams package surface (RFC 16 §9 mode-parity). |
| `defineFreshApp` plugin composition (sagas/workers, RFC 14 §10) | Consumer scan reflects final Wave 3+4 plugin surface; reconcile post-merge. | 5d-6 (defineFreshApp final surface) is the last cut for this reason. |
| RFC 14 unified mode | **Out of scope to implement.** Protect seams only (transport, defineFreshApp extension). | Deliverable = "unified-mode seam audit" note per package's `docs/architecture.md`. |
| `@netscript/ui-primitives` | RFC-deferred — do NOT create. | fresh-ui ships the seams; no new package. |

## Implementation drift

(append during Plan + Implement, per sub-wave)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
