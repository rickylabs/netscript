# Plan: restore Zod-4 OpenAPI query coercion (#1250)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-onboarding-quickwin-1250--1250` |
| Branch | `fix/onboarding-quickwin-1250` |
| Phase | `plan` |
| Target | `packages/service` OpenAPI handler |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `service` |

## Archetype

The doctrine census classifies `@netscript/service` as Archetype 4. This fix changes a primitive
materialized by the service builder and does not redesign lifecycle, state, or the public builder.

## Current Doctrine Verdict

`@netscript/service`: **Refactor** — clarify `presets/` and vendored Scalar asset roles. Those
existing debt entries are unaffected by this narrow adapter correction.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | A declared numeric HTTP input must work without hidden schema-version mismatch. |
| A7 | Use the upstream oRPC Zod-4 adapter rather than local coercion. |
| A14 | The test must prove observable request behavior, not plugin construction. |

## Goal

Make the Scalar/docs-shaped `GET /issues/board?cycleId=1` request reach a Zod-4 handler with
`cycleId` coerced to the number `1`, and fail regression tests if coercion becomes inert again.

## Scope

- Select the Zod-4 smart coercion plugin subpath in `handlers.ts`.
- Add an HTTP-boundary regression test in `packages/service/tests/handlers_test.ts`.
- Record package, doctrine, and targeted validation evidence.

## Non-Scope

- No contract schema changes, Scalar client patch, public export change, dependency bump, or full
  CLI E2E run.
- No MCP execution tool is invented; #1204's tools describe rather than call service operations.
- No unrelated `packages/service` doctrine debt remediation.

## Hidden Scope

- The Zod-4 export is named `experimental_ZodSmartCoercionPlugin`; the import must alias it to keep
  the implementation readable without exposing a new NetScript API.
- A test that merely inspects the plugin array is insufficient because the reported failure is a
  silently installed no-op.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Alias the upstream Zod-4 plugin export to `ZodSmartCoercionPlugin`. | Correct adapter with a minimal implementation delta. |
| D2 | Exercise `createOpenAPIHandler.handle()` using a real `Request` with `cycleId=1`. | Proves the transport string becomes a Zod number and catches inert plugins. |
| D3 | Assert status, match, and returned numeric value. | Prevents false green from a non-matched route or an error envelope. |
| D4 | Keep all public exports and contracts unchanged. | The defect is adapter selection, not API design. |
| D5 | Preserve inherited `deno.lock` modification and exclude it from commits. | Owner lock-hygiene rule. |
| D6 | Do not launch a local PLAN-EVAL; use milestone composed evaluation. | Explicit owner/orchestrator ruling. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| OpenAPI query coercion mechanism | resolved now | Upstream Zod-4 plugin, per issue diagnosis. |
| MCP request execution | safe to defer | The current introspection contract has no execution operation; no new tool is authorized. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Test passes without route match | Assert `matched === true`, HTTP 200, and decoded body. |
| Handler observes a string but output hides it | Handler returns `typeof` and value; assert number and `1`. |
| Import name mismatch | Confirmed through `deno doc` and upstream declaration export list. |
| Package publication regression | Run scoped check/lint/fmt, doc-lint, package test, and publish dry-run. |
| Lock churn enters PR | Stage explicit paths and compare `deno.lock` against baseline. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-14 | risk | Do not re-export the upstream plugin; keep it internal. |
| AP-15 | risk | Keep caller vocabulary and public surface unchanged. |
| AP-25 | risk | Add no load-time or filesystem side effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1–F-19 applicable Archetype-4 set | yes | `quality:gate`, scoped wrappers, manual diff review |
| F-5/F-7 | yes | unchanged exports plus `doc:lint` |
| F-6 | yes | package `publish:dry-run` |
| F-10 | yes | regression test fails for inert plugin and passes for Zod-4 plugin |
| Runtime/consumer | yes | real OpenAPI handler request plus package test task |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/service — doctrine verdict Refactor` | none | Existing folder-role debt is not deepened. |
| `packages/service — assets/scalar.min.js` | none | No asset change. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | red proof | Run new handler test before import fix | Fails with HTTP 400/string validation error. |
| 2 | regression | `deno test --allow-all packages/service/tests/handlers_test.ts` | Pass. |
| 3 | scoped type | `.llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx` | Pass with `--unstable-kv` inherited by wrapper. |
| 4 | scoped lint/fmt | repo scoped wrappers for `packages/service` | Pass. |
| 5 | package | `deno task --cwd packages/service test` | Pass. |
| 6 | doctrine | `deno task quality:gate` | Pass. |
| 7 | JSR | `deno task doc:lint --root packages/service --pretty`; package publish dry-run | Pass. |

## Dependencies

- Existing `@orpc/zod` 1.14.6 import-map entry; no version change.

## Drift Watch

- A deeper coercion defect, a need to patch Scalar, or lockfile delta would exceed the planned fix.

