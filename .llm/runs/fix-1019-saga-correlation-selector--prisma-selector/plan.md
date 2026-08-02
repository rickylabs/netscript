# Plan: align Prisma saga correlation selector with shipped schema

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1019-saga-correlation-selector--prisma-selector` |
| Branch | `fix/1019-saga-correlation-selector` |
| Phase | `plan` |
| Target | `packages/plugin-sagas-core`, `plugins/sagas` |
| Archetype | `5 — Plugin Package` (folding the sibling Archetype 3 runtime concern) |
| Scope overlays | none |

## Archetype

Archetype 5 governs the shipped first-party plugin/schema integration and folds the sibling runtime-store concern. The schema convention stays in the thin plugin fragment while the core package consumes the generated-client contract.

## Current Doctrine Verdict

`@netscript/sagas` / plugin-sagas-core: Archetype 3, **Refactor** (existing unrelated transport headline). `plugins/sagas`: Archetype 5, **Keep**. This fix does not deepen the recorded debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The generated Prisma input is the external contract, not the handwritten fake. |
| A12 | Correlation and durable state persistence are explicit saga invariants. |
| A14 | A real generated client and database round-trip must protect the contract. |

## Goal

Make the shipped schema generate the selector already used by `PrismaSagaStore`, and add a gated real-Prisma/Postgres round-trip built from the shipped fragment.

## Scope

- Change the correlation `@@unique` from `name:` to `map:`.
- Keep store/delegate/fake on `sagaId_correlationKey`, then add schema-derived evidence so the fake cannot be the sole contract.
- Add a gated integration test covering save/load/correlation/transitions/delete with Prisma 7.8 and live Postgres.

## Non-Scope

- Do not change the sibling transition compound ID: it has no selector consumer and is latent, not this defect.
- Do not add migrations or change scaffold/CLI behavior.
- Do not run CLI E2E.

## Hidden Scope

- Prisma 7 requires a generator/datasource wrapper and driver adapter for the live client.
- The test must copy/include the shipped fragment verbatim and must skip without its database URL.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Replace correlation `name:` with `map:`. | Prisma 7.8 generation proves this restores idiomatic `sagaId_correlationKey`; store types/call sites/fake remain aligned, and no migration tree creates a repository migration hazard. |
| D2 | Leave the transition `name:` unchanged. | It is not selected anywhere; changing it would be unrelated blast radius rather than the same active defect. |
| D3 | Gate the integration test on `SAGA_PRISMA_TEST_DATABASE_URL`. | Default offline tests/CI remain green while the requested live test can be explicitly exercised. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact temporary Prisma wrapper/client layout | safe to defer | Implementation detail, provided it includes the shipped fragment verbatim and leaves no generated files published. |
| Container port/name | safe to defer | Ephemeral, test evidence only. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A handwritten wrapper drifts from the shipped schema | Programmatically copy the shipped fragment verbatim and prepend only generator/datasource blocks. |
| Prisma CLI mutates `deno.lock` | Run no-lock where supported and inspect/revert only tool-induced lock churn. |
| Integration test passes without exercising real DB | Require the live run output to show db push, generation, and all store methods; record URL-gated skip separately. |
| Real Prisma client is structurally wider than the store port | Use a narrow typed adapter/cast only if required and reject `as unknown as` quality bypasses. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-14 | risk | Treat generated Prisma types as the contract, not a redefined fake. |
| AP-19 | risk | Keep network/env/write permissions test-only and explicit. |
| AP-25 | risk | Keep subprocess/database side effects at the test edge. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3/F-5/F-10/F-13/F-19 | yes | doctrine checks, scoped wrappers, unit + live integration test |
| F-6/F-7 | yes | JSR audit/doc-publish surface review; no public/export changes |
| code quality | yes | `deno task quality:gate` |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none | Existing sagas debt is unrelated; no new/deepened violation planned. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | generated contract | Prisma 7.8 generate from shipped fragment | `sagaId_correlationKey` after `map:` |
| 2 | live runtime | gated saga Prisma round-trip against Postgres 18.3 | pass all required operations |
| 3 | scoped static | requested check/lint/fmt commands | exit 0 |
| 4 | scoped tests | `deno test --allow-all packages/plugin-sagas-core/ plugins/sagas/` | exit 0; offline integration gate skipped |
| 5 | doctrine | requested per-root checks + `deno task quality:gate` | exit 0 |
| 6 | JSR surface | focused doc/publish audit appropriate to unchanged exports | no new finding |

## Dependencies

- Installed/resolved Prisma CLI and client 7.8.0, `@prisma/adapter-pg` 7.8.0, Postgres 18.3.

## Drift Watch

- Any generated selector differing from `sagaId_correlationKey`, need to alter store call sites, or inability to execute live Postgres requires a plan update.
