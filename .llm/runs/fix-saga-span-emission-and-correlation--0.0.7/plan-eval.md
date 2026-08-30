# PLAN-EVAL — fix-saga-span-emission-and-correlation--0.0.7

- Plan evaluator session: native opposite-family Fable 5 (medium), fresh session, 2026-08-30;
  separate from the Codex implementation author and from the fixes topic supervisor. Session and
  thread identifiers intentionally omitted.
- Run: `fix-saga-span-emission-and-correlation--0.0.7` — PR #1764, issue #1368, cycle 1.
- Plan commit evaluated: `742d870db1719541d60cf60287160d9e303d4f77` (revision of `d1436696`), on
  base `origin/main @ f8b4f804`. Evaluated on branch `eval/plan-eval-1368-cycle-1` read-only over
  source; no product path was touched.
- Surface / archetype: `packages/plugin-sagas-core` (Archetype 3, Runtime/Behavior) with an
  Archetype 5 thin-plugin composition seam in `plugins/sagas`; Flow-B consumer gate in
  `packages/cli/e2e`.
- Scope overlays: runtime + telemetry + consumer proof.

## Inputs read

`gates/plan-gate.md`, `evaluator/plan-protocol.md`, `evaluator/verdict-definitions.md`, the run's
`research.md`, `plan.md`, `worklog.md` (`## Design`), `drift.md`, `supervisor.md`, issue #1368, PR
#1764 body and both phase comments, `debt/arch-debt.md` (sagas entries), and the source files the
plan names. Spot-checks against the tree are cited per finding.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                             |
| --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` § Re-baseline pins `f8b4f804`, records the moved tracking ref, and re-derives the defect. Spot-check: `grep -rn "startCascade" packages plugins` outside `instrumentation.ts` returns nothing — the zero-caller claim is current. |
| Decisions locked                        | FAIL   | D1–D10 are stated with rationale, but the D1/D9 rationale for `saga.cascade.complete` is false against the tree (finding F1), and D6 leaves the cross-plane value precedence unstated (F3).                                                     |
| Open-decision sweep                     | FAIL   | The plan's sweep marks every item resolved. The evaluator-run sweep below finds two decisions the plan did not flag that would force S4/S5 rework if deferred (F1, F3), plus one gate contract that cannot be met as written (F2).              |
| Commit slices (< 30, gate + files each) | PASS   | Six slices, ordered, each with unit, files, and slice gate (`plan.md` § Commit Slices; `worklog.md` § Commit Slices). S2 is a test-only commit isolated by gate 2.                                                                              |
| Risk register                           | PASS   | Seven risks with concrete mitigations (`plan.md` § Risk Register); span double-finish, no-op context, compensation parent replacement, and generated-asset conflict are the right ones.                                                         |
| Gate set selected                       | PASS   | Fitness gates F-1…F-19 mapped to expected evidence; 20-row validation table. Gates 15/16/18 verified accurate (F6). Minor omission: `docs:readme:check` is not listed although S5 edits the package README (F5).                                |
| Deferred scope explicit                 | PASS   | `plan.md` § Non-Scope and `worklog.md` § Deferred Scope name spawn semantics, nested compensation (#1372), stream envelope (#1329), leased runtime execution, and generated assets.                                                             |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` § jsr-audit Surface Scan: 19 exports scanned, publish dry-run exit 0 / 111 files, doc-lint baseline of nine private-type findings, audit warnings recorded; plan requires zero new findings (gates 9–12).                         |

## Findings

Severity vocabulary: **blocking** (unchecked Plan-Gate box; must be fixed for `PASS`), **major**
(should be fixed in the same revision; would otherwise surface as IMPL-EVAL `FAIL_FIX`), **minor**
(note; safe to defer), **info** (verified claim, no action).

### F1 — blocking — `saga.cascade.complete` at the bridge wraps a no-op

- **Artifact:** `plan.md` D1 ("each maps to an actual bridge/compensator operation"), D9 ("bridge
  spans surround the actual send/schedule/complete/spawn switch branch"), Alternatives Rejected
  ("Start every cascade span in the engine").
- **Tree:** `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts` `#dispatchOne`:
  `case 'complete': return;`. The bridge performs no completion work. The real completion
  bookkeeping — `completed` derivation, `status: 'completed'`, `completedAt` — happens in
  `SagaEngine.#handleEntry` / `#persistTransition` (`saga-engine.ts`), which already executes inside
  the `saga.handle` span.
- **Why it matters:** A span started and finished around `return;` measures nothing and always
  reports `success`. That is precisely the "span nothing can trigger has added noise" case the
  factory-liveness probe exists to catch, and it would be published to the README table, the MCP
  corpus, and (if asserted) Flow-B — a contract that is expensive to retract. The rejection
  rationale "the engine has not performed the downstream operation" is correct for send/schedule but
  inverted for complete: for `complete`, the engine _is_ the operation owner.
- **Required fix (one of, stated in `plan.md` with rationale):**
  1. Emit `saga.cascade.complete` in the engine around the completion transition (natural direct
     child of `saga.handle`; carries `netscript.saga.status` / result presence), and amend D9 and
     the rejected-alternative row accordingly; or
  2. Keep bridge emission but define what the span records (e.g. a zero-duration completion marker
     with `result` presence) and say so in D1/D9 and the README contract; or
  3. Defer the `complete` factory explicitly (non-scope + drift entry) and reduce D1 to four. The
     plan must also state which option Flow-B and the README table document.

### F2 — blocking — S2 red-before contract cannot be red for the stated reason under the locked design

- **Artifact:** `plan.md` Validation row 1: "On unchanged `f8b4f804`: raw exit `1`; both
  compensation-emission and correlation assertions fail." `worklog.md` § Handoff Notes.
- **Tree:** `SagaCompensatorOptions` is `Readonly<{ id?: string; clock: SagaClockPort }>`
  (`saga-compensator.ts`). A test that constructs `new SagaCompensator({ clock, instrumentation })`
  — the S3/S4 design — is an excess-property type error on unmodified main. The structured test
  wrapper will then exit `1` with **0 passed / 0 failed**: red for a compile reason, not the
  behavioural reason the gate states, and indistinguishable from a broken test file.
- **Why it matters:** The whole point of S2 is a measured negative that proves the defect. A
  type-error red proves nothing about emission and would be recorded as satisfying gate 1.
- **Required fix:** State in the S2 contract that the red test uses only surface that exists on
  `f8b4f804`: a recording `SagaTelemetryTracer` injected through
  `createSagaRuntime({ native: { instrumentation, compensator: new SagaCompensator({ clock }) } })`,
  a saga whose handler returns `sagaCompensate(...)` with a registered `.compensate()` handler, then
  (a) assert a `saga.cascade.compensate` span was started — fails by assertion — and (b) assert the
  `saga.handle` span attributes contain `netscript.correlation.id` — fails by assertion. Require the
  recorded counts to be `N passed / 2 failed` with N ≥ 0 and explicitly forbid a type-check failure
  from satisfying gate 1. Any assertion that needs the new compensator option or the new
  span-context method belongs in S3/S4 tests, not S2.

### F3 — blocking — D6 leaves the cross-plane correlation value precedence open, and the compensator resolves the key differently from the engine

- **Artifact:** `plan.md` D6 ("both correlation attributes use the resolved saga correlation key as
  the current value"), `research.md` § Correlation Ownership Decision ("the resolved saga
  correlation key is the cross-plane ID fallback"), Hidden Scope bullet 5.
- **Tree:**
  - Engine: `resolveCorrelationKey()` =
    `rule.correlate(message) ?? message.correlationKey ??
    '<sagaId>:<type>'` (`saga-engine.ts`).
    The definition's correlate rule wins over the publisher-supplied key.
  - Compensator: `context.correlationKey = request.message.correlationKey ?? '<sagaId>:<type>'`
    (`saga-compensator.ts`) — it never applies the correlate rule, so today `saga.handle` and a
    compensation context can already disagree on the key for any saga with a rule.
  - Flow-B: the correlation id the validator joins on is `context.correlationId ?? context.id` from
    the trigger callback (`prepare-flow-b-fixture.ts:177-192`); the sagas HTTP publisher maps
    `correlationId → message.correlationKey` (`plugins/sagas/services/src/routers/v1-handlers.ts`);
    the scaffolded sample saga correlates by `payload.correlationId` with `message.correlationKey`
    as fallback (`embedded.generated.ts`, sample onboarding template).
- **Why it matters:** Under D6 the value of `netscript.correlation.id` on saga spans is whatever the
  saga's domain rule returns. It equals the Flow-B id only if the fixture's generated saga either
  has no rule or a rule that returns the same value the callback wrote — and only if the
  compensation span receives the engine-resolved key rather than recomputing its own. Neither is
  stated. If the generated saga keys on a business id, the runtime gate (supervisor-leased,
  expensive) fails and S4/S5 are reworked.
- **Required fix:** Lock in `plan.md`: (1) the exact value-selection rule for
  `netscript.correlation.id` on every saga span (recommended: publisher-supplied
  `message.correlationKey` when present, else the engine-resolved key — so a cross-plane id survives
  a domain correlate rule); (2) that cascade/compensation spans take the correlation values from the
  engine result / `SagaCompensationRequest` (D8) and that the compensator does not recompute them;
  (3) that the Flow-B fixture publishes the generated saga with the callback's `flowBCorrelationId`
  both as the HTTP `correlationId` and in the payload the saga correlates on, and states that
  equality as a precondition of gate 17/18.

### F4 — major — engine-as-bus `send` dispatch stays uninstrumented

- **Artifact:** `plan.md` § Scope ("Instrument send … in the bridge"), D9.
- **Tree:** `SagaEngine` implements `SagaBusPort` and has its own `dispatchCascaded()` that
  publishes `send` cascades directly (`saga-engine.ts`), bypassing the bridge. `createSagaRuntime`
  always wraps the engine in the bridge, so the production path is covered, but the engine is an
  exported public bus and tests use it standalone.
- **Required fix:** One sentence in Non-Scope or D9 declaring the engine-direct `dispatchCascaded`
  path out of scope (with the reason that the composition root always routes through the bridge), so
  IMPL-EVAL does not read the missing `saga.cascade.send` there as a defect.

### F5 — minor — ceiling and gate-set completeness

- **Ceiling verified against real consumers** (the sibling SDK leaf's three late discoveries):
  - CLI assets barrel: `.llm/tools/generate-cli-assets-barrel.ts` reads package names and
    `deno.json` export-map keys via `readPackageExportMap()`; no subpath change is planned → stays
    fresh. ✔
  - MCP export corpus: `generate-export-surface-corpus.ts` records normalized symbol signatures →
    will go stale; plan handles it as stop/report (gate 16). ✔
  - Dependency-closure parity: `dependency-closure-verifier.ts` tracks only
    `@netscript/fresh|sdk|telemetry` specifiers → unaffected by sagas-core symbols. ✔
  - `docs:exports-drift` (`check-exports-drift.ts` `AUTHORITATIVE_MAPPING`) has no
    `plugin-sagas-core` entry → unaffected. ✔
  - `plugins/sagas/src/telemetry/otel-saga-tracer.ts` re-exports core; there is no second
    `SagaTelemetrySpan` implementation outside `tests/telemetry/*` (both in the ceiling), so the
    optional span-context method breaks no implementor. ✔
- **Gap:** `docs:readme:check` (`check-readme-standard.ts`) is not in the validation table although
  S5 edits `packages/plugin-sagas-core/README.md`. Add it as a static gate.
- **Note:** `@netscript/telemetry` already exports
  `NetScriptCorrelationAttributes.CORRELATION_ID = 'netscript.correlation.id'`
  (`packages/telemetry/src/domain/telemetry-convention.ts`) and sagas-core depends on that package.
  Streams-core duplicates the literal locally, so D5's local constant follows precedent and is
  doctrine-consistent (the `SagaAttributesMap` literal type needs the literal anyway). Safe to
  defer; a README sentence naming the shared convention source would be enough.

### F6 — info — gate honesty verified

- **Gate 15 (check-only barrel):** `writeOrCheckGeneratedAsset()` with `--check` does
  `readTextFile` + string compare and throws `… is stale`; `writeTextFile` is only on the non-check
  branch. All seven outputs the task diffs are covered by the writer's seven calls. Non-mutating as
  claimed. ✔
- **Gate 16 (`check:mcp-export-corpus`):** `--check` branch never reaches `Deno.writeTextFile`
  (`generate-export-surface-corpus.ts:468-478`) and the root task grants no `--allow-write`.
  Expected-stale-with-stop/report is the honest outcome. ✔ (Baseline counts not re-measured here;
  the claim is plausible and not load-bearing for the verdict.)
- **Gate 18 / `NOT_RUN`:** `REQUIRED, supervisor-coordinated, author-must-not-run` is accurate.
  `NOT_RUN` is boundary compliance, not a waiver, because acceptance is explicitly held pending
  supervisor-owned exit-0 evidence. No acceptance criterion is left unevidenceable pre-merge:
  criteria 1–4, 7–10 are unit/contract-testable in the author lane; criteria 5–6 (the Flow-B
  validator _asserts_ the edge and the shared id) are provable statically by
  `validate-flow-b-traces_test.ts` (gate 17), while the _runtime pass_ is obtainable pre-merge
  either under the supervisor's cluster lease or via the additive `e2e-cli-gate` label on the
  non-draft PR (`.github/workflows/e2e-cli.yml` cost policy). `[post-merge]` is therefore **not**
  the right instrument; the current wording is correct.

### F7 — info — factory liveness (D1) judged per factory

- `send`, `scheduled`: real bridge operations with real failure modes (missing scheduler). Live. ✔
- `compensate`: real compensator operation; compensator ownership (D3) is right because the bridge
  cannot know cascade size or the missing-handler outcome before the handler returns. ✔ (D3's
  "direct compensator callers" is overstated — only the bridge calls it today; the plugin constructs
  but never calls it. Harmless.)
- `spawn`: reachable only through structural/deserialized dispatch (`checkout-saga-contract_test.ts`
  "dispatching a deserialized spawn effect retains the defensive rejection"). Emitting it as an
  ERROR-only span is defensible as an attempted-operation diagnostic and D2 forbids a success
  outcome. Acceptable; the README must label it `error`-only. Map `childSagaId` from
  `message.sagaId` (`cascaded-message.ts`).
- `complete`: **not live at the named seam** — see F1.

## Open-decision sweep (evaluator-run)

Decisions the plan did not flag that would force rework if deferred:

1. Where `saga.cascade.complete` is emitted and what it measures (F1) — affects S4 seam, S5 README
   table, and any Flow-B assertion.
2. Value-selection precedence for `netscript.correlation.id` and the guarantee that compensation
   spans carry the engine-resolved values (F3) — affects S3 contract, S4 compensator, S5 fixture,
   and the supervisor-leased runtime gate.

Gate contract that cannot be satisfied as written: S2 red-for-the-stated-reason (F2).

## Verdict

`FAIL_PLAN`

Cycle 1 of 2. All required fixes are plan-text corrections; no re-research is needed and the
archetype, ceiling, slice order, and gate ownership stand.

### Required fixes

1. **F1** — Decide and record the `saga.cascade.complete` seam and semantics (engine-owned
   completion span, documented marker span, or explicit deferral); correct D1/D9 and the
   rejected-alternative row to match.
2. **F2** — Rewrite the S2 contract so the red test compiles on `f8b4f804` (existing public surface
   only) and fails by assertion for both stated reasons; forbid a type-check failure from satisfying
   gate 1 and require non-zero failed-test counts.
3. **F3** — Lock the `netscript.correlation.id` value precedence, the rule that cascade and
   compensation spans consume engine-resolved correlation values rather than recomputing them, and
   the Flow-B fixture precondition that the generated saga's correlation equals the callback's
   `flowBCorrelationId`.

Recommended in the same revision: F4 (engine-direct `dispatchCascaded` non-scope sentence) and F5
(`docs:readme:check` gate row).

## Notes

- Boundaries honoured: read-only over source; no `e2e:cli`, Aspire, Docker, or browser gate run; no
  lease requested; no label, draft, issue, or acceptance-box change.
- Evaluator observation for the supervisor: the plan's derivative-writer analysis and gate ownership
  corrections from `742d870d` are sound; the remaining defects are in the telemetry contract itself,
  which is exactly what a plan gate should catch before a published surface moves.
