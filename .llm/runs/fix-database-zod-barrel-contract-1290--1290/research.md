# Research — database Zod barrel contract (#1290)

## Governing specification

The live #1290 body was read before branching. Its corrected acceptance has five boxes. The owned
repair is the alias/barrel contract and a compile-based regression; #1287 remains the explicitly
separate `QueryClientPort` check failure, and #1274 owns the Quickstart rewrite.

## Current-main findings

1. Root and contracts import maps target
   `.generated/zod/schemas/models/index.ts`.
2. The generated service contract imports `UserSchema`, `UserCreateInput`, and `UserUpdateInput`
   from `@database/zod`.
3. Upstream generation writes only model schemas to `schemas/models/index.ts`.
4. #1257 added post-processing that mutates that upstream barrel with input aliases, while the
   older NetScript-owned `crud.ts` writer still emits one model only.
5. Existing tests assert the alias string or import hand-written fixture symbols with `deno eval`;
   none render and compile the generated service contract.
6. A fresh local-source `--db postgres --service --yes` scaffold on baseline, followed by
   `db generate`, produced the augmented barrel and removed the Zod TS2305/runtime import error.
   `deno task check` then failed only on #1287 (`QueryClientPort` vs `QueryClient`).
7. The baseline therefore contains an attempted repair but not a durable generated-contract gate;
   the stable ownership boundary is a NetScript aggregate barrel rather than mutating an upstream
   generator barrel.

## Doctrine and profile

- Archetype 6 — CLI/tooling, because the change owns DB generation and scaffold output.
- Consumer compile and runtime gates are required.
- `@netscript/database` script exports are published; preserve explicit declarations, doc lint,
  and publish dry-run constraints.
- Relevant anti-patterns: AP-14 (do not vendor upstream), AP-18 (semantic tests, not snapshots),
  AP-22 (barrels require real aggregation logic), AP-25 (effects remain at script edge).

## Open questions resolved by plan

- Aggregate home: NetScript-owned `crud.ts`, not the upstream models barrel.
- Model discovery: generated model schema files are the source set; every discovered model must
  have create/update inputs or generation fails visibly.
- Acceptance dependency: do not alter #1287; record the full-workspace check as dependent until
  that issue lands, while proving the generated contract directly.

