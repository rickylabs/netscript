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
| 2026-08-31       | S2.1 RED      | helper contract       | Compiling focused test proved 0 passed/3 failed solely because the core publisher export was absent; `2f913f237`. |
| 2026-08-31       | S2.1 GREEN    | throwing companion    | Added the core helper/re-exports; focused 3/0, core 87/0/3, sagas 55/0/1, with package checks and policy gates.   |
| 2026-08-31       | S2.2 RED      | quality fixtures      | Scanner test compiled, then produced 26 passed/2 failed because known saga receipt discards were not reported.    |
| 2026-08-31       | S2.2 GREEN    | saga-aware scanner    | Focused scanner suite reached 28/0; repo scan found only three owned fenced docs calls with 7 allowances.         |
| 2026-08-31       | S2.3 RED      | source derivation     | New test compiled and failed 0/1 on the real canonical-doc versus shipped-source mismatch; `3567b2449`.           |
| 2026-08-31       | S2.3 GREEN    | safe public examples  | Canonical sample now equals source; four calls consume receipts; docs tests 12/0 and quality scan 0/7.            |
| 2026-08-31       | S2.4 RED      | derivative freshness  | `check:mcp-export-corpus` failed on the real stale carrier before any generator ran; harness-only RED commit.     |
| 2026-08-31       | S2.4 STOP     | ceiling conflict      | Assets generation moved unlisted `agent-tools.generated.ts`; partial outputs restored, explicit rescope needed.   |

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

## S2.1 Evidence — Core Throwing Companion

RED was committed before product changes as `2f913f237`:

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-sagas-core/tests/integration/publisher/publish-saga-or-throw_test.ts --ext ts`
  — PASS 1/1.
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin-sagas-core/tests/integration/publisher/publish-saga-or-throw_test.ts`
  — expected exit 1, 0 passed/3 failed; every failure was the missing publisher export.

GREEN evidence after the helper and two entrypoint exports:

- focused helper test — PASS 3/0.
- core whole-package check/test/lint/fmt — PASS 114/114; 87 passed/0 failed/3 ignored; PASS 114/114;
  PASS 114/114.
- sagas whole-package check/test/lint/fmt — PASS 87/87; 55 passed/0 failed/1 ignored; PASS 87/87;
  PASS 87/87.
- core doc lint retained the exact 9-private-reference baseline; sagas retained 27. Core audit
  remained PASS with 2 warnings; sagas retained the exact module-tag baseline plus 2 warnings.
- both package publish dry-runs, `arch:check:repo`, and the public `deno doc` inspections passed.
- `quality:scan:repo` remained PASS with 0 findings and 7 valid allowances before the new rule
  slice.

## S2.2 Evidence — Discarded-Receipt Quality Rule

RED was committed before scanner implementation as `6276cee76`:

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/quality/scan-code-quality_test.ts --ext ts`
  — PASS 1/1.
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/quality/scan-code-quality_test.ts`
  — expected exit 1, 26 passed/2 failed; only known saga publisher source/docs/template findings
  were absent, while the consumed/unrelated control passed.

GREEN evidence with `discarded-saga-publisher-result` active:

- focused scanner check — PASS 1/1; focused tests — PASS 28/0.
- `deno task quality:scan:repo` — expected interim exit 1 with exactly three findings, all fenced
  unsafe docs calls owned by S2.3; allowance count remained exactly 7 with no failures.
- the workers-emitted template was traversed through its TypeScript template text and produced no
  finding because its receipt is already discriminated. The fourth canonical docs copy is a custom
  component string rather than a checked fence and is protected by the source-derived sync test in
  S2.3.

## S2.3 Evidence — Source-Derived Safe Documentation

RED was committed before docs/task changes as `3567b2449`:

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs/official-saga-publisher-sample-sync_test.ts --ext ts`
  — PASS 1/1.
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read .llm/tools/docs/official-saga-publisher-sample-sync_test.ts`
  — expected exit 1, 0 passed/1 failed on the real canonical-doc/source mismatch.

GREEN evidence after the docs corrections and task wiring:

- focused source-sync test — PASS 1/0; `deno task docs:snippets:test` — PASS 12/0.
- `deno task docs:snippets` — PASS, 582 scanned and 23 checked snippets with 0 malformed.
- `deno task quality:scan:repo` — PASS, 0 findings, exactly 7 allowances, 0 allowance failures.
- `deno task docs:links` — PASS, 103 docs and 0 broken links/anchors.
- `deno task docs:exports-drift` and `deno task docs:accuracy` — PASS; accuracy retained only the
  measured TanStack peer warning.
- the canonical worker sample is now the exact statically decoded source body, and the storefront
  success-path publish rejection returns a job failure directly rather than entering the provider
  exception handler.

## S2.4 Evidence — Generated Derivatives

RED before any carrier write:

- `deno task check:mcp-export-corpus` — expected exit 1 with the precise stale-corpus diagnostic;
  the additive core helper export had not yet reached the checked-in MCP corpus.
- No generator had run and no generated carrier changed before this harness-only RED record.

The subsequent ordered GREEN attempt stopped after the second generator. `gen:agent-docs-prose`
changed only allowed paths 15–16. `gen:assets-barrel` then changed allowed path 17 and unlisted
`packages/cli/src/kernel/assets/agent-tools.generated.ts`, because that carrier embeds the modified
quality scanner. All partial generated changes were restored; generators three and four were not
run. S2.4 remains blocked on an explicit ceiling rescope to 21 paths.

## Hard Stops

- No product/test code in this correction commit.
- No worker sample/test edit.
- No endpoint diagnostic edit.
- No `netscript init`, scaffold command, any `e2e:cli`, Aspire, Docker, container, or AppHost use.
- No write-capable derivative command in S1.
- No dependency/lock change.
- Explicit push refspec only.
