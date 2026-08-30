# PLAN-EVAL — fix-saga-span-emission-and-correlation--0.0.7 (cycle 2)

- Plan evaluator session: native opposite-family Fable 5 (medium), fresh session, 2026-08-30;
  separate from the Codex `gpt-5.6-sol` implementation author, from the fixes topic supervisor, and
  from the cycle-1 evaluator session. Session and thread identifiers intentionally omitted.
- Run: `fix-saga-span-emission-and-correlation--0.0.7` — PR #1764, issue #1368, **cycle 2 of 2**
  (final permitted plan cycle).
- Plan commit evaluated: `f59942604988995b7b143aaeb6b2b9dd5f6f6ad4` (revision of `742d870d` after
  cycle-1 verdict `7b96c498`), on base `origin/main @ f8b4f804`. Evaluated on branch
  `eval/plan-eval-1368-cycle-2` read-only over source; no product path was touched.
- Surface / archetype: `packages/plugin-sagas-core` (Archetype 3, Runtime/Behavior) with an
  Archetype 5 thin-plugin composition seam in `plugins/sagas`; Flow-B consumer gate in
  `packages/cli/e2e`.
- Scope overlays: runtime + telemetry + consumer proof.

## Inputs read

Cycle-1 artifact (`plan-eval.md` @ `7b96c498` on `eval/plan-eval-1368-cycle-1`) first, as
instructed. Then `gates/plan-gate.md`, `evaluator/plan-protocol.md`,
`evaluator/verdict-definitions.md`, the run's `research.md`, `plan.md`, `worklog.md` (`## Design`,
`## Handoff Notes`), `drift.md`, the PR #1764 comment trail, and the source the plan names:
`saga-engine.ts`, `saga-compensator.ts`, `saga-bus-bridge.ts`, `create-saga-runtime.ts`,
`telemetry/instrumentation.ts`, `telemetry/attributes.ts`, `domain/cascaded-message.ts`,
`public/messages.ts`, `builders/define-saga.ts`, `ports/saga-clock-port.ts`,
`plugins/sagas/src/runtime/create-durable-saga-runtime.ts`, `prepare-flow-b-fixture.ts`, the four
derivative writers, `.llm/tools/release/surface-diff.ts`, `.github/workflows/surface-diff.yml`, and
`packages/telemetry/src/attributes/saga.ts`.

Per the cycle-2 brief, presence of each cycle-1 fix is taken as confirmed by the supervisor; this
cycle judges **sufficiency**.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` § Re-baseline pins `f8b4f804`; § Factory Liveness Decision and § Correlation Ownership Decision re-derived after cycle 1. Spot-checks this cycle: `SagaCompensatorOptions` is still `{ id?, clock }`; bridge `case 'complete': return;` still holds; MCP corpus baseline re-measured (F6).   |
| Decisions locked                        | PASS   | D1–D10 (`plan.md` § Locked Decisions) each carry rationale; the cycle-1 falsities (bridge-owned `complete`, open precedence) are corrected and consistent with the tree (F1, F3).                                                                                                                          |
| Open-decision sweep                     | PASS   | Plan sweep marks five resolved and one safe-to-defer (Flow-B runtime). Evaluator sweep below finds one unflagged decision (request-field optionality, F3b) that is **not** rework-forcing — it is local to `saga-compensator.ts` and the README row — so it is recorded as major, not as an unchecked box. |
| Commit slices (< 30, gate + files each) | PASS   | Six ordered slices (`plan.md` § Commit Slices; `worklog.md` § Commit Slices) with unit, files, and proving gate. S2 is test-only and isolated by gate 2.                                                                                                                                                   |
| Risk register                           | PASS   | Eight risks with concrete mitigations; the new "handle and compensation choose different correlation IDs" row names the test that proves it (a correlate rule that disagrees with the publisher key).                                                                                                      |
| Gate set selected                       | PASS   | 21-row validation table. Gate 15 check-only form, gate 16 baseline, gate 17 `docs:readme:check` (cycle-1 F5), and gate 19 ownership verified this cycle (F6).                                                                                                                                              |
| Deferred scope explicit                 | PASS   | `plan.md` § Non-Scope now includes the engine-direct `dispatchCascaded()` path with rationale (cycle-1 F4); `worklog.md` § Deferred Scope mirrors it.                                                                                                                                                      |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` § jsr-audit Surface Scan unchanged and still current: 19 exports, publish dry-run exit 0 / 111 files, nine baseline private-type findings, zero new findings required (gates 9–12).                                                                                                          |

## Findings

Severity vocabulary: **blocking** (unchecked Plan-Gate box; would fail the plan), **major** (record
the decision in `worklog.md`/`drift.md` before the affected slice; would otherwise surface as
IMPL-EVAL `FAIL_FIX`), **minor** (note; safe to defer), **info** (verified claim, no action).

### F1 — sufficient — `saga.cascade.complete` at the engine wraps a real transition (cycle-1 F1)

- **Artifact:** `plan.md` § Factory Liveness and Ownership (row `complete`), D1, D9, Alternatives
  Rejected rows "Start every cascade span in the engine" / "Emit complete as a bridge marker", §
  Hidden Scope bullet 6; `worklog.md` § Handoff Notes ("verify option (a)").
- **Tree:** `SagaEngine.#handleEntry` (`saga-engine.ts`) derives
  `completed = cascaded.some(kind === 'complete')`, `status = resolvePersistedStatus(...)`, and
  calls `#persistTransition` — which writes `status`, `completedAt: input.completed ? now : …` and
  the transition record — **while the `saga.handle` span is still open** (it is finished only after
  persistence). So an engine-owned span around that transition measures real work, can carry
  `netscript.saga.status` and result presence (`CascadedMessage<'complete'>.result?`), and can be a
  direct child of `saga.handle` through the explicit context D7 introduces. The bridge's
  `case 'complete': return;` is correctly excluded by D9.
- **Consistency:** D1's rationale now reads "complete is a real engine persistence transition"; the
  rejected-alternative row states the engine exception explicitly; Hidden Scope forbids a synthetic
  bridge marker. D1/D9/alternatives are mutually consistent and true against the tree.
- **Residual (minor, not blocking):** two truthfulness details the plan should state so IMPL-EVAL
  does not have to infer them:
  1. `#persistTransition` early-returns when no `SagaStorePort` is configured
     (`if (!this.#store)
     return;`). The S2 composition itself is storeless. The plan should say
     the span is emitted whenever `completed` is true regardless of store presence — the completion
     _derivation_ is the engine's transition; persistence is the durable half — so a storeless
     runtime still reports the lifecycle truthfully rather than silently omitting the span.
  2. `resolvePersistedStatus` ranks `fail` > `compensate` > `complete`; a handler returning both a
     `fail` and a `complete` cascade persists `status: 'failed'` with `completed: true`. The span's
     `netscript.saga.status` should record the persisted status as-is (the plan's "records saga
     status" already implies this); the README row should not promise `completed` on this span.
- Also note `startCascadeCompleteSpan()` currently takes **no** input; giving it a typed input is an
  additive factory change inside the ceiling (`instrumentation.ts`).

### F2 — sufficient — S2 red-before is achievable with only `f8b4f804` surface (cycle-1 F2)

- **Artifact:** `plan.md` § S2 Red-Before Contract; Validation row 1; `worklog.md` § Handoff Notes.
- **Tree, every piece checked against the real types at `f8b4f804`:**
  - `SagaRuntimeNativeOptions` (`create-saga-runtime.ts`) has
    `instrumentation?: SagaInstrumentation` and `compensator?: SagaCompensator` — the exact shape
    the contract names.
  - `SagaInstrumentation` constructor takes `{ tracer?: SagaTelemetryTracer }`;
    `SagaTelemetryTracer` is a structural interface
    (`startSpan(name, { kind, attributes?, parent?, links? })`), so a recording tracer is plain
    TypeScript with no new surface.
  - `new SagaCompensator({ clock })` matches
    `SagaCompensatorOptions = { id?, clock: SagaClockPort }`; `SagaClockPort` is
    `{ id, now(), sleep() }` — trivially fakeable.
  - `defineSaga(...).compensate(eventType, handler)` exists (`define-saga.ts:183`) and populates
    `definition.compensations`, which `SagaCompensator.compensate()` looks up.
  - `sagaCompensate(message: SagaMessage | CascadedMessage)` (`public/messages.ts:98`) accepts a
    `SagaMessage`; the bridge's
    `#handleAndDispatch → #dispatchOne('compensate') → #compensate →
    compensateCascaded` path
    runs the registered handler with no instrumentation anywhere — so assertion (a) "a
    `saga.cascade.compensate` span was started" fails **by assertion**.
  - `handleAttributes()` emits exactly six keys, none `netscript.correlation.id`; `SagaMessage`
    already has `correlationKey?` for the "publish with an explicit correlation key" step — so
    assertion (b) fails **by assertion**.
  - Compile form: `deno check` (no `--unstable-kv`) of `create-saga-runtime.ts`,
    `saga-compensator.ts`, `telemetry/mod.ts`, `builders/mod.ts`, `public/messages.ts` exits 0 this
    cycle, so gate 1's command (which omits `--unstable-kv` while gate 4 includes it) cannot cause
    the compile red that gate 1 itself declares invalid.
- **Contract wording:** "compile → both reach assertion → raw exit 1, `N passed / 2 failed`, N ≥ 0;
  compile/load/crash red or zero failed tests is invalid" is the right shape and is stated in both
  `plan.md` and `worklog.md`. Tests needing new surface are correctly pushed to S3/S4.
- **Info:** the storeless composition triggers the one-time `sagas.runtime.store_missing` warning
  via `NoopLogger`; harmless and not part of the assertion.

### F3 — sufficient — correlation precedence is unambiguous; one residual decision (cycle-1 F3)

- **Artifact:** `plan.md` D5–D8, § Hidden Scope bullets 5–6, Risk Register row 5; `research.md` §
  Correlation Ownership Decision.
- **Precedence (D6):** saga key =
  `definition.correlate(message) ?? message.correlationKey ??
  '<sagaId>:<type>'` (matches the
  engine's existing `resolveCorrelationKey`); cross-plane id =
  `message.correlationKey ?? resolvedSagaKey`. Both rules are named once, with the rationale that a
  publisher-supplied join survives a domain correlate rule. Unambiguous.
- **Divergence closed (D8):** engine results and `SagaCompensationRequest` transport the two
  engine-selected values plus parent fields; "bridge and compensator never run either precedence
  rule again." Against the tree this removes the compensator's current recompute
  (`request.message.correlationKey ?? '<sagaId>:<type>'`, `saga-compensator.ts`) as the source of
  the compensation `SagaContext.correlationKey` and the span attribute. Within the composed runtime
  the compensator **cannot** diverge from the engine: the bridge builds every request from
  `SagaEngineHandleResult` (`#handleAndDispatch`) and forwards `nextRequest` for
  compensation-generated cascades (`#compensate`), and D8 makes those the only sources. The
  risk-register row commits to a test with a correlate rule that disagrees with the publisher key —
  the exact case cycle 1 raised.
- **Flow-B precondition:** Hidden Scope bullet 6 makes HTTP `correlationId` and the generated saga's
  correlate-rule payload field both equal `flowBCorrelationId`, as a fixture precondition; gate 18
  and gate 19 both require it. The fixture (`prepare-flow-b-fixture.ts:177–192`) already owns
  `flowBCorrelationId` and writes it to `.netscript/e2e/flow-b-correlation-id`, so the generated
  saga the fixture emits can be given a rule that reads the same value. Achievable.
- **F3b — major — request-field optionality and the direct-call path are unstated.** The plan says
  the `SagaCompensationRequest` signature change is "explicit" but not whether the new
  correlation/parent fields are **required** or **optional**, nor what the compensator emits when a
  caller (direct `compensate()` use, or an external `resolveCompensation` implementor) supplies
  none. Both readings are implementable, but they differ on the published contract:
  - required → every external request constructor must supply engine-selected values it cannot
    compute without re-running D6 outside core (the thing D8 forbids); `surface-diff` would classify
    the type change **major**. No external constructor exists today (`resolveCompensation` has no
    implementor outside core `src/`), so nothing breaks now, but the README must say so.
  - optional → the compensator needs a defined behaviour when absent. The D8-consistent choice is:
    emit the span with the values as supplied on the request (no fallback rule), and document that
    only bridge-dispatched compensation is guaranteed to carry engine-selected values. This is not
    rework-forcing: it touches only `saga-compensator.ts` and one README row, and the bridge path
    (production, S2, Flow-B) is fully determined either way. **Required action:** record the choice
    in `worklog.md` § Decisions (and `drift.md` if it changes the published-surface claim) **before
    S4**; recommended: optional fields, no fallback precedence in the compensator.
- **Minor:** `startCascadeCompensateSpan` requires `cascadeSize` at start, yet D3 correctly notes
  the size is known only after the handler returns. The implementation will need either an optional
  start-time input plus a typed post-hoc recorder on `SagaInstrumentation` (D5 forbids raw
  `setAttribute` from runtime code) or a start-after-handler pattern that still measures handler
  duration. Say which; both stay inside the ceiling.

### F4 — resolved — engine-as-bus `dispatchCascaded` explicitly non-scope (cycle-1 F4)

- **Artifact:** `plan.md` § Non-Scope bullet 2; `worklog.md` § Deferred Scope.
- The rationale is correct against the tree: `createNativeBus` always wraps the engine in
  `SagaBusBridge`, and `SagaEngine.dispatchCascaded` publishes `send` cascades with no originating
  handle result from which to consume the D8 values. Expanding `SagaBusPort` is rightly called a
  separate public-contract change. IMPL-EVAL should not read the missing span there as a defect.

### F5 — resolved with one addition — ceiling and gate completeness (cycle-1 F5)

- `docs:readme:check` is gate 17. ✔
- **Ceiling re-verified this cycle against everything that consumes `plugin-sagas-core`'s exported
  surface** (`grep` over `packages/`, `plugins/`, `.llm/tools/`, `docs/`, `.github/`, `deno.json`s):
  - Workspace dependents: only `plugins/sagas` (`deno.json` import graph). Its
    `create-durable-saga-runtime.ts` is in the ceiling; `otel-saga-tracer.ts` re-exports core. ✔
  - CLI assets barrel: keys only; check-only form verified non-mutating (F6). ✔
  - MCP export corpus: signatures; expected stale; stop/report (F6). ✔
  - Dependency-closure parity: `fresh|sdk|telemetry` specifiers only. ✔
  - `docs:exports-drift`: no `plugin-sagas-core` mapping. The `SagaAttributeName` at
    `check-exports-drift.ts:241` belongs to the **`@netscript/telemetry`** mapping — that package
    ships its own `SagaAttributes`/`SagaAttributeName`
    (`packages/telemetry/src/attributes/saga.ts`), not a re-export of core. ✔ (see minor note below)
  - `SagaTelemetrySpan` implementors: `OtelSagaTelemetrySpan` (in ceiling) and the two test doubles
    (in ceiling). No external implementor. ✔
  - **Newly found, not in the plan's ceiling table (minor):**
    `.llm/tools/release/baselines/public-surfaces.json`, consumed by
    `.llm/tools/release/surface-diff.ts` (`deno task surface:diff`). It snapshots the **signatures**
    of exactly the symbols this plan moves (`SagaCompensationRequest`, `SagaCompensatorOptions`,
    `SagaEngineHandleResult`, `SagaAttributesMap`, `SagaTelemetrySpan`,
    `SagaCascadeCompensateInput`). It is the analogue of the sibling leaf's parity constant. It is
    **not** a merge gate for this PR — `surface-diff.yml` runs only on release tags or PRs labeled
    `surface-diff-gate`/`ci:full`, and is declared non-blocking pending #309 — so it is a
    full-suite-only consumer. **Fix (same posture as gate 16):** add a ceiling-table row stating the
    baseline is expected to move, is not regenerated in this lane, and that the classification
    (major vs minor) follows the F3b optionality decision. No slice or gate change is needed.
  - `docs/site/reference/plugin-sagas-core/index.md` carries per-subpath export **counts** (e.g.
    `./telemetry` = 43, `./runtime` = 83). No tool checks them (`docs:accuracy`,
    `docs:contract-derivation`, and `docs:exports-drift` have no sagas-core entry). If S3 adds a new
    exported symbol (the "typed common cascade context", a complete-span input type) the counts go
    stale silently. That page is outside the ceiling; per the plan's own rule the author does
    **not** edit it — record the staleness in `drift.md` for the docs lane. Info.
- **Minor (carried from cycle 1, still open):** `@netscript/telemetry` already exports
  `NetScriptCorrelationAttributes.CORRELATION_ID = 'netscript.correlation.id'` and a parallel
  `SagaAttributes` map that lacks both `STATUS` and the new `CORRELATION_ID`. D5's local literal
  follows the streams-core precedent and needs no arch-debt entry from this leaf (the telemetry
  package is untouched), but the README should name the shared convention source in one sentence so
  the two maps are not read as competing conventions.

### F6 — info — gate honesty re-verified

- **Gate 15 (check-only barrel):** `writeOrCheckGeneratedAsset()`
  (`generate-cli-assets-barrel.ts:
  422–435`): the `--check` branch does `readTextFile` + string
  compare and throws `… is stale`; `Deno.writeTextFile` is reached only on the non-check branch.
  `--allow-run=deno` exists to pipe the rendered barrel through `deno fmt -` (stdin→stdout) for
  canonical comparison, not to write. The root `check:assets-barrel` task is genuinely mutating
  (`gen:assets-barrel && git diff
  --exit-code`), so the plan's direct `--check` invocation is the
  right non-mutating form. ✔
- **Gate 16 (`check:mcp-export-corpus`):** re-measured this cycle on the unmodified tree: exit `0`,
  `packageCount: 35`, `subpathCount: 270`, `symbolCount: 7614` — an exact match to the plan's
  baseline. The task grants no `--allow-write`. No CI workflow runs this task on PRs (only
  `agent-docs-prose` runs through `run-gate.ts` in `ci.yml`), so the expected stale result will not
  redden PR CI; the stop/report is purely supervisor sequencing, as the plan states. ✔
- **Gate 19 / `NOT_RUN`:** `REQUIRED, supervisor-coordinated, author-must-not-run` is accurate.
  `NOT_RUN` is boundary compliance, not a waiver; acceptance is held pending supervisor-owned exit-0
  evidence that must also demonstrate the correlation equality. No acceptance criterion is left
  unevidenceable pre-merge: contract/unit criteria are author-lane testable; the Flow-B edge and
  shared id are provable statically by gate 18 (`validate-flow-b-traces_test.ts`), and the runtime
  pass is obtainable pre-merge under the supervisor's lease or via the additive `e2e-cli-gate` label
  on the non-draft PR. `[post-merge]` is not the right instrument; the wording stands. ✔

### F7 — info — D1 factory liveness, per factory, final

- `send`, `scheduled`: real bridge calls with real failure modes. Live. ✔
- `compensate`: real compensator execution; D3 ownership right; D4 outcomes (`skipped` for missing
  handler with size 0, `error` for nested-defer/throw) match `saga-compensator.ts` today. ✔
- `spawn`: reachable only through structural/deserialized dispatch; ERROR-only diagnostic; the
  Factory table and README contract label it error-only. ✔
- `complete`: engine-owned around a real transition (F1). ✔
- Deletion would keep CI green only because no call-site/contract test exists; the plan's
  "absent-test false positive" characterization is correct for all five.

## Open-decision sweep (evaluator-run)

Decisions the plan did not flag:

1. **F3b** — required vs optional new fields on `SagaCompensationRequest`, and compensator behaviour
   when a direct caller supplies none. Local to `saga-compensator.ts` + README row; the production,
   S2, and Flow-B paths are fully determined by D8 either way. **Not rework-forcing** → major, not
   an unchecked box. Record before S4.

No decision was found that would force S2–S5 rework if deferred.

## Verdict

`PASS_PLAN`

(Harness verdict value: `PASS`. Cycle 2 of 2; the plan gate is cleared. Implementation may begin
with S2.)

### Conditions carried into implementation (non-blocking)

1. **F3b (major)** — before S4, record in `worklog.md` § Decisions whether the new
   `SagaCompensationRequest` fields are optional (recommended) and that the compensator applies
   **no** fallback precedence when they are absent.
2. **F1 residual (minor)** — state that `saga.cascade.complete` emits whenever `completed` is true
   regardless of store presence, and that its status attribute is the persisted status (which may be
   `failed`/`compensating` when a handler returns mixed terminal cascades).
3. **F3 minor** — say how `cascadeSize` reaches the compensation span without runtime-side raw
   `setAttribute` (typed post-hoc recorder or start-after-handler).
4. **F5 (minor)** — add `.llm/tools/release/baselines/public-surfaces.json` / `surface:diff` to the
   ceiling-completeness table as an expected-to-move, not-regenerated-here, full-suite-only
   consumer; note the stale export counts in `docs/site/reference/plugin-sagas-core/index.md` in
   `drift.md` rather than editing outside the ceiling; add the one-sentence README pointer to
   `NetScriptCorrelationAttributes.CORRELATION_ID`.

These are plan-text/worklog notes an implementer can absorb inside S3–S5 without changing any slice,
gate, owner, or ceiling path. IMPL-EVAL should check them as part of D5/D8 compliance rather than as
new scope.

## Notes

- Boundaries honoured: read-only over source; no `e2e:cli`, Aspire, Docker, or browser gate run; no
  lease requested; no label, draft, issue, or acceptance-box change. The only commands executed
  beyond reads were the non-mutating `deno task check:mcp-export-corpus` (to re-measure gate 16's
  baseline) and a `deno check` of the S2 import graph.
- Evaluator observation for the supervisor: the cycle-1 corrections landed as substantive design
  changes (engine-owned completion; single-resolution correlation transport; baseline-compatible red
  contract), not as wording patches. The sibling-leaf caution held once more — a fourth consumer of
  the exported surface (`public-surfaces.json`) exists that no plan enumerated by recall — but it is
  informational for this PR and the plan's stop/report posture already covers it.
