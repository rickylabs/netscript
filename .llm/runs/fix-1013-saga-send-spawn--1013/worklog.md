# Worklog: saga send/spawn correction (#1013)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1013-saga-send-spawn--1013` |
| Branch | `fix/1013-saga-send-spawn` |
| Archetype | `5 - Plugin Package` with sibling runtime rules |
| Scope overlays | `docs` |

## Design

### Public Surface

- `send(target, payload, options): CascadedMessage<'send'>` — unchanged internal saga-bus effect.
- `spawn(child, input, options): never` — retained unsupported symbol that throws
  `SAGA_NOT_IMPLEMENTED` before an effect ledger can accept it.
- Storefront tutorial — runnable current-state contract for the explicit trigger/worker boundary.

### Domain Vocabulary

- `CascadedMessage<'send'>` — internal message ledger entry consumed by the saga bus.
- `CascadedMessage<'spawn'>` — retained wire/domain variant for defensive rejection; not authored
  through the public constructor.
- `EnqueueJobAction` / `JobMessage` — explicit trigger-to-worker handoff.
- `JobDefinition` / worker registry — identity and handler resolved by the worker boundary.
- `SagaMessage` / `SagaCorrelationKey` — worker result resumes the intended saga instance.

### Ports

- Existing `TriggerProcessorPort` dispatches `enqueueJob` actions into an injected job queue.
- Existing worker runtime registry and `RuntimeWorkerPort` resolve and execute the registered job.
- Existing `SagaPublisherPort` is injected into the tutorial job test to publish the result back to
  the local saga runtime.
- No new port is planned.

### Constants

- Use existing `SAGA_NOT_IMPLEMENTED`, `DEFAULT_TOPIC`, trigger action kinds, and message names.
- Test-only ids are named constants if repeated; no new framework vocabulary is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Unsupported spawn fails at construction and exposes `never`. | Focused pre-fix-red/runtime/doc/static gates | `src/public/messages.ts`, checkout runtime test, run artifacts |
| 2 | Storefront correction and real trigger-worker-saga round trip. | Pre-fix-red integration; affected runtime/docs/static gates | storefront docs, durable sagas page, docs accuracy checker, integration test, run artifacts |
| 3 | Aggregate evidence, acceptance mirror, and evaluator handoff. | Required aggregate gates + IMPL-EVAL | run artifacts and GitHub surfaces |

### Deferred Scope

- Child-saga execution — no lifecycle contract exists.
- Saga-to-worker `send` overload — explicit trigger boundary is the selected contract.
- Inventory and shipment jobs — the tutorial stops at `paid` until those jobs are authored.

### Contributor Path

To add external work from a saga-led workflow, define a worker job in workers core, return
`enqueueJob(job, ...)` from a trigger, let the registered worker execute it, and publish a typed
result back through the saga publisher. Use `send()` only when another registered saga handler owns
the target message type.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-03 11:00 CEST | planning | research | Re-baselined #1013 against #1042 and #1075; actual current failure is orphan saga-message dispatch, not an unconsumed ledger. |
| 2026-08-03 11:00 CEST | planning | evaluator canary | Local Qwen route blocked with `auth_required`; implementation remains paused. |
| 2026-08-03 11:15 CEST | plan-eval | owner waiver | Opposite-family owner reviewer waived the environmentally blocked Plan-Gate on the record; implementation authorized. |
| 2026-08-03 11:20 CEST | slice 1 | pre-fix red | With only the new construction-time assertion applied to baseline product code, `deno test --allow-all packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts` failed 1/3: `AssertionError: Expected function to throw.` |
| 2026-08-03 11:25 CEST | slice 1 | implementation | `spawn()` now returns `never` and throws `SAGA_NOT_IMPLEMENTED` before ledger acceptance; focused test passed 3/3. |
| 2026-08-03 11:30 CEST | slice 1 | ordinary review | Claude Fable opposite-family review requested changes: retain wire-level spawn dispatch coverage and record red proof. Both findings were accepted and fixed before sign-off. |
| 2026-08-03 11:45 CEST | slice 1 | re-review | Claude Fable opposite-family reviewer independently reran the focused and full package suites and returned `PASS`; both prior findings are closed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Finish correction route | #1042 already selected it and enumerated the remaining close-gate scope. | #1042 / #1013 comment |
| Fail spawn at construction | Unsupported authored effects must not enter the ledger. | User rule / A13 |
| Use real existing cross-plugin ports in the tutorial test | An action-object assertion would repeat #1042's false-green test. | Issue acceptance / code trace |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| #1075 makes orphan tutorial sends fail rather than evaporate | significant | yes |
| Local formal evaluator credential absent | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline focused public surface | `deno doc --filter send|spawn packages/plugin-sagas-core/mod.ts` | PASS | Confirms current documented signatures before change. |
| Baseline full doc lint | `deno task doc:lint --root packages/plugin-sagas-core --pretty` | FAIL baseline | 9 combined private-type refs in 3 unrelated files; root and affected public entrypoints are clean. |
| Slice 1 public surface | `deno doc --filter spawn packages/plugin-sagas-core/mod.ts` | PASS | Renders `spawn(...): never` and the named-error contract. |
| Slice 1 scoped check/lint/fmt | Repo wrappers over `packages/plugin-sagas-core`, `--ext ts,tsx` | PASS | 110 files; zero findings in all three wrappers. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `F-5/F-6/F-7` baseline scan | `DEBT_ACCEPTED` / baseline | JSR audit: dry-run OK, one slow-type warning, source-root cardinality warning | Planned explicit `never` adds no slow type or folder child. |
| Plan-Gate | `WAIVED` | Owner authorization in product thread; recorded in `drift.md` | Environmental waiver only; IMPL-EVAL remains required. |
| Slice 1 quality scan | `PASS` | Repository scan `ok: true`, no findings | Seven existing attributed allowances; none added. |
| Slice 1 architecture | `PASS` | `arch:check` completed with every doctrine root `FAIL=0` | Saga-core retains two baseline warnings; no new debt. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Current effect trace | PASS | bridge/engine code plus #1075 diff | `publish()` recursively consumes ledgers; `send` remains saga-bus only. |
| Slice 1 pre-fix red | PASS | Focused test failed on unchanged baseline product code | `spawn()` returned normally; `assertThrows` reported `Expected function to throw.` |
| Slice 1 package suite | PASS | 68 passed, 0 failed, 2 ignored | Full `packages/plugin-sagas-core` suite, not a file-only verdict. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Storefront tutorial | FAIL baseline | orphan `send()` targets and no trigger-worker runtime test | Owned by slice 2 after PLAN-EVAL. |

## Handoff Notes

- PLAN-EVAL should challenge `D3` (`spawn(): never`) and verify the integration test uses a
  registry-resolved job rather than a queue-only assertion.
- No implementation file has been changed before a PLAN-EVAL `PASS`.
