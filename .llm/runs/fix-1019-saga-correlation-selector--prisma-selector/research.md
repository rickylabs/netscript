# Research — fix-1019-saga-correlation-selector--prisma-selector

## Re-baseline

- Carried-in source: issue #1019 and the user's cause/fix direction.
- Re-derived against `main` at `3ab64720f` on 2026-08-01.
- The stated cause holds exactly; no implementation change existed at bootstrap.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The shipped fragment declares `@@unique([sagaId, correlationKey], name: "saga_runtime_correlation_saga_key")`. | `plugins/sagas/database/sagas.prisma:72` |
| 2 | The delegate, both store operations, and the in-memory fake instead hardcode `sagaId_correlationKey`. | `rg -n 'sagaId_correlationKey' packages/plugin-sagas-core` |
| 3 | Prisma 7.8.0 generated `SagaRuntimeCorrelationWhereUniqueInput` with `saga_runtime_correlation_saga_key`, proving `name:` controls the client selector. | Temporary verbatim-fragment wrapper; generated `models/SagaRuntimeCorrelation.ts:204-215` |
| 4 | The same generation emitted `saga_runtime_transition_instance_version` for the sibling compound ID. No production or test code selects transitions by compound ID. | Generated `models/SagaRuntimeTransition.ts:216-225`; repository `rg` |
| 5 | No `migrations` directory exists. The plugin manifest ships the fragment through `.withDbSchemas([{ path: './database/sagas.prisma', engine: 'postgres' }])`. | `find . -name migrations -type d`; `plugins/sagas/src/public/mod.ts` |
| 6 | A real Postgres 18.3 endpoint is available locally and the image is present. | `docker ps --format ...` |

## jsr-audit surface scan (package/plugin waves)

- Surfaces scanned: `packages/plugin-sagas-core/deno.json`, root/store export paths, `plugins/sagas/deno.json`, and the published `database/**/*.prisma` include.
- The planned fix changes no exported TypeScript symbol or entrypoint. The integration test is excluded by existing `**/*_test.ts` publish rules. The schema fragment remains published.
- Slow-type/public-surface risk: none introduced; scoped doc/publish checks remain review gates because both packages are published.

## Open questions

- None that force rework. The generated-client evidence selects `name:` → `map:` for correlation only.
