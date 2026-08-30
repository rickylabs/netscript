# Plan: Fresh query hydration readonly/mutable type correction

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-query-hydration-readonly-state--1734` |
| Branch | `fix/fresh-query-hydration-readonly-state` |
| Phase | `plan` |
| Target | `packages/fresh` query hydration boundary |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (contract check only; no route/browser/visual behavior changes) |

## Archetype

Archetype 4 is the package's measured doctrine assignment. The query integration concern folds into
that package archetype; this slice does not reclassify or reshape the package.

## Current Doctrine Verdict

`Keep` — preserve per-concern builders and route contracts. This slice preserves the query export
surface and corrects one private upstream boundary.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The existing readonly package-owned type remains the public contract. |
| A2 | The upstream mutable requirement is contained at the private boundary. |
| A14 | A 5.102.x RED type fixture closes the lockfile blind spot. |

## Goal

Keep `@tanstack/query-core@^5.101.0`, make hydration soundly compatible with both 5.101.x and
5.102.x, and add a regression that fails on the base implementation under 5.102.8.

## Scope

- Add a compile-time 5.102.8 hydration regression fixture and focused test command.
- Validate/narrow the package-owned readonly state at the private hydration boundary, then pass
  mutable copies to TanStack.
- Prove focused and workspace static gates without a runtime lease.

## Non-Scope

- No public `DehydratedState`, query export, island/defer, SDK discovery, or scaffold-runtime change.
- No Aspire, Docker, browser, `scaffold.runtime`, or `e2e:cli` execution.
- No work on #1728, #1371, or #1732.

## Hidden Scope

- Both dependency signatures must type-check independently of the root lockfile.
- The final PR must state that `scaffold.runtime` is delegated to CI.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Retain `npm:@tanstack/query-core@^5.101.0`. | The code will support both known signatures; narrowing would discard supported consumers and hide future drift. |
| D2 | Preserve the public readonly `DehydratedState` exactly. | Widening to mutable or leaking upstream types is unnecessary and contrary to the package-owned boundary. |
| D3 | Use exhaustive private shape guards plus mutable object/array copies. | This restores assignability without `any`, assertions, double casts, or suppressions and fails closed for invalid input. |
| D4 | Pin 5.102.8 only in the regression fixture/config, not the package dependency. | The fixture must remain independent of root lock resolution while the package retains its supported range. |
| D5 | Normalize JSON error records into real `Error` instances at the private hydration boundary. | JSON erases ordinary `Error` values to `{}`; accepting that record as `Error` would lie to TanStack's `Error \| null` contract. Revival restores the declared runtime type without a cast and preserves string `message`, `name`, and `stack` fields when the serializer retained them. |
| D6 | Treat absent mutation `context`/`data`/`variables` and query `data` as `undefined`. | All four fields legitimately admit `undefined`, which JSON drops. Their presence is not load-bearing; lifecycle enums, numeric counters, required query identity, and state-object checks continue to reject malformed input. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Dependency range | resolved now | D1 supports the whole declared range. |
| Public contract | resolved now | D2 leaves it unchanged. |
| Generated-project check | safe to defer | Attempt only if a static, no-lease scaffold path is already available; runtime restoration is CI-owned. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Runtime guard omits a required TanStack field | Mirror exported 5.102.8 `MutationState`/`QueryState` declarations and add valid/invalid focused tests. |
| JSON error records no longer satisfy upstream `Error \| null` fields | Revive plain serialized records into `Error` instances and pin both the default `{}` wire case and retained message/name/stack fields. |
| Regression silently uses the root lock | Give the fixture its own config with exact 5.102.8 imports and `--no-lock`. |
| Unrelated package-wide quality residue obscures the slice | Record baseline counts and require no increase; use focused wrappers over changed source/test files. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 | risk | Keep validation local to the one boundary; no reusable abstraction or new public type. |
| AP-14 | risk | Do not re-export TanStack types. |
| AP-25 | risk | No module-load behavior; validation runs only on hydrate calls. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5/F-15 | yes | Public query surface unchanged; no upstream re-export. |
| F-6/F-7 | baseline comparison | JSR audit/doc-lint do not worsen inherited findings. |
| F-10 | yes | Focused regression is discovered and passes. |
| F-19 | yes | Structured focused and root wrappers. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing Fresh doc/cardinality residue | none | Inherited and outside #1734. |
| New debt | none | The correction adds no waiver or deferred violation. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED | focused wrapper/check against exact 5.102.8 fixture | FAIL at base with TS2345; record before correction |
| 2 | Focused test/check | structured test/check wrappers over changed files | PASS |
| 3 | Dual-version consumer | no-lock checks against exact 5.101.x and 5.102.8 configs | PASS / PASS |
| 4 | Required static suite | root `check`, `test`, `lint`, `fmt:check`, `quality:scan`, `arch:check` | PASS; quality allowCount remains 7 |
| 5 | JSR surface | Fresh doc-lint/audit comparison | no new findings versus recorded baseline |

## FAIL_FIX Amendment — serialized hydration repair

The repair validates the shape that actually crosses `QueryHydrationScript`'s JSON transport. A new
round-trip suite renders that component, extracts/parses its JSON payload, and covers a success
query plus default-dehydrated paused mutations with variables, without variables, and after one
failed attempt. The prior-failure case must reproduce `failureReason: {}` before implementation.

R2 is resolved by private error revival (D5), not by widening `DehydratedState`, exporting a wire
type, or casting a serialized record to `Error`. The deliberate behavior change is that error-shaped
wire records arrive at TanStack as real `Error` instances; an empty record receives a neutral
fallback message, while string `message`, `name`, and `stack` fields are retained. Query `data` is
treated consistently with the three mutation fields (D6) because it also admits `undefined` and is
dropped from pending-query JSON. No public type, export, or dependency-range decision is reopened.

## Risks

- Guard code can become noisy; keep it in `hydration.ts` beside the sole boundary and avoid a new
  module unless the file-size gate requires one.

## Dependencies

- `@tanstack/query-core` exact 5.101.x and 5.102.8 declarations.

## Drift Watch

- Any need to edit `query-types.ts`, `query/mod.ts`, or the declared query-core range is significant
  drift and stops implementation for owner review.
