# Worklog — database Zod barrel contract (#1290)

## Design

### Public surface

- Existing `runWriteCrudZodBarrel(zodOutputDir, modelName)` compatibility entry remains callable.
- Generated `@database/zod` resolves to the NetScript-owned aggregate `crud.ts`.
- Generated contracts keep importing only from `@database/zod`.

### Domain vocabulary

- Generated model set, model schema, create-input schema, update-input schema, aggregate barrel,
  generated contract consumer.

### Ports

- Deno filesystem APIs remain at the existing database script edge.
- `Deno.Command` in the regression test is the consumer compiler oracle.

### Constants

- Model file suffix `.schema.ts`; generated aggregate filename `crud.ts`; symbol suffixes
  `Schema`, `CreateInput`, and `UpdateInput`.

### Commit slices

| # | Slice | Proof | Files |
| --- | --- | --- | --- |
| 0 | Locked harness plan and draft PR | composed Plan-Gate rows | run artifacts |
| 1 | RED generated-contract fixture | baseline compile fails on incomplete aggregate | CLI/database tests + run artifacts |
| 2 | Multi-model aggregate and alias repair | same fixture GREEN; focused tests | database script, CLI aliases/tests/assets, run artifacts |
| 3 | Clean-scaffold runtime proof | init/db init/db generate/check/boot artifacts | evidence + run artifacts |
| 4 | Merge readiness | scoped/quality/publish/runtime/cloud gates | run artifacts + PR metadata |

### Deferred scope

#1287, #1274, generator-version changes, and deep-path contract imports.

### Contributor path

Add or change generated schema aliases in `packages/database/scripts/fix-zod-imports.ts`; prove the
consumer through the scaffold compile test rather than editing template imports.

## Plan-Gate

| Row | Result | Evidence |
| --- | --- | --- |
| Research current | PASS | `research.md`; fresh baseline scaffold reproduction |
| Decisions locked | PASS | `plan.md` D1–D6 |
| Open sweep | PASS | one test-location implementation detail; no architecture decision open |
| Slices | PASS | four ordered slices, each with proof and files |
| Risks | PASS | six risks with mitigations |
| Gate set | PASS | Archetype 6 consumer/runtime/release gates selected |
| Deferred scope | PASS | #1287, #1274, dependency versions, deep imports |
| JSR surface scan | PASS | existing published database scripts surface preserved; doc/publish gates selected |
| Evaluator protocol | COMPOSED | milestone-run.md + owner D6 ruling; no duplicate local formal evaluator |

## Progress

| Date | Slice | Event | Evidence |
| --- | --- | --- | --- |
| 2026-08-05 | research | Read live #1290 before branching; fetched main and created exact branch | baseline `6c3b534fc` |
| 2026-08-05 | research | Fresh scaffold + db generate | upstream models barrel augmented; Zod errors absent; only #1287 remains |

## Gates

Pending implementation.

