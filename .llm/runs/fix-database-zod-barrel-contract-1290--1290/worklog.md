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
| 2026-08-05 | 1 | RED | Rendered `cycles.contract.ts` failed `deno check` with TS2307 at the generated models-barrel alias. |
| 2026-08-05 | 2 | GREEN | Same generated-contract compiler fixture passed after aliasing the complete `crud.ts` aggregate. |
| 2026-08-05 | 2 | multi-model proof | Database writer test found Product and Warehouse and emitted Schema/CreateInput/UpdateInput for both. |
| 2026-08-05 | 2 | review | NetScript now owns the aggregate; upstream models barrel remains generator-owned; generated contract stays on `@database/zod`. |
| 2026-08-05 | 2 | reconcile | Draft PR #1299 carries `Closes #1290`, milestone 0.0.5, p0 CLI/database labels, and `status:plan`. |
| 2026-08-05 | 3 | scaffold runtime | Canonical one-pass suite passed 71/71: Postgres lifecycle, generated compile, users health, OTEL, cleanup. |
| 2026-08-05 | 3 | artifact inspection | Root alias, generated aggregate, and rendered users contract agree symbol-for-symbol; hashes retained in evidence. |
| 2026-08-05 | 3 | acceptance dependency | Full app-inclusive check remains blocked only by separately owned #1287; box 1 is not claimed. |
| 2026-08-05 | 3 | Quickstart | Added the missing derivation explanation: stable alias, aggregate location, regeneration law, no deep imports. |

## Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Generated-contract RED | EXPECTED FAIL | TS2307 resolving baseline `schemas/models/index.ts` alias. |
| Generated-contract GREEN | PASS | Focused service scaffolder test; actual rendered contract compiled. |
| Multi-model aggregate | PASS | Product + Warehouse all export three contract symbols. |
| Focused tests | PASS | 30 passed, 0 failed across database barrel, workspace alias, and service scaffolder tests. |
| Scoped check | PASS | 60 files selected; zero diagnostics. |
| Scoped lint | PASS | 60 files selected; zero findings. |
| Scoped fmt | PASS | 60 files selected; zero findings. |
| Quality gate | PASS | code-quality scan clean; architecture gate exit 0 with baseline warnings only. |
| Lock hygiene | PASS | Foreign `deno.lock` remains modified but unstaged. |
| Canonical `scaffold.runtime` | PASS | 71 passed, 0 failed, 0 skipped; `evidence/scaffold-runtime.md`. |
| Postgres lifecycle | PASS | Real migration applied, client/Zod generated, seed completed. |
| Generated contract artifacts | PASS | Alias → aggregate → rendered import inspected and hashed. |
| Example service boot | PASS | Live Aspire-resolved users `/health` probe returned healthy with database check. |
| Owned cleanup | PASS | Exact AppHost stopped; suite-created containers pruned. |
| Database package tests | PASS | 7 tests / 9 steps, 0 failed. |
| Database doc lint | PASS | Full export map; scripts entrypoint has zero diagnostics. |
| Database publish dry-run | PASS | No slow-type or file-list failure; publish simulation complete. |
| Docs accuracy | PASS | Repository accuracy/discoverability gate. |
| Docs verify | PASS | Site built (617 files), 32,770 internal links resolve, 18 caveat references resolve. |
