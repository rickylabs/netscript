# Drift — scaffold-generated-output-correctness

Append only; stop before crossing the milestone leaf contract or splitting the grouped verdict.

## 2026-08-13T20:38:25Z — required generator sources absent from frozen boundary

**Status: unresolved; implementation hard stop.**

Research found two acceptance-preserving changes that cannot be expressed through the declared
assets alone:

1. `generate-prisma-config-1.ts.template` has no conditional syntax. Omitting irrelevant helpers per
   provider requires its renderer,
   `packages/cli/src/kernel/templates/database/generate-prisma-config.ts`, to select and pass a
   provider-specific fragment. That source is not in `leaf-contracts.json`.
2. `database/seed.ts.template` can interpolate a model name, but it cannot select between a typed
   model seed and a truthful empty-schema path. The narrow design requires
   `packages/cli/src/kernel/adapters/database/scaffolder.ts` and a new
   `packages/cli/src/kernel/templates/database/generate-database-seed.ts` plus its focused test.
   Those surfaces are not declared.

Requested disposition: the coordinator replaces/amends this leaf contract with those exact surfaces,
or supplies another acceptance-preserving design inside the current boundary. No source file outside
the contract has been edited.

## 2026-08-13T20:38:25Z — #1263 OpenAPI sub-symptom stale on frozen main

**Status: approved reproduction fallback recorded.**

The live contract already projects 404 for GET/PATCH/DELETE via `baseContract`; the focused probe is
green. The plan preserves this acceptance with a scaffold-level regression assertion and does not
touch undeclared contract-package code. Runtime missing-row behavior remains independently red and
in scope.

## 2026-08-13T20:46:05Z — coordinator authorized the narrow generator amendment

**Status: resolved by coordinator comment `5286194892`; no product edit started.**

The coordinator authorized these exact additional CLI seams:

- `packages/cli/src/kernel/templates/database/generate-prisma-config.ts`;
- `packages/cli/src/kernel/templates/database/database-generators.ts`;
- new `packages/cli/src/kernel/templates/database/generate-database-seed.ts` and its focused
  `generate-database-seed_test.ts`;
- `packages/cli/src/kernel/templates/database/generators_test.ts`;
- `packages/cli/src/kernel/adapters/database/scaffolder.ts`;
- `packages/cli/src/kernel/adapters/database/scaffolder_test.ts`.

This amendment resolves the boundary gap recorded above; it does not authorize any contract-package
change. The already-green #1263 OpenAPI 404 projection remains a regression-coverage obligation
only.

## 2026-08-13T20:50:16Z — PLAN-EVAL paused for Claude allowance reset

**Status: active process blocker.**

The amended design still requires a fresh native opposite-family PLAN-EVAL. The coordinator directed
the leaf to wait for the Claude allowance reset. This housekeeping turn does not launch an
evaluator, implement product code, run gates, request an expensive-gate lease, or alter PR
readiness.
