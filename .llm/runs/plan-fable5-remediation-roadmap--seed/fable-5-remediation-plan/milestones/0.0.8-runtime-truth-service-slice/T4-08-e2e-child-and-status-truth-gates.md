# test(e2e): the merge-readiness gate probes API health only — background children and streams go unverified, and a saga stuck compensating is reported COMPENSATED — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-08 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:test` `area:tooling` `area:plugins` `area:telemetry` `priority:p1`
`status:triage` `gate:e2e` · **Depends on:** T4-02 (the child liveness contract this gate asserts),
T4-06 (endpoint resolution), #979 prerequisite (1)

## Summary

`scaffold.runtime` — the command whose verdict decides merge readiness — probes exactly six API
endpoints and never looks at a background child or at streams. That blind spot is the direct reason
#1325 (a trigger processor that crash-loops on every start) could ship with a fully green health
surface. The same "green wrapper over a false state" pattern exists inside the saga engine: there is
no `'compensated'` status, `'compensating'` is counted terminal, and telemetry maps `'compensating'`
to the `COMPENSATED` outcome — so an instance whose compensation merely *started* is
indistinguishable from one that finished and from one that failed. This issue makes the gate see the
children and makes the terminal status tell the truth.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §5.2 ("This is precisely why #1325 shipped"),
  §6.5, §8 ledger row 1; `research/repo-audit/observability-aspire.md` GAP-3;
  `SYNTHESIS.md` §2 "Harness/evaluation failure", §6 (T4 pack, "E2E child/span gates" — no existing
  owner).
- `.llm/tools/e2e/scaffold-e2e-test.ts:1238-1277` — `#exerciseApis()` probes, in order: workers
  `/health`, sagas `/health/live`, sagas `/health/ready`, triggers `/health`, auth `/health/live`,
  auth `/health/ready`, auth session. **No background resource appears.** Called once from `:701`.
- Streams appears exactly once in that file — `:843`, as a plugin to add
  (`{ id: 'plugin-add-streams', kind: 'stream', name: 'streams' }`). It is never health-probed.
- Children that exist and are unprobed: `workers-combined`
  (`plugins/workers/src/aspire/workers-contribution.ts:55-61`), `trigger-processor`
  (`plugins/triggers/src/aspire/triggers-contribution.ts`, registered before `:131`), and — the one
  exception — the sagas runner, which the generated AppHost does probe via a name special case
  (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:79-86`).
- Status-truth defect:
  - `packages/plugin-sagas-core/src/domain/constants.ts:18-25` —
    `SAGA_INSTANCE_STATUSES = ['pending','running','completed','failed','compensating','cancelled']`;
    there is **no** `'compensated'`.
  - `packages/plugin-sagas-core/src/runtime/saga-engine.ts:476-478` — any `compensate` cascade writes
    `'compensating'`.
  - `:489-491` — `isTerminalStatus()` counts `'compensating'` as terminal.
  - `:494-497` — `telemetryOutcomeFromStatus()` maps `'compensating'` → `SagaTelemetryOutcomes.COMPENSATED`.
  - Consumed at `:283` and `:298`.
- Owner issues in the failure chain: #1325 (the defect this blindness let ship), #1326/#1329
  (streams), #979 (gate port-resolution prerequisites), #1343 (installed-consumer smoke).

## Current surface

The merge-readiness verdict answers "did four API processes answer HTTP?" and is read as "the
generated runtime works". Background children, which are where the durable work actually happens,
contribute nothing to it; streams contributes nothing at all. On the saga side, a persisted status
of `'compensating'` is simultaneously (a) treated as final, (b) reported to telemetry as a completed
compensation, and (c) the only state available for an in-flight or failed compensation — three
different truths behind one string, none of them checked by a gate.

## Target contract

1. **Every first-party background child is probed by the gate.** The `scaffold.runtime` suite
   installs each KV-backed first-party background runtime and proves each reaches a real ready state
   as defined by T4-02's child contract — not merely that its process was spawned.
2. **Streams is health-probed.** The streams resource participates in the gate with the same
   readiness bar as the other plugins.
3. **The gate is endpoint-resolving.** Probes resolve each resource endpoint from Aspire rather than
   from fixed `127.0.0.1:<port>` addresses (#979 prerequisite), so the gate keeps working after
   T4-06.
4. **Saga terminal status is honest.** `'compensated'` is added to the status union; `'compensating'`
   becomes non-terminal; a failed compensation is distinguishable from a completed one; and
   telemetry reports `COMPENSATED` only for a compensation that finished. Persisted instances in the
   old encoding are migrated or read-compatible, with the strategy stated.
5. **The gate fails when the seam is removed.** Each new assertion has a paired negative test, per
   the run's rule that a green wrapper is not proof.

## Acceptance

- [ ] The `scaffold.runtime` suite probes every first-party background child for real readiness.
- [ ] The streams resource is health-probed by the suite.
- [ ] Gate probes resolve endpoints from Aspire rather than from hardcoded `127.0.0.1:<port>`
      addresses.
- [ ] `'compensated'` exists in the saga instance status union and `'compensating'` is no longer
      terminal.
- [ ] Telemetry reports `COMPENSATED` only for a compensation that completed.
- [ ] A failed compensation is distinguishable from a completed one in persisted state and in
      telemetry.
- [ ] Persisted instances written under the old status encoding are migrated or read-compatibly
      handled.
- [ ] A negative test proves a deliberately crash-looping background child turns the suite red.
- [ ] A negative test proves removing the streams probe turns the suite red.
- [ ] A negative test proves an instance stuck in compensation is not reported as compensated.
- [ ] `gate:` `deno task e2e:cli run scaffold.runtime --cleanup` passes with the new assertions on a
      clean scaffold.

## Boundaries

- **T4-04 owns the saga span assertions** (`saga.handle` → `saga.cascade.compensate` parent edge and
  the shared correlation id) in `validate-flow-b-traces.ts`. Do not duplicate them here; this issue
  covers child/streams readiness and the persisted-status truth.
- **#1325 owns the triggers KV-adapter fix.** This issue builds the detector that would have caught
  it; do not fix or close #1325 from here, and do not treat a green new gate as evidence #1325 is
  fixed.
- **T4-02 defines the child state vocabulary**; this issue asserts it. If T4-02 slips, the gate
  asserts process-plus-route readiness as an interim bar and says so.
- **#979 / #980** own removing pinned host ports and the docs `curl` passages; this issue only
  consumes #979's prerequisite (1).
- **#1343** owns the installed-consumer smoke against a published canary; **#1163** owns the
  milestone-run verification; **#542 / #910 / #426** are other epics' E2E gates. None are re-filed.
- **#1280** (blocked) covers backing-service health; this gate does not attempt to probe Postgres,
  Redis or Deno KV.
- Deleting `VALIDATE_TRACES_SCRIPT` and recovering its lost OTLP-endpoint assertion is adjacent
  tooling debt, not in scope.

## Docs/consumer proof

`AGENTS.md` and the CLI E2E documentation describe the suite's coverage accurately once children and
streams are included, so "the `scaffold.runtime` verdict" stops overstating what it proves. Saga
status vocabulary is documented in `docs/site/durable-workflows/sagas.md` with the distinction
between requested, in-flight, completed and failed compensation. Consumer proof: an operator reading
the saga instance list can tell a finished compensation from a stuck one without opening traces.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Probe list, streams
single-occurrence count and the `saga-engine.ts` status/telemetry line numbers re-verified against
worktree baseline `fac9e339042c`.
