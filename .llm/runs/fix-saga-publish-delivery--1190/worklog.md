# Worklog: saga publish delivery (#1190)

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `fix-saga-publish-delivery--1190`           |
| Branch         | `fix/saga-publish-delivery`                 |
| Archetype      | `3 - Runtime / Behavior`; `5 - Thin Plugin` |
| Scope overlays | `service`                                   |

## Design

### Public Surface

- `startSagas` — remains the core started-runtime entry point; composition behavior is executable.
- `startSagaRunner` / `runSagaRunner` — own queue consumption in addition to engine lifecycle.
- `createDurableSagaRuntime` — low-level construction surface; document/deprecate honestly if it
  cannot own scheduler and start semantics without injected wiring.
- Sagas HTTP `POST /api/v1/sagas/publish` — durable acceptance boundary with finite failure time.

### Domain Vocabulary

- `SagaDeliveryMessage` — serializable message envelope transferred from API to runner.
- `SagaInstanceProjection` — query-facing mirror derived after an engine transition persists.
- `SagaDeliverySupervisor` — owned queue-listener lifecycle and failure state.

### Ports

- Existing `MessageQueue<SagaDeliveryMessage>` structural boundary — backend-neutral enqueue/listen.
- Projection writer/store decorator seam — mirrors durable state without making the read model the
  engine source of truth.

### Constants

- `SAGA_DELIVERY_QUEUE` — `sagas`.
- `SAGA_PUBLISH_TIMEOUT_MS` — finite default with an explicit environment/config override only if
  the service convention already supports one.

### Commit Slices

| # | Slice                                                                           | Gate                                                        | Files                                                                        |
| - | ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1 | Harness research/design lock and HTTP RED fixture                               | Plan checklist + RED command                                | `.llm/runs/...`; `plugins/sagas/tests/services/*`                            |
| 2 | Queue publisher, bounded HTTP handler, and runner-owned delivery                | focused service/runtime tests                               | `plugins/sagas/services/src/routers/*`; `plugins/sagas/src/runtime/*`; tests |
| 3 | Durable `saga_instances` projection and lifecycle/scheduled-entrypoint contract | focused core/plugin tests + artifact assertions             | plugin runtime/services helpers; core tests/docs only as required            |
| 4 | Static/quality/JSR gates and #1193 integration reconciliation                   | scoped wrappers, quality, arch, doc-lint, dry-run           | changed surfaces; run artifacts                                              |
| 5 | Redis/Garnet + Deno KV scaffold/OTEL protocol and merge-ready evidence          | real HTTP, persisted artifact, restart, OTEL, full scaffold | run artifacts and necessary test/probe updates                               |

### Deferred Scope

- Prisma projection parity beyond preserving the existing path — separate debt/issue if evidence
  shows it is required outside KV store mode.
- New general-purpose saga transport API — existing queue port is sufficient.
- Runtime folder relocation — existing architecture debt owns it.

### Contributor Path

Add saga definitions to the generated registry; publish through the documented HTTP publisher; the
standard runner consumes the shared `sagas` queue and projects transitions automatically.

## Progress Log

| Time       | Slice | Step                | Notes                                                                                                                                                                                       |
| ---------- | ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | 1     | research            | Read #1190 first; re-baselined #1193, failed scaffold, doctrine, harness, CLI, Aspire, tooling, JSR, and code paths.                                                                        |
| 2026-08-04 | 1     | environment         | Found one foreign #1193 `aspire/db-operation` AppHost; reported and left untouched.                                                                                                         |
| 2026-08-04 | 1     | design              | Locked queue-backed API→runner delivery and projection seam.                                                                                                                                |
| 2026-08-04 | 1     | PLAN-EVAL           | composed per milestone-run.md (orchestrator waiver)                                                                                                                                         |
| 2026-08-04 | 1     | RED                 | Real router request with a never-settling publisher exceeded the 100ms harness deadline: `Expected actual: "request-timed-out" not to be: "request-timed-out"`.                             |
| 2026-08-04 | 2     | delivery            | HTTP now awaits traced durable enqueue with a finite deadline; runner owns queue listener and queue-backed delayed cascades.                                                                |
| 2026-08-04 | 3     | projection          | Runner store decorator mirrors persisted transitions to Prisma `saga_instances` or the named KV fallback when delegates are unavailable.                                                    |
| 2026-08-04 | 3     | focused gates       | Queue 35/35, saga core 69 pass (2 ignored integrations), sagas plugin 44/44; HTTP GREEN completed in 26–39ms and two transitions projected.                                                 |
| 2026-08-04 | 4     | quality gates       | Scoped check/lint/fmt and `quality:gate` passed; all three changed packages passed `deno publish --dry-run --allow-dirty`.                                                                  |
| 2026-08-04 | 4     | public surface      | Queue doc-lint is clean. Core/plugin retain 9/15 pre-existing private-reference findings; new delivery/projection types have zero missing JSDoc and no private-type leaks.                  |
| 2026-08-04 | 5     | orchestrator steer  | Both-backend scaffold/restart/OTEL protocol transferred to PR #1193; this slice must not run or claim that joint evidence.                                                                  |
| 2026-08-04 | 5     | interrupted cleanup | The in-progress composed scaffold stopped at `runtime.wait.workers-api`; scoped teardown removed its two proven-owned Postgres containers and left two foreign wave-4 containers untouched. |
| 2026-08-04 | 5     | CI diagnosis        | GitHub `quality` identified one unused type import; `close-gate` identified stale unchecked omnibus DoD rows. The import and PR contract were narrowed to this PR's evidenced scope.        |
| 2026-08-04 | 5     | close-gate          | The mandated linked-issue sentence renders verbatim while its closing verb is entity-encoded in source; live verdict is `PASS`, `closing issues: none`, so #1190 cannot auto-close here.    |
| 2026-08-04 | 6     | check-test diagnosis | The rerun reached the generated-registry saga integration and then remained live for 25 minutes until GitHub's 30-minute job ceiling cancelled it; no test assertion failed.              |
| 2026-08-04 | 6     | shutdown fix        | Redis queue shutdown now releases both owned clients even after listener cancellation; saga delivery shutdown has a finite provider acknowledgement grace period.                       |
| 2026-08-04 | 6     | focused verification | Queue abort cleanup, saga runner, and generated registry tests passed 13/13; scoped check/lint/fmt passed over 125 files with zero findings.                                               |

## Decisions

| Decision                          | Reason                                                                                   | Source                           |
| --------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| Queue-backed delivery             | Both backends + trace propagation already exist and workers establish the convention.    | `plan.md` D1; queue/workers code |
| HTTP acknowledges enqueue         | Removes engine/scheduler work from request latency and prevents indefinite publish.      | `plan.md` D2–D3                  |
| Runner projects after transition  | Engine store remains canonical while API instances become truthful.                      | `plan.md` D4–D5                  |
| No local formal PLAN-EVAL         | Explicit milestone protocol/orchestrator waiver.                                         | owner directive; `plan.md` D6    |
| Joint protocol transfers to #1193 | The orchestrator coordinates the single expensive both-backend run after this PR merges. | final orchestrator steer         |

## Drift

| Drift                                                         | Severity    | Logged in drift.md |
| ------------------------------------------------------------- | ----------- | ------------------ |
| #1193 protocol did not capture #1190 publish-hang RED         | minor       | yes                |
| Foreign `aspire/db-operation` host blocks a fresh AppHost now | significant | yes                |
| Deno KV queue did not await the Fedify enqueue promise        | significant | yes                |

## Gate Results

### Static Gates

| Gate            | Command or check                                            | Result             | Notes                                                                                                                     |
| --------------- | ----------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate       | manual checklist                                            | PASS               | All rows present; evaluator composition waiver recorded.                                                                  |
| PLAN-EVAL       | milestone composition                                       | PASS               | composed per milestone-run.md (orchestrator waiver)                                                                       |
| check           | scoped wrapper over core/queue/plugin                       | PASS               | 230 TS/TSX files selected.                                                                                                |
| lint            | scoped wrapper over core/queue/plugin                       | PASS               | 230 files, 0 findings.                                                                                                    |
| fmt             | scoped wrapper over core/queue/plugin plus focused Markdown | PASS               | Changed TypeScript and focused Markdown are formatted.                                                                    |
| `quality:gate`  | `rtk proxy deno task quality:gate`                          | PASS               | Quality scan and architecture check passed; only repository-baseline warnings were emitted.                               |
| doc-lint        | one scoped run per changed package                          | PASS_WITH_BASELINE | Queue 0; core 9 and plugin 15 pre-existing private-reference findings; 0 missing JSDoc and no new delivery-surface leaks. |
| publish dry-run | package task for core, queue, plugin                        | PASS               | All three completed publish simulation and slow-type analysis; plugin emitted only its existing dynamic-import warnings.  |

### Fitness Gates

| Gate  | Result             | Evidence                                            | Notes                                                                                         |
| ----- | ------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `F13` | PASS               | 69 core tests + 44 plugin tests + 35 queue tests    | Fresh scaffold runtime protocol still required separately.                                    |
| `F19` | PASS_WITH_BASELINE | scoped doc-lint + three successful publish dry-runs | New public types are documented and analyzable; existing private-reference debt is unchanged. |

### Runtime Gates

| Gate                | Result      | Evidence                                              | Notes                                                                                                     |
| ------------------- | ----------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0.0.4 RED           | FAIL        | issue #1190 + failed scaffold drift/worklog           | No HTTP status in 15s; no instance; runner only started.                                                  |
| HTTP-boundary RED   | FAIL        | `publish-http-boundary_test.ts` before implementation | Actual router request exceeded 100ms and failed its assertion.                                            |
| HTTP-boundary GREEN | PASS        | `publish-http-boundary_test.ts`                       | Deadline returned non-2xx in ~10ms; enqueue→runner→persist→project→scheduled follow-up passed in 26–39ms. |
| Redis/Garnet GREEN  | TRANSFERRED | PR #1193 joint verification                           | Not run or claimed in this PR per orchestrator steer.                                                     |
| Deno KV GREEN       | TRANSFERRED | PR #1193 joint verification                           | Not run or claimed in this PR per orchestrator steer.                                                     |
| OTEL traces/spans   | TRANSFERRED | PR #1193 joint verification                           | PR #1193 must quote the correlated path after this implementation merges.                                 |

### Consumer Gates

| Consumer      | Result      | Evidence                    | Notes                                          |
| ------------- | ----------- | --------------------------- | ---------------------------------------------- |
| real scaffold | TRANSFERRED | PR #1193 joint verification | The orchestrator owns the expensive-gate slot. |

## Handoff Notes

- Inspect the HTTP→queue→runner ownership boundary first, then projection write ordering.
- Reject any claim that HTTP 2xx alone proves runner delivery; require GET/persistence/spans.
- Merge handoff: #1198 supplies the HTTP-boundary RED→GREEN and engine/runtime fix. PR #1193 owns
  the single post-merge Redis/Garnet + Deno KV scaffold, restart, persistence, GET, and OTEL proof.
- Do not add a closing keyword for #1190 to this PR. The orchestrator hand-closes the issue only
  after #1193 records the transferred evidence.
