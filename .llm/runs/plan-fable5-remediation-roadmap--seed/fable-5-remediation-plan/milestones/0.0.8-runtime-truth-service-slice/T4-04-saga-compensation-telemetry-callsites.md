# fix(sagas): 5 of 6 saga span factories have zero callers — compensation emits no span and deleting the saga telemetry surface keeps CI green — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-04 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:fix` `area:plugins` `area:telemetry` `priority:p1` `status:triage` ·
**Depends on:** none (T4-08 covers the child/streams legs of the same gate; the saga-span assertion
lands here)

## Summary

`plugin-sagas-core` defines six saga span factories. Exactly one — `startHandleSpan` — has a
production caller. The five cascade factories, including `saga.cascade.compensate`, are defined,
typed, attributed and never emitted, and `SagaCompensator` takes no instrumentation dependency at
all, so a compensation executes inside its parent's context invisibly. The saga attribute set also
omits `netscript.correlation.id`, the cross-seam convention every other plane emits, so saga spans
cannot join the correlation assertion the Flow-B gate already runs. No E2E gate asserts any `saga.*`
span, which is the structural reason this survived: the whole saga observability surface could be
deleted today and every gate would stay green.

## Evidence

- Corpus: `research/repo-audit/observability-aspire.md` GAP-1, GAP-2, GAP-3, GAP-4, §3 table,
  §5 items 1-3; `SYNTHESIS.md` §1.4, §6 (T4 pack, "saga-span call-sites" — no existing owner).
- `packages/plugin-sagas-core/src/telemetry/instrumentation.ts` — six factories at `:183`
  (`SagaSpanNames.HANDLE`), `:193` (`CASCADE_SEND`), `:207` (`CASCADE_SCHEDULE`), `:218`
  (`CASCADE_SPAWN`), `:229` (`CASCADE_COMPENSATE`), `:240` (`CASCADE_COMPLETE`).
- Repo-wide `grep -rn "startCascade" --include=*.ts` returns **only the five definition lines in
  that file** — no caller, no test.
- The single live caller: `packages/plugin-sagas-core/src/runtime/saga-engine.ts:274`
  (`startHandleSpan`).
- `packages/plugin-sagas-core/src/runtime/saga-compensator.ts:35-51` —
  `SagaCompensatorOptions = Readonly<{ id?: string; clock: SagaClockPort }>`; the constructor stores
  only `#clock`. No instrumentation, no span.
- `packages/plugin-sagas-core/src/telemetry/attributes.ts:28,52` — the only correlation key is
  `SAGA_CORRELATION_KEY: 'netscript.saga.correlation_key'`. The cross-seam convention
  `CORRELATION_ID: 'netscript.correlation.id'`
  (`packages/telemetry/src/domain/telemetry-convention.ts:52`) is absent from the saga plane, while
  streams, workers and triggers all emit it.
- The tracer is live, not unwired: `plugins/sagas/src/runtime/saga-supervisor.ts:199-206`
  (`withDefaultTelemetry()` → `createSagaTelemetry()`), flowing through `create-saga-runtime.ts:93,102`.
  Only the call sites are missing.
- No gate asserts a saga span:
  `packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces.ts` asserts `trigger.*`,
  `queue.*`, `job.execute`, `flow-b.callback`, `rpc.client`, `stream.subscribe` only; the saga E2E
  gates (`packages/cli/e2e/src/domain/cli-surface.ts:131-133`) are health/list/instances probes.
- Known interaction: nested cascaded compensation throws "deferred to phase 7d"
  (`saga-compensator.ts:103-107`).

## Current surface

An operator or agent debugging a failed distributed transaction sees `saga.handle` spans and then
nothing. Which steps unwound, why, and how many are unobservable in traces and must be reconstructed
from logs — precisely the expensive fallback #1197 measured agents taking. The attributes needed
(`SagaAttributes.COMPENSATION_REASON`, `COMPENSATION_CASCADE_SIZE`) already exist and are never
populated. Because no assertion covers the plane, a regression is indistinguishable from the status
quo.

## Target contract

1. **Every cascade kind emits its span at dispatch.** `send`, `schedule`, `spawn`, `compensate` and
   `complete` each start their existing factory span at the real dispatch site (the
   `SagaBusBridge` cascade path), parented to the `saga.handle` span of the message that produced
   the cascade.
2. **`SagaCompensator` is instrumented.** It accepts a `SagaInstrumentation` dependency and opens
   `saga.cascade.compensate` around the handler, populating reason and cascade size; the "no handler
   registered" outcome is recorded on the span rather than being silently dropped.
3. **Saga spans carry `netscript.correlation.id`.** The cross-seam correlation attribute is added to
   the saga attribute set alongside the existing domain-level `SAGA_CORRELATION_KEY` — the two are
   distinct keys with distinct meanings, documented as such.
4. **The gate makes the plane non-deletable.** `validate-flow-b-traces.ts` gains a saga leg
   asserting the `saga.handle` → `saga.cascade.compensate` parent edge and a single correlation id
   shared with the existing seven boundary spans.
5. **Deferred behavior stays honest.** Nested cascaded compensation continues to fail loudly; the
   span records the deferral rather than implying a traced unwind.

## Acceptance

- [ ] Each of the five cascade span factories has a production call site at its dispatch point.
- [ ] `SagaCompensator` accepts instrumentation and emits `saga.cascade.compensate` around the
      handler.
- [ ] `COMPENSATION_REASON` and `COMPENSATION_CASCADE_SIZE` are populated on emitted compensation
      spans.
- [ ] `netscript.correlation.id` is emitted on saga spans and documented as distinct from
      `netscript.saga.correlation_key`.
- [ ] The Flow-B validator asserts the `saga.handle` → `saga.cascade.compensate` parent edge.
- [ ] The Flow-B validator asserts one correlation id shared across the saga leg and the existing
      boundary spans.
- [ ] A negative test proves removing any cascade span call site turns the gate red.
- [ ] A negative test proves a compensation with no registered handler is visible in traces rather
      than silent.
- [ ] The nested-compensation deferral is recorded on the span and documented, not implied as
      supported.
- [ ] `packages/plugin-sagas-core/README.md` documents every emitted span name and its attributes.

## Boundaries

- **T4-08** owns extending the merge-readiness E2E to probe background children and streams health,
  and owns the `'compensating'`-status defect. The **saga span assertions land here**, in the Flow-B
  validator; do not duplicate them in T4-08's scope.
- **#1329** owns the stream SSE/OTEL envelope; correlation on the stream wire is its scope, not this
  one's.
- **#418 / #413 / #557** (dashboard Live Flow, `TelemetryQueryPort`, seam-event flow plane) **depend
  on** this work — a Live Flow view cannot render a compensation leg that emits no spans — but they
  do not own it and must not be re-filed here.
- **#1197 / #1090** own agent adoption measurement of the observability surface. Not this issue.
- Saga compensation *semantics* — no prior-step rollback (`saga-compensator.ts:57`), compensation
  state never persisted (`saga-bus-bridge.ts:44-52`, `:220-227`), and the asymmetric
  missing-handler failure (`saga-compensator.ts:57-68` vs `:116-120`) — are separate runtime rows
  and are **not** fixed by adding telemetry. Do not let span work be mistaken for fixing them.
- GAP-6 (`VALIDATE_TRACES_SCRIPT` dead stringified validator and its lost OTLP-endpoint assertion)
  is adjacent tooling debt, not this issue.

## Docs/consumer proof

`docs/site/observability/telemetry.md:31-32,82` currently describes a navigable saga sub-tree that
does not exist; after this work the caption becomes true and is proven by the gate rather than
softened. `packages/plugin-sagas-core/README.md` — which today contains no mention of telemetry,
tracing, spans or observability — documents the six span names. Consumer proof: on a scaffolded
project, force a saga compensation and follow `request → command → saga → compensation` in the
Aspire dashboard in one trace, with no log reading.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Zero-caller counts and
`SagaCompensatorOptions` shape re-verified against worktree baseline `fac9e339042c`.
