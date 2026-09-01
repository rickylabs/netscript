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
| Required final suite | See plan | NOT_RUN | Runs after implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-5 | PASS (research) | all-entrypoint `deno doc --json` unions | Final mapping gate pending. |
| F-7 | NOT_RUN | site/repo docs gates | Runs after implementation. |
| F-19 | NOT_RUN | `deno task test` | Runs after checker test change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plugin runtime | N/A | no runtime/source change | Documentation/tooling-only slice. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published reference reader | NOT_RUN | site build/links/caveats | Runs after implementation. |
| Generated agent/publish corpus | NOT_RUN | generated checks + typecheck | Runs after regeneration. |

## Handoff Notes

- Evaluator should independently recompute the three symbol sets, inspect all 35 mapping names,
  and exercise both uncovered and doubly-classified denominator failures.

