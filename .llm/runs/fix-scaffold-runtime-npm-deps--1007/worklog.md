# Worklog: scaffold runtime npm dependencies

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-runtime-npm-deps--1007` |
| Branch | `fix/scaffold-runtime-npm-deps` |
| Archetype | `6 - CLI kernel / scaffold generator` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- Generated dashboard `deno.json` import map; no package exports change.

### Domain Vocabulary

- runtime catalog dependency — npm package required by published Fresh/SDK code during Vite SSR.
- scaffold app catalog — pinned values used to write generated app configuration.

### Ports

- None added.

### Constants

- `SCAFFOLD_APP_CATALOG` — root-catalog-backed version pins.
- `SCAFFOLD_APP_IMPORTS` — emitted `npm:`/`jsr:` import targets.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Bootstrap harness plan | PLAN-EVAL | `.llm/runs/...` |
| 2 | Add runtime imports and drift contract | focused tests + scoped wrappers | CLI catalog/tests, lockfile if validated |
| 3 | Consumer and merge-readiness evidence | pristine HTTP probe + scaffold.runtime | run artifacts only |

### Deferred Scope

- Publishing another canary — release chain owns publication after CI.

### Contributor Path

When a published Fresh runtime begins importing another npm package, add it to the existing runtime dependency contract and scaffold catalog using the root catalog range; the drift test identifies every mirror that must move.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 04:00 CEST | 1 | research | Confirmed production artifact failure and local warm-cache masking behavior. |
| 2026-08-01 04:10 CEST | 1 | issue | Opened #1007 with close-gate acceptance criteria. |
| 2026-08-01 04:16 CEST | 1 | PLAN-EVAL | Qwen formal evaluator PASS, session `31d664ea-98e3-4bcc-9475-53005c9f5595`. |
| 2026-08-01 04:20 CEST | 2 | implementation | Added four missing runtime imports, aligned signals to root catalog, and extracted the existing Fresh runtime list for a three-way drift test. |
| 2026-08-01 04:21 CEST | 2 | focused gate | 15 focused test steps passed. |
| 2026-08-01 04:32 CEST | 3 | cold A/B | Empty-cache canary app returned 500; import-only cold copy returned 200 with 130,356 bytes HTML. |
| 2026-08-01 04:30 CEST | 3 | pristine consumer | Published canary.5 app returned HTTP 200 and 130,143 bytes of HTML. |
| 2026-08-01 04:38 CEST | 3 | full gate | Failed only generated check: SDK resolved incompatible TanStack DB minors. |
| 2026-08-01 04:42 CEST | 3 | rescope | Added SDK runtime set derived from its package manifest; focused tests and scoped wrappers pass. |
| 2026-08-01 04:50 CEST | 3 | dependency diagnosis | `deno why` proved query-db-collection 1.1.0 was the remaining DB 0.6.16 source; aligned to stable 1.2.1. |
| 2026-08-01 05:28 CEST | 3 | full gate diagnosis | Two default-port attempts reached 44/45 gates but the users probe hit a Windows `products.exe` listener on hardcoded port 3001 and its dead database. |
| 2026-08-01 05:42 CEST | 3 | isolated full gate | Temporarily moved only the E2E fixture service port to 13001; the one-pass `scaffold.runtime` suite passed 62/62, including `behavior.app-home`; restored the fixture file afterward. |
| 2026-08-01 05:44 CEST | 3 | IMPL-EVAL | Qwen formal evaluator PASS, session `be84cf2e-211c-4414-9384-5d9c1c2660f3`. |
| 2026-08-01 05:46 CEST | 3 | adversarial review | Anthropic Opus 4.8 APPROVE, session `da8a1c9c-ba35-44dd-b628-01fb3d2c7202`; no blocking findings. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Treat uploaded prod artifact as cold reproduction | It records the exact generated node_modules/Vite failure; local cache later masked it. | run 30677734061 |
| Use one runtime dependency contract | Avoid another drifting hand-maintained subset. | existing Fresh test |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Published command is `init`, not `new` | minor | yes |
| DB-generated files are a prerequisite for service app home | significant | yes |
| Warm local install returned 200 despite missing imports | significant | yes |
| SDK runtime set required in scaffold | significant | yes |
| Query DB collection needed stable compatible release | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | separate formal evaluator | PASS | `.llm/runs/fix-scaffold-runtime-npm-deps--1007/plan-eval.md` |
| IMPL-EVAL | separate formal evaluator | PASS | `.llm/runs/fix-scaffold-runtime-npm-deps--1007/impl-eval.md` |
| opposite-family review | Anthropic Opus 4.8 | APPROVE | `.llm/runs/fix-scaffold-runtime-npm-deps--1007/review.md` |
| focused tests | `deno test -A ...scaffold-app-catalog_test.ts ...generators-config_test.ts ...package-manifest_test.ts` | PASS | 4 tests / 15 steps |
| scoped check/lint/fmt | repo wrappers rooted at `packages/cli` | PASS | 742 selected files; zero findings |
| quality | `deno task quality:gate` | PASS | Existing warnings only; zero failures. |
| JSR doc lint | `deno task doc:lint --root packages/cli --pretty` | PASS | zero errors |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-CLI-OUTPUT | PASS | `scaffold-app-catalog_test.ts`; generator config test | Exact root/Fresh/scaffold imports asserted. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| canary.5 production | FAIL | run 30677734061 artifact | Expected baseline failure. |
| canary.5 cold local baseline | FAIL | exact app-home probe under repo + empty DENO_DIR | Reproduced the same Vite module error. |
| import-only cold A/B | PASS | exact app-home probe, fresh node_modules + DENO_DIR | HTTP 200, 130,356 bytes HTML. |
| pristine fixed consumer | PASS | HTTP 200, 130,143-byte HTML | Current scaffold catalog + published canary.5 packages. |
| scaffold.runtime attempt 1 | FAIL | `plugin-smoke-20260801-040631.log` | Revealed missing SDK app pins; rescope applied. |
| scaffold.runtime default port | BLOCKED | `plugin-smoke-20260801-042859.log` | 44 passed; hardcoded 3001 was owned by out-of-scope Windows `products.exe` PID 10700. |
| scaffold.runtime isolated port | PASS | one-pass command, temporary fixture port 13001 | 62 passed, 0 failed; app-home passed. Fixture source restored and is absent from the branch diff. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| published canary.5 service app | FAIL | production artifact | Vite missing TanStack module. |
| cold app with fixed imports | PASS | preserved canary workspace copy | Exact same topology/probe; only imports and cold install differed. |

## Handoff Notes

- Evaluator should inspect whether the exact runtime subset and three-way drift assertion are sufficient and minimal.
