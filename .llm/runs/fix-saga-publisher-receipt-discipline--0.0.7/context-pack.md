# Context Pack: saga publisher receipt discipline (#1365)

## Run Metadata

| Field                    | Value                                            |
| ------------------------ | ------------------------------------------------ |
| Run ID                   | `fix-saga-publisher-receipt-discipline--0.0.7`   |
| Branch                   | `fix/saga-publisher-receipt-discipline`          |
| Base                     | `6bb27e46ab1bd4b9534068b2a9eb58039ae287d1`       |
| Converged head before S2 | `9f1f9fb8738c92dd047054cfde096c3722b967bb`       |
| Current phase            | S2 implementation                                |
| Archetypes               | core 3 Runtime/Behavior; plugin 5 Plugin Package |
| Overlay                  | docs                                             |

## Current State

S1 was accepted and then owner-narrowed. S2.1 through S2.3 are GREEN: the throwing companion passes
both whole-package suites; the saga-aware scanner passes 28/0; the canonical sample equals the safe
worker source; and all four docs calls consume their receipts. Repository quality is 0 findings with
exactly 7 allowances, and docs snippet tests are 12/0. The locked implementation contract has two
defects only: add the throwing publisher companion plus discarded-receipt quality rule, and correct
four unsafe documentation calls plus stale fallback prose/source-sync coverage. The product ceiling
is 20 paths. Every workers product/test path and all endpoint-diagnostic work are excluded.

The primary accepted `PLAN-EVAL: N/A` because scope, contract, acceptance, and gates are complete.
S2 is authorized through the four locked RED/GREEN slices. Gate 30 remains `NOT_RUN`; a serialized
runtime lease is required.

## Convergence

- Supervisor reset target: `7c2a12fa1`.
- Merge parents: accepted S1 artifact commit `2e9460450` and current main `8a9257642`.
- Original 25-path ceiling intersection from old base to current main: **6/25**.
- Intersecting paths: two agent-doc assets, root `deno.json`, CLI agent-doc derivative, MCP corpus,
  and MCP publish-assets derivative.
- Handwritten publisher/docs/sample intersection: zero.
- Narrowed ceiling retains the same six derivatives/task paths.

## Locked Decisions

1. Add `publishSagaOrThrow` over `SagaPublisherPort`; no required method or fake compile-time type.
2. Reuse `SagasError`; preserve reason/retryability/cause and exact accepted message type.
3. Core owns implementation; plugin runtime only re-exports.
4. Quality rule identifies saga-publisher bindings and standalone awaited `publish`/`publishMany`;
   it must cover source, docs fences, and the emitted sample template without flagging unrelated
   publishers.
5. Workers sample is read-only source truth; no workers guard or product edit.
6. Source-derived docs test is wired into `docs:snippets:test`.
7. Endpoint diagnostics are a proposed follow-up recorded in `drift.md`.

## S2 Slices

1. Core helper + core/plugin exports + helper tests + port doc — GREEN.
2. Discarded-receipt scanner rule + fixtures — GREEN.
3. Source-sync test/task + four unsafe calls + two reference corrections — GREEN.
4. Attributed derivatives + full static/package/docs/lock/ceiling handoff.

## New-Base Baseline Highlights

- Core: 112 check/lint/fmt files; 84 passed/0 failed/3 ignored; doc-lint 9 private refs; audit pass
  with 2 warnings.
- Sagas: 87 files; 55/0/1; doc-lint 27 private refs; audit baseline red for `doctor` module tag + 2
  warnings.
- Workers (continuity only): 102 files; 52/0/0; doc-lint 20; audit baseline red + 3 warnings.
- Quality: 0 findings, 7 valid allowances. Unsafe saga-publisher doc census: 4; sample: 0.
- Docs: snippets 11; links 103/0; accuracy pass.
- Doctrine: core 3W/2I, sagas 8W/2I, workers 9W/2I.
- MCP corpus: `3a3ff013...d380a`, 35 packages/271 subpaths/7677 symbols.
- Lock: `edfa0c24...d1820c`.
- Write-capable agent-doc/assets exact gates: not run in read-only S1; assets underlying `--check`
  passed. Runtime Gate 30: not run.

## Hard Constraints

- Artifacts only until this correction commit is pushed.
- No `plugins/workers/**` edit.
- No endpoint-resolution/diagnostic edit.
- No scaffold, `e2e:cli`, Aspire, Docker, container, or AppHost command.
- No write-capable derivative task in S1.
- No dependency or lock change.
- Explicit push refspec only.

## Next Action

Regenerate and validate S2.4 derivatives in locked dependency order. Stop at implementation
complete; the supervisor dispatches separate-session GLM 5.3 Flash · max IMPL-EVAL.
