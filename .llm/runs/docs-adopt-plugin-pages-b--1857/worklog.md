# Worklog: final plugin reference adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-b--1857` |
| Branch | `docs/adopt-plugin-pages-b` |
| Archetype | `5 - Plugin Package` (documentation only) |
| Scope overlays | `docs` |

## Design

Recorded before implementation edits.

### Public Surface

- Three `PackageMapping` entries for plugin-triggers, plugin-workers, and plugin-auth.
- `ExcludedReferencePage` and `EXCLUDED_REFERENCE_PAGES` for durable IA exclusions.
- A pure reference-page classification validator consumed by `checkDrift` and unit tests.

### Domain Vocabulary

- `mapped reference page` — a one-package page governed by `AUTHORITATIVE_MAPPING`.
- `excluded reference page` — a non-package page with a durable reason.
- `unclassified page` — a physical reference index in neither set.
- `multiply classified page` — a physical reference index in both sets.

### Ports

- Filesystem discovery through existing Deno read permissions — enumerates
  `docs/site/reference/*/index.md`; no new abstraction is needed.
- `deno doc --json` subprocess — research-only source of exported symbol truth.

### Constants

- `AUTHORITATIVE_MAPPING` — 35 package page mappings after S1.
- `EXCLUDED_REFERENCE_PAGES` — one auth-hub exclusion after S2.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Correct/adopt three plugin pages and regenerate derived docs | `deno task docs:exports-drift` plus generator checks | three reference pages, checker mappings, generated corpus, run artifacts |
| 2 | Record auth exclusion and enforce exactly-one coverage | focused test + `deno task docs:exports-drift` | checker, checker test, run artifacts |
| 3 | Freeze final implementation evidence | complete owner-specified gate set | run artifacts only |

### Deferred Scope

- Complete symbol prose for the measured 133/50/79 gaps — separate documentation work.
- Plugin implementation/debt remediation — source changes are explicitly excluded.
- Auth hub content/navigation — settled IA is preserved unchanged.

### Contributor Path

Add a future `docs/site/reference/<name>/index.md` as either a measured `PackageMapping` with
explicit `symbolCoverage` or a typed exclusion with a durable reason; `docs:exports-drift` rejects
neither/both classification.

### PLAN-EVAL

`PLAN-EVAL: N/A` — this is a small, bounded adoption into an existing checker. The owner supplied
the contract, settled IA decision, exact commit split, generator sequence, and full gates; measured
evidence determines the only remaining coverage field.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | bootstrap | re-baseline | Rebased bootstrap commit from `8e01a347a` onto current main `d2b33a09b`. |
| 2026-09-01 | research | checker probe | Baseline 32-row checker exited 0; provisional mappings reproduced 14 findings. |
| 2026-09-01 | research | symbol measurement | All entrypoints measured: triggers 150/17/133, workers 175/125/50, auth 84/5/79. |
| 2026-09-01 | plan | design checkpoint | Locked three implementation slices and `PLAN-EVAL: N/A` before edits. |
| 2026-09-01 | S1 | page adoption | Added six missing rows, repaired nine auth paths/rows, and inserted three cumulative mappings (32 → 35). |
| 2026-09-01 | S1 | regeneration | Ran `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`, all exit 0. |
| 2026-09-01 | S1 | review | Inspected the focused diff against all three manifests and per-entrypoint symbols; preserved the Vento release expression and all 32 existing mappings. |
| 2026-09-01 | S2 | exclusion | Added the typed auth-hub exclusion with all five indexed packages named. |
| 2026-09-01 | S2 | denominator | Added one-level reference index discovery and exactly-one classification errors for neither/both. |
| 2026-09-01 | S2 | tests | Initial focused run caught a missing explicit default-parameter type; fixed it, then 14/14 tests passed. |
| 2026-09-01 | S2 | review | Verified the focused diff, exact failure messages, live `36/36` output, and all 32 baseline mapping names by name. |
| 2026-09-01 | S3 | full gates | All owner-required implementation-head gates passed except the base-relative whitespace check, which identified trailing blank lines in three run artifacts. |
| 2026-09-01 | S3 | evidence correction | Removed only the three trailing artifact blank lines; final evidence is rerun after the S3 push. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| All three mappings are `entrypoints-only` | Every measured symbol gap is nonzero. | `research.md` findings 5–7 |
| Auth is excluded, not mapped | Its Units table indexes five packages. | owner assignment + page |
| Denominator enforcement is separately revertible | Owner explicitly requires its own commit. | `implement.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| RTK binary absent despite skill expectation | minor | yes |
| Initial measurement helper assumed obsolete top-level JSON array | minor | yes |
| `origin/main` advanced from carried-in base | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline export drift | `deno task docs:exports-drift` | PASS (0) | 32-row pre-change baseline. |
| S1 export drift | `deno task docs:exports-drift` | PASS (0) | All 35 mapped pages have exact entrypoint paths. |
| S1 generator sequence | three owner-specified generators | PASS (0/0/0) | Derived prose, CLI carrier, and publish carrier updated. |
| S1 prose convergence | `deno task check:agent-docs-prose` | PASS (0) | Check mode matches regenerated bundle. |
| S1 publish convergence | `deno task check:publish-assets` | PASS (0) | Publish carrier matches generated inputs. |
| S1 assets precommit probe | `deno task check:assets-barrel` | expected non-verdict (1) | Task compares the intentionally changed generated carrier to pre-S1 `HEAD`; rerun after commit. |
| S1 assets committed head | `deno task check:assets-barrel` | PASS (0) | Ran at pushed S1 head `0f1e0dc20`. |
| S2 focused test | structured test wrapper over `check-exports-drift_test.ts` | PASS (0) | 14 passed, 0 failed after type fix. |
| S2 denominator | `deno task docs:exports-drift` | PASS (0) | `36/36; mapped=35; excluded=1`. |
| S2 32-row survival | compare `origin/main` literal names to current mapping | PASS (0) | Baseline 32, current 35, missing none. |
| Export classification | `deno task docs:exports-drift` | PASS (0) | `36/36; mapped=35; excluded=1`. |
| Site source format | `deno task --cwd docs/site check:source-format` | PASS (0) | Implementation head. |
| Site build | `deno task --cwd docs/site build` | PASS (0) | Implementation head. |
| Site links | `deno task --cwd docs/site check:links` | PASS (0) | Implementation head. |
| Site caveats | `deno task --cwd docs/site check:caveats` | PASS (0) | Implementation head. |
| Repository docs links | `deno task docs:links` | PASS (0) | Implementation head. |
| Documentation accuracy | `deno task docs:accuracy` | PASS (0) | Implementation head. |
| Documentation snippets | `deno task docs:snippets` | PASS (0) | Implementation head. |
| Agent prose convergence | `deno task check:agent-docs-prose` | PASS (0) | Implementation head. |
| Assets barrel convergence | `deno task check:assets-barrel` | PASS (0) | Implementation head. |
| Publish assets convergence | `deno task check:publish-assets` | PASS (0) | Implementation head. |
| Generated carrier typecheck | owner-specified `deno check --unstable-kv` | PASS (0) | Both generated TypeScript carriers. |
| Full root tests | `deno task test` | PASS (0) | Definitive implementation-head run. |
| Base-relative whitespace | owner-specified `git diff --check` | FAIL (2) | Found only three trailing blank lines in run artifacts; corrected in S3. |
| Lock hygiene | compare `deno.lock` with `origin/main` | PASS (0) | Unchanged. |
| Provenance ancestry | `git merge-base --is-ancestor 1b65f34f7 HEAD` | PASS (0) | Generated input commit is an ancestor. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5 | PASS | all-entrypoint `deno doc --json` + `docs:exports-drift` | Measured coverage and exact entrypoint tables for 35 mappings. |
| F-7 | PASS | site/repo docs gates | All owner-specified site and repository documentation checks exited 0. |
| F-19 | PASS | focused structured test and `deno task test` | 14/14 focused; full root test task exited 0. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plugin runtime | N/A | no runtime/source change | Documentation/tooling-only slice. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published reference reader | PASS | site build/links/caveats | All exited 0. |
| Generated agent/publish corpus | PASS | generated checks + typecheck | All exited 0. |

## Handoff Notes

- Evaluator should independently recompute the three symbol sets, inspect all 35 mapping names,
  and exercise both uncovered and doubly-classified denominator failures.
