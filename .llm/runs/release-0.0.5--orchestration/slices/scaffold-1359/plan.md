# Plan: #1359 restore the scaffold CRUD route

## PLAN-EVAL

`PLAN-EVAL: N/A` — bounded mechanical correction. The live issue fixes the intended target,
the two consumers, the duplicate-target invariant, the required negative controls, and the scope.
No public API, architecture, dependency, or product-content decision remains open. Opposite-family
IMPL-EVAL remains owner-controlled.

## Doctrine

Archetype 6 applies because this is an `@netscript/cli` scaffold asset. The change stays in the
existing asset/test seam, introduces no abstraction or export, and follows A14 by testing the
semantic route target plus a falsifiable duplicate-target invariant.

## Scope and locked decisions

- Map `appRoutes.crudExample` to `routes.examples.crud.$route`.
- Keep both link sites on `appRoutes.crudExample.href()`; prove the alias resolves through the
  generated manifest seed to `/examples/crud`.
- Parse the rendered top-level `appRoutes` entries and reject duplicate normalized target
  expressions, naming both keys and the target.
- Regenerate the checked-in CLI embedded asset with the canonical generator; never hand-edit it.
- Do not change CRUD page content, route registration behavior, unrelated scaffold surfaces, or
  invoke AppHost/container/E2E gates.

## Commit slices

| Slice | Change | Proving gate |
| --- | --- | --- |
| S0 | Harness research, PLAN-EVAL N/A, draft PR | clean baseline and artifact review |
| S1 | Correct route alias, semantic link proof, duplicate-target detector, generated asset | pre-fix RED; mutation RED; focused tests; scoped check/lint/fmt; quality and architecture gates |

## Failure matrix

| Acceptance | Pre-fix failure | Kind |
| --- | --- | --- |
| CRUD target | corrected assertion sees `routes.examples.serviceExample` | behavioral |
| two link sites | resolution proof yields `/examples/team-members`, not `/examples/crud` | behavioral |
| stale alias assertion | old test explicitly requires the wrong target | compile-time/test-contract |
| collision detector | rendered `serviceExample` and `crudExample` share one target | behavioral |

## Gates

1. Run the new focused tests before the source correction; require exit 1 naming the wrong mapping
   and collision.
2. Correct the source and run focused tests green.
3. In a detached scratch copy, deliberately duplicate a target; require the collision test exit 1,
   then rerun the clean branch exit 0.
4. Regenerate assets and run scoped CLI check/lint/fmt, `quality:scan`, and `arch:check`.

