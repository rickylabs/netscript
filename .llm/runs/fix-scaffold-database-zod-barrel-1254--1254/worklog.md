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

## Gate results

| Family | Result | Evidence |
| --- | --- | --- |
| RED/GREEN | NOT_RUN | pending implementation |
| Static | NOT_RUN | scoped wrappers pending |
| Package | NOT_RUN | focused/related tasks pending |
| Fitness | NOT_RUN | quality/doctrine pending |
| JSR | NOT_RUN | doc lint/publish dry-run pending |
| Consumer | NOT_RUN | real two-model alias import pending |

## Drift

- Authorized milestone-composed evaluation and inherited lock delta are in `drift.md`.
- Hidden scope: path-only brief would break template imports; accepted because the live issue
  explicitly requires the unmodified second-model template to work.

