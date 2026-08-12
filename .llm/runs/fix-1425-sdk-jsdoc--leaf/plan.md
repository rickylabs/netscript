# Plan: #1425 SDK JSDoc API-client path

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1425-sdk-jsdoc--leaf` |
| Branch | `fix/1425-sdk-jsdoc-api-clients` |
| Phase | `plan` |
| Target | `packages/sdk` published JSDoc |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `docs` |

## Archetype

Archetype 4 is the doctrine classification already assigned to `@netscript/sdk`. This slice does not
alter that shape; it repairs an example on the public JSR documentation surface.

## Current Doctrine Verdict

`Keep` — high cohesion already; minor naming review.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 | The published example must point to the one shipped data-layer convention. |
| A3 | The example must retain the documented 80% call shape. |
| A14 | Doc-lint and package fitness gates preserve the public surface. |

## Goal

Replace every stale `api-clients` reference in `packages/sdk/**` JSDoc with the shipped per-service
module path while preserving the documented `queryOptions({ input })` call shape.

## Scope

- Change the one stale import inside the `createServiceQueryUtils` JSDoc example.
- Record the initial and final census.
- Run every gate named in the implementation brief.

## Non-Scope

- Runtime or type changes in `packages/**`.
- Any `docs/site/**` edit or re-sweep.
- Work owned by #1374 or #1377.
- Merge, ready-for-review transition, or evaluator sign-off.

## Hidden Scope

- The full `packages/sdk/**` census and full-export-map doc-lint are required even though one file changes.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Import `ordersClient` from `@app/lib/orders.ts`. | The shipped app alias resolves to `apps/<app>/lib/<service>.ts` and replaces the removed catch-all module. |
| D2 | Preserve `ordersQueryUtils.list.queryOptions({ input: ... })`. | The named consistency page explicitly distinguishes this helper's options-object call shape. |
| D3 | Touch only the JSDoc comment body in package source. | The issue forbids runtime behavior changes. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Further example modernization | safe to defer | Outside #1425; log only if discovered. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Import path is cosmetically updated but still contradicts the named reference page. | Preserve the page's `queryOptions({ input })` shape and run doc-lint. |
| Formatting rewrites more than the intended comment. | Use a focused patch, re-read the file, and inspect the diff. |
| Lockfile drift appears during validation. | Inspect `deno.lock` against the baseline and exclude unrelated drift. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-2 | risk | Keep the public example aligned with the single caller-facing path. |
| AP-15 | existing documentation defect | Remove the stale implementation-era module name. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-5 / F-7 | yes | full-export-map doc-lint and zero stale-name census |
| F-6 | yes | JSR audit applied; doc-lint publish bar |
| F-19 | yes | scoped check, lint, and format wrappers |
| Code quality / architecture | yes | `quality:gate` |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `.llm/harness/debt/arch-debt.md` | none | A stale example is fixed without creating or deepening architecture debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Doc-lint | `deno task doc:lint --root packages/sdk --pretty` | exit 0 |
| 2 | Type-check | scoped check wrapper | exit 0 |
| 3 | Lint | scoped lint wrapper | exit 0 |
| 4 | Format | scoped fmt wrapper | exit 0 |
| 5 | Code quality | `rtk proxy deno task quality:gate` | exit 0 |
| 6 | Census | `rtk grep -rn "api-clients" packages/sdk/` | zero matches / grep exit 1 |

## PLAN-EVAL

N/A — this is a fully specified, one-comment mechanical correction with live acceptance criteria,
a named consistency target, hard boundaries, and an explicit gate set.

## Drift Watch

- Any additional stale occurrence outside the owned JSDoc is recorded, not silently widened.
- Any executable-statement diff in `packages/**` stops the slice.
