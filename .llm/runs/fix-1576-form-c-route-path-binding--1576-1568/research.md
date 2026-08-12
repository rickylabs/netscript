# Research: generated route runtime binding (#1576 + #1568)

## Baseline

- Branch and baseline match the brief: `fix/1576-form-c-route-path-binding` at `e85d8d28c`.
- Worktree was clean at activation; `deno.lock` is unchanged.
- The carried-in mechanism was re-checked against the tree: page runtime calls
  `resolvePathParams(config.pathSchema, ctx.params)`, while generated references already expose
  `safeParsePath` and `safeParseSearch`.

## Findings

1. `promoteRouteConfig()` validates a route reference at runtime but the public `withRoute()`
   constraint is only `TypedRouteTarget`; a compile-time-only `$types` carrier can therefore be
   accepted without parsers and fail only when executed.
2. Page route references already carry the complete parser contract. No new route parsing
   abstraction or dependency is needed.
3. The existing deterministic failures are 404 for invalid path state and 400 for search state that
   cannot parse even from the empty/default input.
4. `definePartial()` is a single-call published builder with a `route`-shaped return. A `route`
   option preserves its 80-percent path; a fluent sub-builder would add a second API style only for
   route binding.
5. `definePartial()` currently passes an unconstrained context to the loader and passes `handler`
   through unchanged. Route-bound handlers must be wrapped as well as loaders so both receive the
   same parsed context.
6. `@netscript/fresh` is Doctrine Archetype 4 with current verdict **Keep**. Open Fresh debt is the
   legacy PageBuilder compatibility decision and is not deepened by this slice.

## JSR Surface Scan

- Planned public changes are additive types plus an overload/option on the existing builders
  subpath; no export-map or dependency change is planned.
- Explicit return types and JSDoc are required on new exports to avoid slow types/doc-score
  regression.
- Package metadata, ESM shape, publish include/exclude rules, and permissions are unchanged.
- Full `doc-lint`/publish dry-run are not requested gates; the scoped check plus package tests and
  quality scan will catch the owned type surface. Any unverified publishability is reported.

## Open Questions

- None that require implementation rework. The precedence and partial API shape are locked in
  `plan.md`.

## Correction Cycle 2 — evaluated head `f9e924d0b`

The owner-provided fallback IMPL-EVAL returned `FAIL_FIX` with one blocking counterexample and one
advisory to repair alongside it:

1. `promoteRouteContractConfig()` discarded prior path/search schemas when an inline contract
   omitted them, while its type transition continued to expose the prior state. The stored bound
   contract therefore parsed the request successfully as `{}`.
2. Route-bound partials trusted their statically typed reference and reached `safeParsePath`
   directly, so a JavaScript/cast consumer could receive an incidental missing-method `TypeError`
   rather than the page builder's deterministic validation error.

The accepted `withRoute()` mechanism, precedence chain, 404/400 policy, pipeline matrix, and parser
constraint are unchanged. The correction is mechanical and has no unresolved design question, so
cycle-2 PLAN-EVAL is N/A. Per the owner override, re-evaluation remains automatic lifecycle work.
