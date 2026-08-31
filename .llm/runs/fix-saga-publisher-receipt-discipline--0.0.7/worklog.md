# Worklog: saga publisher receipt discipline (#1365)

## Current Checkpoint

- S1 artifacts and narrowing were accepted; primary accepted `PLAN-EVAL: N/A`.
- Branch is converged at `9f1f9fb87` with main `6bb27e46a` as its second parent.
- S2 implementation is authorized through the four locked RED/GREEN slices.
- Separate-session GLM 5.3 Flash · max IMPL-EVAL remains the post-implementation hard stop.
- Static-only authority remains in force; Gate 30 is lease-blocked.

## Design

### Public Surface

- Add `publishSagaOrThrow(publisher, message, options?)` to
  `@netscript/plugin-sagas-core/integration/publisher`.
- Return `Promise<SagaPublisherReceipt<TNextMessage['type']>>`; accepted results retain their exact
  message-type generic.
- Re-export the same value from `@netscript/plugin-sagas/runtime` beside `createSagaPublisher`.
- Keep `SagaPublisherPort.publish`/`publishMany` signatures unchanged.
- Update the port interface doc once: discriminate receipts, or use the throwing companion for one
  message; unused known-saga-publisher calls violate repository policy.
- Add no new port method, wrapper result, error type, dependency, CLI command, or scaffold surface.

### Domain Vocabulary

- `SagaPublisherResult` — existing accepted/rejected non-throwing boundary.
- `SagaPublisherReceipt` — accepted result returned by the companion.
- `SagaPublisherRejected` — rejected result carried as error context.
- `SagasError` — existing structured throw boundary; retryable/non-retryable factory selected from
  the rejected receipt.
- `publishSagaOrThrow` — package policy adapting expected rejection into an explicit exception.
- `discarded-saga-publisher-result` — repository quality finding for a standalone awaited known saga
  publisher call.
- “known saga publisher” — a receiver bound from `createSagaPublisher(...)` or explicitly bound to
  `SagaPublisherPort`; this avoids unrelated APIs whose method is also named `publish`.
- “source-derived canonical sample” — docs code extracted/compared against the already-shipped
  official worker template rather than maintained as an independent unsafe copy.

### Ports

- Consume `SagaPublisherPort`; do not change it structurally.
- The helper introduces no IO or lifecycle seam: it delegates to the supplied port and interprets
  the result.
- `SagaPublisherFetch`, environment readers, runtime/store/clock/transport ports, and worker ports
  are out of scope.

### Constants

- No product constant is added.
- Quality rule id: `discarded-saga-publisher-result` in the scanner's existing finite rule union.
- `SAGAS_API_DEFAULT_PORT = 8092` remains deprecated compatibility metadata; docs stop calling it a
  runtime fallback.
- `SAGAS_API_SERVICE_NAME = 'sagas-api'` and every endpoint-source key remain unchanged.

### Composition Axes

| Axis                      | Core owner                        | Thin consumer                       | Change                                    |
| ------------------------- | --------------------------------- | ----------------------------------- | ----------------------------------------- |
| Result policy             | core publisher integration        | plugin runtime export               | one core helper, one re-export            |
| HTTP transport            | existing plugin publisher adapter | jobs/app code                       | no change                                 |
| Receipt enforcement       | repo quality scanner              | source, docs, emitted template text | one saga-aware rule                       |
| Sample truth              | existing workers source template  | canonical durable-workflows docs    | read-only derivation test; no worker edit |
| Generated docs/API corpus | checked-in generators             | CLI/MCP embedded consumers          | attributed regeneration only              |

### Commit Slices

| Slice | Introduces                                                                   | Proves                                                                                          | Paths                       |
| ----- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| S2.1  | core helper, core export, plugin re-export, helper tests, port doc           | generic accepted return and structured rejection throw across both package entrypoints          | ceiling 1–5                 |
| S2.2  | saga-aware discarded-receipt scanner rule and fixtures                       | bare `publish`/`publishMany` fails in source/docs/template; consumed/unrelated calls stay green | ceiling 6–7                 |
| S2.3  | source-derived sync test/task plus four call corrections and reference truth | scaffold source remains safe/read-only; docs cannot drift or claim a fallback                   | ceiling 8–14                |
| S2.4  | attributed derivatives and static handoff                                    | all static/package/docs/corpus gates and lock/ceiling audit hold                                | ceiling 15–20 plus run docs |

### Deferred Scope

- Rich missing-endpoint diagnostic and Aspire detection detail: proposed follow-up in `drift.md`.
- SDK browser full-key normalization parity.
- Any publisher adapter behavior, endpoint resolution, literal port, CLI adapter, or E2E probe edit.
- Any workers source/test edit or separate workers guard test.
- Removal of the deprecated 8092 constant.
- Runtime consumer execution without a serialized lease.

### Contributor Path

Start at `packages/plugin-sagas-core/src/integration/publisher/mod.ts`. Use the non-throwing port
when rejection is normal and discriminate every result; use `publishSagaOrThrow` at exception
boundaries. Expose core policy from thin plugin entrypoints without reimplementing it. When adding
another saga publisher binding form, add a scanner fixture before adding documentation. Treat the
workers sample template as read-only source truth and update the canonical docs through the
derivation contract.

## Progress Log

| Time (UTC)       | Phase         | Step                  | Notes                                                                                                             |
| ---------------- | ------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 00:00 | S1            | activation            | Confirmed original branch/base/no-upstream, clean tree, and lock hash.                                            |
| 2026-08-31 00:08 | S1            | issue rebaseline      | Found #1740 already removed the fallback and fixed the scaffold sample.                                           |
| 2026-08-31 00:18 | S1            | baselines             | Measured original three-package and repo/docs/derivative static surfaces.                                         |
| 2026-08-31 00:27 | S1            | runtime correction    | Discarded unusable host attempt; locked serialized-lease rule.                                                    |
| 2026-08-31 00:34 | S1            | design                | Locked original helper, diagnostics, sample proof, docs, and derivative plan.                                     |
| 2026-08-31       | S1 correction | supervisor sync       | Reset exactly to converged `7c2a12fa1`; verified main parent/ancestor and six artifact-only files.                |
| 2026-08-31       | S1 correction | ceiling intersection  | Explicit 25-path diff found 6/25 main-touched paths, all task/generated derivatives.                              |
| 2026-08-31       | S1 correction | full rebaseline       | Reran every permitted package/static/docs gate at `8a925764`; classified prohibited write/runtime gates honestly. |
| 2026-08-31       | S1 correction | narrowing             | Reduced contract to helper/quality rail plus docs/source-sync; locked 20 paths and four slices.                   |
| 2026-08-31       | S1 correction | policy recommendation | Recommended `PLAN-EVAL: N/A`, pending primary decision; no S2 started.                                            |
| 2026-08-31       | S2 activation | primary ruling        | Primary accepted `PLAN-EVAL: N/A`; supervisor converged docs-only main at `9f1f9fb87`; S2 authorized.             |

## New-Base Gate Results

The authoritative gate/acceptance table is in `plan.md`. Compact evidence:

### Package and Public-Surface Gates

| Surface        | Check          | Whole test          | Lint/fmt     | Doc lint                      | JSR audit                                       | Publish dry-run                |
| -------------- | -------------- | ------------------- | ------------ | ----------------------------- | ----------------------------------------------- | ------------------------------ |
| core           | PASS 112 files | PASS 84/0/3 ignored | PASS 112/112 | FAIL baseline 9 private refs  | PASS, 2 warnings                                | PASS                           |
| sagas plugin   | PASS 87 files  | PASS 55/0/1 ignored | PASS 87/87   | FAIL baseline 27 private refs | FAIL baseline: `doctor` module tag + 2 warnings | PASS                           |
| workers plugin | PASS 102 files | PASS 52/0/0 ignored | PASS 102/102 | FAIL baseline 20 private refs | FAIL baseline: `doctor` module tag + 3 warnings | PASS; baseline continuity only |

Workers results were remeasured because the supervisor required every old baseline refreshed. They
do not authorize or justify a workers edit; no workers path is in the narrowed ceiling.

### Repository, Docs, and Derivatives

| Gate                        | Result         | New-base evidence                                                    |
| --------------------------- | -------------- | -------------------------------------------------------------------- |
| `quality:scan:repo`         | PASS           | 0 findings, 7 valid allowances                                       |
| discarded receipt           | PENDING_SCRIPT | 4 unsafe saga-publisher docs calls; safe sample has 0                |
| `arch:check:repo`           | PASS           | core 3W/2I; sagas 8W/2I; workers 9W/2I                               |
| host-port scan              | PASS           | 958 files; no pinned host ports                                      |
| docs snippets               | PASS           | 11 passed                                                            |
| sample sync                 | PENDING_SCRIPT | canonical unsafe/mismatched; source safe                             |
| docs links                  | PASS           | 103 docs; 0 broken links/anchors                                     |
| docs accuracy               | PASS           | 4 saga pages; 199 source pages; 181 corpus files; known peer warning |
| agent docs prose exact task | NOT_RUN        | write-capable docs build prohibited in read-only S1                  |
| assets barrel exact task    | NOT_RUN        | write-before-diff prohibited; underlying `--check` PASS              |
| publish assets              | PASS           | exit 0 in read-only check mode                                       |
| MCP corpus                  | PASS           | `3a3ff013...d380a`; 35 packages, 271 subpaths, 7677 symbols          |
| lock                        | PASS           | `edfa0c24...d1820c`                                                  |
| Gate 30 runtime             | NOT_RUN        | serialized runtime lease required                                    |

## Convergence Record

- Old authoritative ceiling: 25 paths.
- Main intersection from `5197e70b7` through `8a925764`: 6 paths (explicit list in `plan.md`).
- Narrowed ceiling: 20 paths; the same six intersect it.
- Handwritten publisher/docs/sample intersection: zero.
- Merge conflicts: zero, per supervisor and merge state.
- Branch delta before this correction: six `.llm/runs/**` artifacts only.

## PLAN-EVAL Disposition

`PLAN-EVAL: N/A` accepted by the primary. The complete mechanism, surface, ceiling, negative scope,
acceptance contract, and measured gates made a separate planning evaluator unnecessary. IMPL-EVAL
remains mandatory after implementation and is owned by the supervisor.

## Hard Stops

- No product/test code in this correction commit.
- No worker sample/test edit.
- No endpoint diagnostic edit.
- No `netscript init`, scaffold command, any `e2e:cli`, Aspire, Docker, container, or AppHost use.
- No write-capable derivative command in S1.
- No dependency/lock change.
- Explicit push refspec only.
