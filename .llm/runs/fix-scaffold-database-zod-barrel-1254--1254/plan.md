# Plan: make `@database/zod` multi-model (#1254)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-database-zod-barrel-1254--1254` |
| Branch | `fix/scaffold-database-zod-barrel-1254` |
| Target | CLI scaffold + database generated-schema compatibility |
| Archetype | `6 — CLI / Tooling` (larger owning package shape) |
| Overlays | none |

## Doctrine

`@netscript/cli` is Archetype 6 / **Restructure** in the census. This slice changes existing
template/application seams without adding folders, commands, side effects, or public APIs.

## Goal

Make every scaffolded `@database/zod` alias resolve to the complete models barrel, while ensuring
that barrel exports the `Schema`, `CreateInput`, and `UpdateInput` names the unchanged contract
template needs for every generated model.

## Scope

- Repoint root and contracts import-map generators to `schemas/models/index.ts`.
- Extend existing Zod post-processing to append deterministic, idempotent contract aliases for
  every model in the complete barrel.
- Add a real two-model import-map consumer test and scaffold/template assertions.

## Non-Scope

- Do not remove or repurpose `crud.ts`; it remains the explicit narrow primary-model surface.
- No Prisma/Zod dependency change, schema naming redesign, full CLI E2E, or unrelated CLI debt.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Update both root and contracts import maps. | Otherwise resolution differs by workspace boundary. |
| D2 | Add aliases to the complete generated models barrel during existing post-processing. | Keeps the contract template unmodified and supports every model. |
| D3 | Discover model names from generated `*.schema.ts` files and fail clearly if required input/update files are absent. | Avoids primary-model assumptions and silent incomplete barrels. |
| D4 | Make the alias block deterministic and idempotent. | Generation/fix tasks are routinely rerun. |
| D5 | Prove via a two-model real Deno import-map subprocess plus scaffold assertions. | Tests actual named imports, not a string-only snapshot. |
| D6 | Preserve inherited lock delta and skip full E2E per owner. | Explicit mechanics. |
| D7 | Use milestone composed evaluation, no local PLAN-EVAL. | Owner/orchestrator ruling D6. |

## Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Complete-barrel alias naming | resolved now | Existing contract-template names remain authority. |
| Narrow `crud.ts` future | safe to defer | Retained and documented in generated header. |

## Risks

| Risk | Mitigation |
| --- | --- |
| Second-model aliases reference missing generator output | Validate each path and throw with model/path. |
| Rerun duplicates aliases | Replace a marker-delimited generated block. |
| Root fixed but contracts package stale | Assert both generated deno.json paths. |
| String snapshot false green | Spawn Deno with real `@database/zod` map and import two models. |
| Generated assets stale | Run the repo asset freshness/generation task identified by focused tests. |

## AP / gates

- Avoid AP-18 with semantic JSON assertions and a real import consumer.
- Avoid AP-25: filesystem work stays in the existing database script edge.
- Required: focused RED/GREEN, CLI/database scoped check/lint/fmt, relevant package tests,
  `quality:gate`, per-root doctrine scans, doc lint, publish dry-runs, asset freshness, lock check.
- F-CLI rows remain `PENDING_SCRIPT` where no dedicated runner exists, with manual diff evidence.

## Commit slices

1. Bootstrap run and draft PR.
2. RED import-map/template assumptions; implement complete barrel aliases and path changes; GREEN.
3. Record gates and hand off to composed evaluation.

## Drift watch

- If actual generator naming differs from issue examples or alias generation requires generator
  replacement, stop/rescope instead of inventing a parallel schema surface.

