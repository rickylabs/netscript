# Rubric — t1 storefront API (PROVISIONAL)

> **Status: provisional (OQ1).** This checklist is a starting point. It is
> scored by a judge in Slice 5 and does **not** gate Slice 1. Weights are
> indicative and sum to 1.0 within the rubric; the rubric axis itself is held
> out of the composite until Slice 5 (see `bench.config.ts`).

The rubric grades solution **quality** beyond the black-box pass/fail: idiomatic
framework use, contract hygiene, and error discipline. A solution can pass every
frozen probe and still score low on the rubric if it bypasses framework
primitives.

| Item                          | Weight | Passing bar                                                                 |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| `contract-first`              | 0.25   | API defined as an oRPC contract with zod schemas before implementation.     |
| `shared-error-map`            | 0.20   | Typed errors come from `baseContract` (`NOT_FOUND`, `VALIDATION_ERROR`, …). |
| `crud-primitive`              | 0.15   | Products use `createCrudContract()` rather than hand-rolled handlers.       |
| `kv-persistence`              | 0.15   | Persistence via `getKv()`; no external DB; survives restart.                |
| `service-preset`              | 0.10   | Service stood up with `defineService` / `createService`, not raw Hono.      |
| `referential-integrity`       | 0.10   | Order creation verifies the product exists via the store.                   |
| `minimal-surface`             | 0.05   | Only the specified endpoints; no leaked scaffolding or dead routes.         |

## Notes for the judge (Slice 5)

- Reward idiomatic use even when a probe is lenient (e.g. the suite accepts
  `400` or `422` for validation, but the rubric rewards the framework's own
  `validationFailed()` path).
- Penalize `Deno.openKv()` direct use, ad-hoc error JSON, and plain-Hono routing
  that sidesteps the contract layer.
