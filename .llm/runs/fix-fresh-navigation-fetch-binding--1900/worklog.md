# Worklog: bind the Fresh navigation platform fetch

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-fresh-navigation-fetch-binding--1900` |
| Branch | `fix/fresh-navigation-fetch-binding` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- `@netscript/fresh/navigation` remains unchanged: two values
  (`installPartialNavigationCoordinator`, `KeyedPartial`) and five types (`ComponentChild`,
  `ComponentChildren`, `KeyedPartialProps`, `PartialNavigationCoordinator`, `RouteChange`).
- `installPartialNavigationCoordinatorForPlatform` and `NavigationPlatform` remain internal test
  seams outside the package export map.

### Domain Vocabulary

- `originalFetch` — raw captured function retained for exact final-disposal restoration.
- `platformFetch` — receiver-bound callable used for transport invocation.
- `NavigationLease` / `ManagedPartialBody` — existing ordering and drain vocabulary, unchanged.

### Ports

- `NavigationPlatform` — existing browser ownership seam; no new method or public seam is added.

### Constants

- None. This slice introduces no finite domain vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Preserve the platform fetch receiver at both invocation sites and prove it with a receiver-sensitive double while retaining drain/restoration behavior. | focused structured Fresh gates + quality/JSR/invariant checks | `coordinator.ts`, `coordinator_test.ts`, run evidence |

### Deferred Scope

- Hosted Chromium `fresh-browser` rerun — supervisor-owned per the lane constraint.
- #1895 fixtures and rebase — owned by #1895 after this fix lands.

### Contributor Path

Read `coordinator.ts` constructor and `interceptFetch()`, then run the colocated
`coordinator_test.ts`; transport receiver, response ordering, drain, and disposal contracts are
covered in that pair.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-09-01T20:33:46Z | bootstrap | re-baseline | Confirmed current `origin/main` and exact seven-symbol navigation surface. |
| 2026-09-01T20:33:46Z | plan | PLAN-EVAL | `N/A` — #1900 supplies a complete mechanical contract, two-file scope, invariant, regression shape, and gate ownership; no architecture or open decision remains. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Preserve raw fetch plus bound callable | Final disposal currently restores by raw function identity. | `plan.md` D1; `coordinator.ts` |
| Bind to `globalThis` | In production it is the Window receiver of `globalThis.fetch`. | #1900 diagnosis; Web Platform edge |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Frontend overlay references absent `.claude/05-frontend.md` and `.resources/deps-docs/` paths in this worktree. | minor | yes |
| Draft PR was not opened with the already-pushed orchestrator brief commit; it will open with the run-plan bootstrap before product implementation. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Focused check/test/lint/fmt | structured wrappers | NOT_RUN | Runs after implementation. |
| Doc lint / publish dry-run | structured doc lint + package task | NOT_RUN | Runs after implementation. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Archetype 4 applicable set | NOT_RUN | `deno task quality:gate` planned | Runs after implementation. |
| F-6 / F-7 JSR surface | PASS (plan scan) | `deno doc` shows unchanged seven-symbol planned surface | Final gates pending. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Focused navigation semantics | NOT_RUN | colocated test suite planned | No local browser. |
| Hosted `fresh-browser` | NOT_RUN | supervisor-owned | Run `33542380097` is the known pre-fix failure. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Navigation entrypoint | PASS (baseline) | `deno doc packages/fresh/src/runtime/navigation/mod.ts` | Seven symbols before implementation. |

## Handoff Notes

- Evaluator should inspect the receiver-sensitive regression first, then raw-vs-bound fetch storage,
  both invocation sites, the disposal identity assertion, and the zero-cancellation production scan.
