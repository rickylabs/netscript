# Worklog — #1254 database Zod barrel

## Design

- Public command surface: unchanged.
- Generated output: root + contracts import maps resolve `@database/zod` to the complete models
  barrel; `crud.ts` remains primary-model-only.
- Existing ports/edges: scaffold template generators and database Zod post-processing.
- New constants: marker strings for the generated alias block only.
- Spine/layer-2/extension axes/composition: unchanged; no Archetype-6 structural delta.
- Contributor path: add a Prisma model, rerun database generation, import its schema/aliases from
  `@database/zod`; no import-map edit.

## Progress

| Date | Slice | State | Evidence |
| --- | --- | --- | --- |
| 2026-08-04 | 0 | bootstrap | Issue-first research, hidden template dependency, and plan recorded. |
| 2026-08-04 | 1 | implemented | Both generated import maps target the complete barrel; the database postprocessor writes deterministic aliases for every model. |
| 2026-08-04 | 2 | verified | Focused regressions, package tests, static gates, JSR gates, and real two-model consumption are green. |

## Gate results

| Family | Result | Evidence |
| --- | --- | --- |
| RED/GREEN | PASS | Before the fix, 3 focused failures proved both maps still selected `crud.ts` and `CycleCreateInput` was absent; after the fix, 29 tests pass. |
| Static | PASS | `deno check --unstable-kv`, lint, and TypeScript formatting wrappers: 689 files, 0 findings (CLI E2E excluded as an unrelated pre-existing formatting baseline). |
| Package | PASS | CLI: 591 tests / 484 steps; database: 7 tests / 9 steps; 0 failures. |
| Fitness | PASS_WITH_BASELINE | Root `quality:gate` exits 0; changed-surface quality scan has 0 findings. Direct CLI/database doctrine reports only pre-existing debt/heuristic findings, including the existing BDD-global false positive. |
| JSR | PASS | CLI and database doc lint: 0 combined diagnostics; both publish dry-runs succeed. |
| Consumer | PASS | A real two-model generated tree imports Issue and Cycle schema/create/update names through `@database/zod`; a second contract is scaffolded unchanged for Cycle. |

## Drift

- Authorized milestone-composed evaluation and inherited lock delta are in `drift.md`.
- Hidden scope: path-only brief would break template imports; accepted because the live issue
  explicitly requires the unmodified second-model template to work.
- The database postprocessor grew beyond the doctrine's existing 500-line warning; this is recorded
  as debt rather than mixed into the p1 correctness fix.
