# Plan: bind generated route references at runtime

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-1576-form-c-route-path-binding--1576-1568` |
| Branch         | `fix/1576-form-c-route-path-binding`            |
| Phase          | `plan`                                          |
| Target         | `packages/fresh`                                |
| Archetype      | `4 — Public DSL / Builder`                      |
| Scope overlays | `frontend`                                      |

## Archetype and Doctrine Verdict

`@netscript/fresh` is a published fluent builder/route DSL, so Archetype 4 is the smallest fit. The
current doctrine verdict is **Keep — preserve per-concern builders and route contracts**.

## Goal

Make generated route type inference and request-time path/search state share the same reference
parser, then expose that same binding natively through `definePartial()`.

## Scope

- Repair page path resolution from generated references without sidecars.
- Add route-bound partial loaders and method handlers with inferred `path`, `search`, and `route`.
- Strengthen the `withRoute()` type boundary so inferred route state requires runtime parsers.
- Add runtime and mutation/type fixtures covering the requested matrices.
- Document the additive partial route option and deterministic failures.

## Non-Scope

- `application/form/**`, `runtime/ai/**`, `internal/**`, and `application/defer/**`.
- Cache/seed suppression for partial requests.
- CLI E2E, evaluator launch, ready/merge/canary actions.

## Locked Decisions

| ID | Decision                                                                                                 | Rationale                                                                                                                                                                                                                          |
| -- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Parser precedence is **latest explicit builder schema, then bound reference parser, then empty object**. | `withPathParams`/`withSearchParams` after `withRoute` is an intentional last-writer override; otherwise the route reference owns the inferred contract. Schema parsing retains existing default/failure behavior.                  |
| D2 | Add a `route` option to `definePartial`, not a fluent builder.                                           | `definePartial` already materializes in one call; an option is additive, coherent, and keeps the 80-percent path in one call.                                                                                                      |
| D3 | One shared resolver accepts an optional reference parser.                                                | Page and partial cannot drift into parallel conventions; path remains 404 and non-defaultable search remains 400.                                                                                                                  |
| D4 | Constrain `withRoute` to a complete `RouteReference` and test inferred/resolved key equality.            | This would have rejected a `$types`-only target at compile time and the runtime test catches the exact #1576 empty-object defect. It cannot prove arbitrary third-party parser implementations return semantically correct values. |

## Open-Decision Sweep

| Decision                  | Status        | Notes                                                                                  |
| ------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| Page/reference precedence | resolved now  | D1                                                                                     |
| Partial API shape         | resolved now  | D2                                                                                     |
| Search failure convention | resolved now  | Reuse existing page resolver/400 behavior.                                             |
| Browser/scaffold E2E      | safe to defer | Explicitly prohibited `e2e:cli`; package runtime fixtures cover the binding mechanism. |

## Risk Register

| Risk                                             | Mitigation                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Existing unconstrained partial users break       | Preserve the original overload and passthrough behavior when `route` is absent.                         |
| Handler wrapping changes return identity         | Wrap only route-bound handler functions; preserve keys and return values.                               |
| Schema/reference disagreement                    | D1 is encoded in one resolver and covered by precedence tests.                                          |
| Type inference appears green but runtime differs | Compile-time key-equality fixture plus runtime key/value assertions from the same generated references. |
| Lock churn                                       | Compare `deno.lock` before every commit; stop if it moves.                                              |

## Anti-Patterns and Gates

- Avoid AP-1/AP-9/AP-22/AP-25: focused files, one shared resolver, no new barrel or side effect.
- Required evidence: scoped F-19 check/lint/fmt, package tests, `quality:gate`, and explicit
  `quality:scan --root packages/fresh/src` if supported by the scanner CLI.
- JSR surface risk: additive types/overloads need explicit annotations and docs; no dependency or
  export-map change.

## Commit Slices

1. **#1576:** complete-reference constraint, shared reference-aware path resolver, page matrix and
   cross-pipeline tests; gate with focused package tests and scoped check; commit first.
2. **#1568:** route option, inferred partial context, shared path/search resolution, handler
   wrapping, mutation fixture/docs; gate with package tests and all required final gates; commit
   second.

## PLAN-EVAL

Not launched. The owner explicitly prohibited all local evaluators for this lane and directed that
evaluation reach the draft PR only through the automatic label-driven lifecycle.
