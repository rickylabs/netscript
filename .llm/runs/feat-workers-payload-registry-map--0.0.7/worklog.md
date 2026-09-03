# Worklog: workers payload registry map remainder

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-payload-registry-map--0.0.7` |
| Branch | `feat/workers-payload-registry-map` |
| Archetype | 3 — Runtime/Behavior; 5 — Plugin; bounded Archetype-6 fixture |
| Scope overlays | service contract and generated application boundary |

## Design

### Public Surface

- `JobPayloadSchema`, `JobHandlerDefinition`, `JobPayloadOf`, `JobPayloadMap` — package-owned
  Standard Schema carrier and registry algebra.
- `JobBuilder.payload(schema)` / `defineJobHandler(schema, handler)` — schema-backed declaration
  boundaries; both retain the accepted intentional source break.
- `JobTriggerInput<TPayloads>` / `WorkersContract<TPayloads>` / `createWorkersContract<TPayloads>()`
  — broad-default, literal-ID client binding over the unchanged v1 wire schema.
- Generated `jobHandlersById`, `jobDefinitionsById`, and `GeneratedJobPayloadMap` — precise
  application boundary before existing Map projections.

### Domain Vocabulary

- `JobHandlerDefinition` — callable job handler carrying its payload schema.
- `JobPayloadMap` — maps literal registry keys to the schema-inferred handler payload.
- `JobPayloadValidationError` — structured handler/enqueue boundary rejection.

### Ports

- No new port. Existing definition registry and dispatcher seams carry the schema.

### Constants

- No new constant group.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Defect-specific RED | focused `deno test` / `deno check` must fail for missing validation and unused directive | focused tests + run artifacts |
| 2 | Core schema carrier and runtime boundaries | workers-core focused check/tests | workers-core + first-party job declarations |
| 3 | Literal generator and typed trigger contract | generator compile proof + plugin/CLI focused tests | workers generator/plugin + CLI fixture |
| 4 | Gate and PR receipts | full brief gate set | run artifacts only unless an in-scope regression is found |

### Deferred Scope

- #1451 operational metadata/handler-erasure redesign beyond this literal type carrier.
- Task/workflow payload parity and distinct Standard Schema input/output typing.

### Contributor Path

Define one schema next to a job, pass it to `defineJobHandler(schema, handler)` (or
`.payload(schema)` before `.handler(...)`), generate registries, and use the emitted
`GeneratedJobPayloadMap` with `createWorkersContract<...>()`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | bootstrap | re-baseline | Read brief, issue/comments, accepted plan, published `deno doc` surfaces, doctrine, and current generator/runtime seams. |
| 2026-09-03 | bootstrap | plan gate | PLAN-EVAL N/A: owner locked this mechanical remainder and the parent plan has separate-session PASS_PLAN. |
| 2026-09-03 | 1 | RED runtime | `job-payload-contract_test.ts` compiled, ran, and failed only with `Expected function to reject`; malformed wire payload reached the application handler. |
| 2026-09-03 | 1 | RED trigger consumer | `deno check --unstable-kv workers-contract-soundness_test.ts` failed only with TS2578 on the mismatched ID/payload directive. The call shape, imports, and other controls compile. |
| 2026-09-03 | 1 | RED generated consumer | Focused generator test emitted the current widened map; nested `deno check` failed only with TS2578 on the wrong-job payload directive. A self-contained type module excludes unrelated workspace/import failures. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| No v2 wire contract | Runtime Zod schema and route stay identical; only TypeScript opt-in narrows. | accepted plan §1/§3; brief S3 |
| Validate at enqueue and handler boundary | New brief explicitly requires both; same carried definition schema is used. | implement brief S1 |
| Preserve generated runtime Map exports | Avoid #1451/#1872 operational regression. | accepted plan §4; brief S2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Brief strengthens prior plan's handler-only runtime validation to require enqueue validation too. | significant | yes |

## Gate Results

### RED receipts

| Proof | Result | Defect-specific reason |
| --- | --- | --- |
| handler boundary | expected FAIL | Handler resolved; no carried schema existed to reject malformed payload. |
| typed `triggerJob` | expected FAIL | TS2578 proves broad `JobTriggerInput` accepted the embed payload for `transcribe-image`. |
| generated registry | expected FAIL | TS2578 proves emitted `Map<string, JobHandler<any>>` accepted the embed payload for the transcribe handler. |

The directives are not compensating for arity, missing imports, malformed definitions, or unrelated
type errors: the positive call sites and surrounding fixtures compile, and each nested compiler
reported only the unused directive.

## Handoff Notes

- Evaluator should inspect the RED failure receipts first, then schema identity at both runtime
  boundaries, then emitted literal type preservation before Map projection.
