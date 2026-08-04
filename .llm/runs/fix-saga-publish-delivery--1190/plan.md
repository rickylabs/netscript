# Plan: saga publish delivery (#1190)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-saga-publish-delivery--1190` |
| Branch | `fix/saga-publish-delivery` |
| Phase | `plan` |
| Target | `packages/plugin-sagas-core`, `plugins/sagas` runtime/service |
| Archetype | `3 - Runtime / Behavior` (core), `5 - Thin Plugin` (connector) |
| Scope overlays | `service` |

## Archetype

The saga engine is an Archetype 3 runtime/state machine: lifecycle, delivery, persistence, retries,
and crash boundaries are the behavior. `plugins/sagas` is the Archetype 5 connector/composition
root: it selects queue/KV infrastructure and binds the HTTP and runner processes without moving
domain convention out of core.

## Current Doctrine Verdict

The repository verdict is REFACTOR WITHIN A BOUNDED SLICE: preserve the canonical core engine and
ports, eliminate the split-brain API/runner composition, and keep provider selection in the plugin
composition root. Do not relocate unrelated runtime folders or broaden the open architecture debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| `A3` | The named start surfaces must actually start all resources needed for their documented behavior. |
| `A10` | The plugin composition root must own queue/store/provider wiring; handlers should consume ports. |
| `A12` | The saga engine remains the canonical state machine; the API read model is a projection. |
| `A13` | Queue listener failure and publish timeout are explicit crash/failure boundaries, never silent hangs. |

## Goal

Make HTTP saga publish durably enqueue and return on Redis/Garnet and Deno KV, have the background
runner consume it, execute the registered saga, persist engine state and the `saga_instances` read
model, preserve trace correlation, and make unavailable delivery fail within a bounded interval.

## Scope

- Replace API-local engine execution with a bounded saga publisher backed by `@netscript/queue`.
- Add runner queue consumption, lifecycle ownership, delivery failure handling, and trace transfer.
- Project each successful engine transition into the existing `saga_instances` API read model.
- Close the public lifecycle ambiguity with executable composition tests and explicit documentation
  or deprecation where a helper cannot truthfully be a single-point start surface.
- Add a regression that crosses the real HTTP router boundary and fails on the old topology.
- Capture fresh-scaffold Redis/Garnet and Deno KV protocol evidence after #1193 integration is
  available, including artifact inspection and Aspire OTEL traces/spans.

## Non-Scope

- Generated glue/KV adapter registration owned by PR #1193.
- Redis-specific saga transport fixes from #1064 or a new transport protocol.
- Relocating `plugins/sagas/src/runtime` to close existing folder-cardinality debt.
- Stable/canary publication; the milestone orchestrator owns the canary cut.
- Adopting, stopping, or cleaning foreign AppHosts/resources.

## Hidden Scope

- Preserve idempotency and message identity across enqueue/dequeue.
- Queue shutdown must be joined with runtime shutdown; listener failures must surface to supervision.
- Kvdex projection needs identical collection schema/id generation in runner and API processes.
- #1193 may touch `services/src/main.ts`; reconcile by rebase/cherry-pick only when the orchestrator
  makes its integration point available.
- A local Deno KV file cannot be assumed process-shareable without an actual two-process proof.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| `D1` | Use `@netscript/queue` queue `sagas` as API→runner delivery. | It is the established backend-neutral, traced composition convention and covers both required providers. |
| `D2` | HTTP 2xx acknowledges successful durable enqueue, not saga completion. | It prevents handler execution and scheduling latency from blocking the request while retaining delivery semantics. |
| `D3` | Apply a finite publish deadline and translate timeout/configuration failures to a non-2xx error. | A hang must be observably different from success. |
| `D4` | Runner owns dequeue→runtime.publish→projection; errors reject/nack and remain supervised. | One process owns state-machine execution and persistence. |
| `D5` | Keep engine state as source of truth; mirror a stable read model through a store/projection seam after persistence. | Avoids making the HTTP collection a second engine store while satisfying the existing API contract. |
| `D6` | Do not spawn a local PLAN-EVAL; record the milestone composition waiver and lock this plan. | Explicit owner/orchestrator directive for this canary train. |
| `D7` | Reuse #1193 only for generated KV glue, and prove the combined train on both backends. | Preserves branch ownership while meeting the owner’s joint-verification bar. |
| `D8` | Keep `startSagas` as the core started surface and mark low-level durable construction honestly if it still requires injected scheduling. | Satisfies the no-third-state requirement without pretending construction alone starts infrastructure. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact internal class/file split | safe to defer | Must preserve D1–D5 and public surface constraints. |
| Queue name override for tests/advanced hosts | safe to defer | Default stays `sagas`; inject a structural queue only if needed for tests. |
| Prisma projection parity | safe to defer | Owner bar is Redis/Garnet + Deno KV; existing Prisma read path remains unchanged and is not weakened. |
| #1193 integration SHA | safe to defer | Verification waits for an explicit available integration point; no foreign branch mutation. |
| Local AppHost start time | safe to defer | Wait until the foreign host clears; do not kill it. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Redis works but Deno KV does not share across processes | Execute distinct fresh-scaffold runs and inspect persisted artifacts for each provider. |
| Publish returns before enqueue is durable | Await `MessageQueue.enqueue`; add a test whose queue promise is controlled. |
| Queue listener failure becomes a detached promise | Give delivery an owned supervisor/completion and assert failure snapshots. |
| Projection is written before engine persistence | Project only after runtime publish/store transition completes; test no projection on failure. |
| Trace context is overwritten or split | Rely on queue instrumentation and assert one correlation/trace across HTTP→enqueue→dequeue→saga.handle. |
| Scheduled cascades still fail after first delivery | Exercise a scheduled-cascade definition in composition tests and make the public limitation explicit or supply scheduling. |
| #1193 conflicts in service bootstrap | Rebase after its integration SHA is known; retain its glue changes and record conflict resolution in drift. |
| Foreign AppHost contaminates evidence | Serialize runs; verify process tree and ownership before start/stop; use leak-check with `--owned-root`. |
| Public inferred types fail JSR | Use explicit exported annotations, `deno doc --lint`, and package dry-runs. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | ------ | ---- |
| `AP-2 split composition roots` | existing | Resolve API-local execution vs idle runner through one queue seam. |
| `AP-6 silent async failure` | existing | Replace post-listen silent/deferred delivery dependencies with explicit publisher/listener health and bounded errors. |
| `AP-9 duplicate state authority` | risk | Keep engine store canonical and label `saga_instances` as a projection. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| `F13` runtime invariants | yes | HTTP RED/GREEN, lifecycle tests, persistence/projection assertions, retry/failure behavior |
| `F19` wrapper/public surface | yes | no internal implementation imports from consumer tests; `deno doc --lint` and export checks |
| architecture boundary | yes | `deno task arch:check`; thin plugin/core ownership review |
| service overlay | yes | actual router request plus fresh scaffold/AppHost/OTEL protocol |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `docs/architecture/doctrine/debt/plugins-sagas-runtime-folder-cardinality.md` | none | Do not broaden into folder relocation. |
| Prisma saga idempotency parity debt | none | Not changed by queue delivery. |
| New debt | create only if needed | Required if Prisma projection parity or a scheduler limitation remains externally visible. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | RED | Run the new HTTP-boundary regression against the old handler composition | Timeout/no runner persistence reproduces failure before implementation |
| 2 | focused core/runtime | targeted `deno test --unstable-kv` for saga core/plugin runtime and service tests | Lifecycle, queue delivery, projection, timeout, scheduled-cascade contract pass |
| 3 | scoped static | `.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts` on the two surfaces | PASS, TS/TSX only, no ignore/lock churn |
| 4 | quality | package/plugin `quality:gate` or the narrow repo-native equivalent | PASS |
| 5 | architecture | `rtk proxy deno task arch:check` | PASS |
| 6 | JSR | `deno task doc:lint --root ... --pretty` and publish dry-run for changed public packages | PASS or explicit unchanged-surface evidence |
| 7 | Redis/Garnet protocol | fresh scaffold, real POST/GET, persisted `saga_instances`, restart, `aspire otel traces/spans` | 2xx enqueue, runner transition, read model, correlation, restart persistence |
| 8 | Deno KV protocol | separate fresh scaffold with Deno KV provider and same evidence | Same independent PASS |
| 9 | merge readiness | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS after focused protocol, once per final integration |
| 10 | hygiene | review-thread gate, `agentic:leak-check`, raw git status/diff | no unanswered thread, no run-owned leaks, no lock churn |

## Risks

- The protocol gate cannot start while #1193's unknown-owner AppHost remains active. Implementation
  and hermetic tests can proceed; the final runtime gate remains explicitly NOT_RUN until clear.
- The owner’s scheduled-cascade example may require an additional scheduler composition slice. If
  queue delivery exposes this after the first persisted transition, log significant drift and fix
  it in this PR rather than ticking the entry-point box early.

## Dependencies

- PR #1193 / branch `fix/sagas-kv-glue-registration` for generated Redis/Garnet glue.
- `@netscript/queue`, `@netscript/kv`, plugin-service router, saga core runtime/store, Aspire OTEL.
- Milestone orchestrator for integration SHA, draft→ready augment, OpenHands, and canary sequencing.

## Drift Watch

- Any need to change generated glue, queue package semantics, saga domain contracts, or Prisma schema.
- Any backend-specific delivery implementation.
- Any evidence that `saga_instances` must be the Prisma table even for the KV store mode.
- Any lifecycle helper that cannot be made honest without removal/deprecation.

