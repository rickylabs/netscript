# IMPL-EVAL cycle 1: Emit and correlate saga cascade spans (#1368 / PR #1764)

Fresh native opposite-family session (Fable 5), separate from the Codex author, the fixes topic
supervisor, and both plan evaluators. Read-only over source; no `e2e:cli`, Aspire, Docker, browser,
or leased gate was run; no label, draft state, issue, or acceptance box was touched. Session and
thread identifiers are intentionally omitted.

## Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                                    |
| Target         | `packages/plugin-sagas-core`, thin `plugins/sagas` wiring, Flow-B consumer gate    |
| Archetype      | `3 - Runtime/Behavior`; `5 - Plugin Package` composition overlay                   |
| Scope overlays | runtime + telemetry + consumer proof                                               |
| Evaluator      | Fable 5 native opposite-family, medium; worktree `007-eval-1368`; 2026-08-30       |
| Evaluated head | `456e5590e3c657d07111a25df3c68fabe34b1725` (Tier-A sign-off on product `7517ae50`) |
| Base           | `f8b4f804cc5fe77054d4f220974eae66becf090c` (= `git merge-base HEAD f8b4f804`)      |
| Prior gates    | PLAN-EVAL c1 `FAIL_PLAN` `7b96c498`; PLAN-EVAL c2 `PASS_PLAN` `81c5f874`           |

### Head identity

| Check                                           | Result | Evidence                                                          |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------- |
| Local `HEAD`                                    | PASS   | `git rev-parse HEAD` = `456e5590…`                                |
| `origin/fix/saga-span-emission-and-correlation` | PASS   | `git branch -r --contains 456e5590` lists exactly that branch     |
| PR #1764 `headRefOid`                           | PASS   | `gh pr view 1764 --json headRefOid` = `456e5590…`; draft; `0.0.7` |
| Tree clean after every gate                     | PASS   | `git status --porcelain` empty after the full gate batch          |

## Verdict summary

**`FAIL_FIX`.** The product code that landed (S2–S4) is real, honest, and independently reproduces
every supervisor claim — but the evaluated head is a **mid-plan head**: slices S5 (README span
contract + Flow-B fixture/validator/unit proof) and S6 (merge-readiness gate sweep) have not landed,
the run's own `context-pack.md` says "S5 is next", the PR Definition-of-Done is entirely unchecked,
and four issue acceptance criteria cannot be evidenced from this tree. On top of that, one
**leaf-introduced behavior regression** was found and measured: the bridge now overwrites a
handler-supplied `correlationKey` on scheduled messages. The plan remains valid; the implementation
needs more work.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                                             |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | PR comment `[PHASE: PLAN-EVAL] [VERDICT: APPROVED]` `PASS_PLAN` at `81c5f874` over plan `f5994260`; first product commit `2146443c` is later in the branch history                                   |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` with Public Surface / Vocabulary / Ports / Constants / Composition Axes / Slices / Deferred / Contributor Path                                                              |
| Commit slices match design plan        | FAIL   | S1 (`d1436696`,`742d870d`,`f5994260`), S2 `2146443c`+`f8563626`, S3 `9c9d2196`, S4 `7517ae50`, sign-off `456e5590` — **S5 and S6 absent** (see F1)                                                   |
| Each landed slice has a passing gate   | PASS   | S2 red-before reproduced (below); S3/S4 check/lint/fmt/tests reproduced at head (below)                                                                                                              |
| Evaluator route as recorded            | PASS   | `supervisor.md` routes `implementation-eval` to native opposite-family Fable 5; this session is that route                                                                                           |
| Slice review gate (A1)                 | PASS   | `456e5590` is a supervisor-authored, artifact-only sign-off (`git diff --name-only 456e5590^ 456e5590` = `worklog.md` only) with independently re-derived evidence                                   |
| No speculative seams                   | PASS   | Every added method/field has a production caller: `spanContext`/`recordCompensationCascadeSize` (bridge, compensator, engine), `SAGA_RESULT_PRESENT` (engine complete span), request fields (bridge) |
| Constants used for finite vocabularies | PASS   | Runtime code references `SagaAttributes.*`, `SagaSpanNames.*`, `SagaTelemetryOutcomes.*`; no raw `'netscript.…'` literal outside `attributes.ts` in the diff                                         |

## Supervisor findings — reproduced or refuted

| Supervisor claim                                                                    | Result         | My command / evidence                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red-before `2146443c`: exit 1 · 0 passed / 2 failed · both `AssertionError`         | **Reproduced** | `git checkout --detach 2146443c` (diff vs base = the one test file + run dir only) → structured test wrapper: `exitCode:1`, `passed:0, failed:2`; failures `AssertionError: expected saga.cascade.compensate to be started` and `AssertionError: Values are not equal … undefined / "order-42"`    |
| At `7517ae50`/head: exit 0 · 9 passed / 0 failed                                    | **Reproduced** | wrapper on `saga-cascade-spans_test.ts` at `456e5590`: `exitCode:0`, `passed:9, failed:0`                                                                                                                                                                                                          |
| Original case names + assertions survive verbatim                                   | **Reproduced** | Both `'Saga runtime emits a compensation cascade span'` and `'Saga handle span carries the cross-plane correlation id'` exist at head (lines 26, 35) with `'expected saga.cascade.compensate to be started'` (l.31) and `assertEquals(…['netscript.correlation.id'], 'order-42')` (l.40) unchanged |
| Whole `packages/plugin-sagas-core`: 81 / 0 / 3 ignored                              | **Reproduced** | wrapper: `exitCode:0`, `passed:81, failed:0, ignored:3`                                                                                                                                                                                                                                            |
| Plugin targeted test: 7 / 0                                                         | **Reproduced** | wrapper on `plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts`: `passed:7, failed:0`                                                                                                                                                                                                   |
| 13 changed product paths, all within the locked 19                                  | **Reproduced** | `git diff --name-status f8b4f804...HEAD`: 6 run-dir files + 13 product paths = plan ceiling items 1–7, 9–12, 8, 15. None outside. (The brief's "only `packages/plugin-sagas-core/**`" is narrower than the plan's locked ceiling; the plan governs and is satisfied.)                              |
| `deno.lock` byte-unchanged                                                          | **Reproduced** | `git diff --exit-code f8b4f804 -- deno.lock` → exit 0                                                                                                                                                                                                                                              |
| `check:mcp-export-corpus` NONZERO at head, exit 0 at base → leaf-caused             | **Reproduced** | head: exit 1 `MCP export-surface corpus is stale`; detached checkout of `f8b4f804`: exit 0, `packageCount:35, subpathCount:270, symbolCount:7614` (exact plan baseline)                                                                                                                            |
| No new exported symbol; corpus moves via signature changes                          | **Reproduced** | `git diff f8b4f804 HEAD -- packages/plugin-sagas-core/src plugins/sagas/src \| grep -E '^[+-]export '` → empty. Moves come from fields on existing exported types/consts and new methods on `SagaInstrumentation`/`SagaCompensator`.                                                               |
| Author did not regenerate; stop-and-report is correct                               | **Confirmed**  | No generated asset in the diff; gate 16 in `plan.md` and PLAN-EVAL c2 F6 both lock stop/report. Regeneration was **not** required here — no PR CI workflow runs the corpus check (`gh pr checks`: no such job), so owner-sequenced regeneration is the right ordering.                             |
| Gate 19 (brief: "gate 18") Flow-B runtime `NOT_RUN` = boundary compliance, not pass | **Confirmed**  | `worklog.md` Runtime Gates row `NOT_RUN / author boundary`; sign-off "Not done here"; PR IMPL comment "will not be run by this author". Nowhere presented as PASS. Issue boxes 83/84 unticked.                                                                                                     |

## The questions the gates were built around

### Does every emitted span wrap real work? (F1 from PLAN-EVAL c1)

PASS. Read from the diff at head:

- `saga.cascade.complete` — **engine**, `saga-engine.ts`: started only when
  `cascaded.find(kind === 'complete')` is defined, immediately before
  `await this.#persistTransition(…)`, finished after it with `telemetryOutcomeFromStatus(status)`;
  persistence failure finishes it `ERROR` and rethrows. The bridge's `case 'complete': return;` is
  unchanged and unwrapped.
- `saga.cascade.send` / `.schedule` — **bridge** `#dispatchSend` / `#dispatchScheduled` wrap the
  real `#handleAndDispatch` / `#scheduler.scheduleCascaded` calls in `try/catch`; missing scheduler
  finishes `ERROR` (test l.110).
- `saga.cascade.spawn` — bridge `#dispatchSpawn`: error-only, `Promise.reject(notImplemented)`;
  never success (test l.177).
- `saga.cascade.compensate` — **compensator** `compensate()`: started before handler lookup;
  `skipped` + size 0 on missing handler; `success` + real `cascaded.length` after handler; `error`
  on throw; nested-deferred rejection recorded via `#recordRejectedCompensation` (test l.263).

### F1 residual — complete emits regardless of store, status is the persisted status

PASS. Emission is keyed on `completion !== undefined`, not on store presence; `#persistTransition`
early-returns storeless but the span is already open and is finished on the same path. `status` is
`resolvePersistedStatus(cascaded, loaded?.metadata.status)` — the same value written to the store —
so a `fail`+`complete` handler yields `STATUS='failed'` with outcome `error`
(`saga-engine-spans_test.ts` l.106–128 asserts exactly that), and `compensate`+`complete` yields
`compensating`. A completion span cannot report only success.

### F3b — optional request fields, no fallback precedence in the compensator

PASS. `SagaCompensationRequest` gains optional `correlationId`, `correlationKey`, `parent`,
`instrumentation`. In `compensate()` the span reads only
`request.correlationId`/`request.correlationKey`; the handler context uses `request.correlationKey`
and throws `SAGA_VALIDATION_FAILED` when absent; the base-line
`request.message.correlationKey ?? '<sagaId>:<type>'` derivation is deleted. I looked for a
recompute path and found none: `compensateCascaded`'s `execution` defaults to `{}` and spreads
through untouched; `compensateFailure` spreads `request`; `#recordRejectedCompensation` reads only
what it is handed. Tests l.198 and l.227 pin both absent-value behaviors.

### Correlation ownership (D5–D8) — downstream spans consume, never recompute

PASS for the span attributes: the engine resolves `correlationKey = resolveCorrelationKey(def, msg)`
and `correlationId = message.correlationKey ?? correlationKey` once; `SagaEngineHandleResult`
carries both plus `spanContext`; the bridge builds every `SagaCompensationRequest` from the result
and `cascadeContext(execution)` copies the fields; compensation results carry them back for the
recursive dispatch. Test l.43 uses a correlate rule (`domain-order-42`) that disagrees with the
publisher key (`order-42`) and asserts both planes on handle → compensate → send → nested handle.
**But** see F2 below: the transport of the cross-plane id _into the downstream domain message_ is
where a semantic change slipped in.

### F4 — engine-as-bus dispatch

Addressed by explicit non-scope with rationale (`plan.md` § Non-Scope, `worklog.md` § Deferred
Scope). `SagaEngine.dispatchCascaded` at head is unchanged and uninstrumented, as declared.

### Gate honesty

- Gate 15 was run in the **check-only writer form** (`generate-cli-assets-barrel.ts --check`, exit
  0), not the mutating task — confirmed both in the sign-off and by my own run; tree clean
  afterwards.
- Gate 16 stop-and-report — confirmed above.
- Gate 19 `NOT_RUN` — confirmed above.

## Static Gates (all run by this evaluator at `456e5590`)

| Gate                     | Command                                                            | Result | Evidence                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core typecheck           | `run-deno-check.ts --root packages/plugin-sagas-core --ext ts,tsx` | PASS   | exit 0                                                                                                                                                              |
| Plugin typecheck         | `run-deno-check.ts --root plugins/sagas --ext ts,tsx`              | PASS   | exit 0                                                                                                                                                              |
| Lint core / plugin       | `run-deno-lint.ts` both roots                                      | PASS   | exit 0 / exit 0                                                                                                                                                     |
| Format core / plugin     | `run-deno-fmt.ts` both roots                                       | PASS   | exit 0 / exit 0                                                                                                                                                     |
| Doc lint (gate 9)        | `deno task doc:lint --root packages/plugin-sagas-core --pretty`    | PASS   | exit 1 as baselined: `combinedPrivateTypeRef: 9, combinedMissingJSDoc: 0` — exact plan baseline                                                                     |
| Core publish (gate 10)   | `deno task --cwd packages/plugin-sagas-core publish:dry-run`       | PASS   | exit 0, `Dry run complete`                                                                                                                                          |
| Plugin publish (gate 11) | `deno task --cwd plugins/sagas publish:dry-run`                    | PASS   | exit 0, `Dry run complete`                                                                                                                                          |
| `docs:readme:check` (17) | `deno task docs:readme:check`                                      | N/A    | exit 1 on `packages/bench/README.md` only — **identical at base `f8b4f804`**, not leaf-caused; sagas-core README conformant. But the README is not yet edited (F1). |

## Fitness Gates

| Gate                | Function                            | Result   | Evidence                                                                                                                                                                      |
| ------------------- | ----------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1/F-3             | export maps / layering              | PASS     | no `deno.json` export change in diff; `deno task arch:check` exit 0, only pre-existing WARNs outside the ceiling                                                              |
| F-5                 | public surface / cardinality        | PASS     | `audit-jsr-package.ts --root packages/plugin-sagas-core` exit 0; same `19 > 12` WARN as baseline, no increase                                                                 |
| F-6/F-7             | JSR publishability / doc score      | PASS     | core audit exit 0; plugin audit exit 1 on `F-JSR-2 ./doctor.ts` — **identical at base**, pre-existing (see F6)                                                                |
| F-8/F-9             | red-before + outcome coverage       | PASS     | reproduced red-before; success/skipped/error covered for all five factories in `saga-cascade-spans_test.ts` + `saga-engine-spans_test.ts`                                     |
| F-10/F-11/F-12/F-13 | injection, finish counts, seams     | PASS     | instrumentation injected via options/request; every span path has exactly one `finishSpan`; tests assert `ended === true`                                                     |
| F-14/F-15           | thin plugin, no new deps            | PASS     | plugin diff = 5 lines wiring core `SagaInstrumentation`; lock byte-unchanged                                                                                                  |
| F-16/F-17/F-18      | Flow-B validator unit / derivatives | **FAIL** | derivative cascade ran (agent-docs-prose 0, publish-assets 0, barrel --check 0, mcp-corpus stale-as-predicted); **Flow-B validator unit proof absent — files untouched** (F1) |
| F-19                | consumer runtime                    | NOT_RUN  | supervisor-owned; boundary compliance                                                                                                                                         |
| `quality:scan`      | harness Tier-A requirement          | PASS     | exit 0, `findings: []`, 7 pre-existing allowances, none in the ceiling                                                                                                        |

## Runtime Gates

| Gate                    | Validation                           | Result  | Evidence                                                                 |
| ----------------------- | ------------------------------------ | ------- | ------------------------------------------------------------------------ |
| Flow-B consumer runtime | supervisor-leased `scaffold.runtime` | NOT_RUN | author-must-not-run; evaluator-must-not-run; recorded as such everywhere |

## Consumer Gates

| Consumer                                         | Validation                                          | Result | Evidence                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| MCP export corpus                                | `check:mcp-export-corpus` head vs base              | STOP   | head exit 1 / base exit 0 → leaf-caused, owner-sequenced regeneration (not a pass, not a waiver)                               |
| CLI assets barrel                                | `--check` writer mode                               | PASS   | exit 0                                                                                                                         |
| Agent-docs prose / publish assets                | tasks                                               | PASS   | exit 0 / exit 0                                                                                                                |
| Structural `SagaTelemetrySpan`                   | `grep 'implements SagaTelemetrySpan'` outside core  | PASS   | none outside `packages/plugin-sagas-core`; `spanContext?` is optional so external doubles keep compiling                       |
| Direct `SagaCompensator` callers                 | `grep compensateCascaded\|SagaCompensationRequest`  | PASS   | only core + tests + `plugins/sagas` re-export; no in-repo direct caller loses the deleted fallback (behavior change noted, F4) |
| Release public-surface baseline                  | `.llm/tools/release/baselines/public-surfaces.json` | STOP   | 2 sagas-core references; full-suite-only lane, expected to move, not regenerated — matches plan ceiling table                  |
| `docs/site/reference/plugin-sagas-core/index.md` | export counts                                       | N/A    | no new exported symbol, so the manually maintained counts do **not** move (drift entry's concern did not materialize)          |

## Anti-Pattern Check

| AP         | Status                | Evidence                                                                                                                                                                                                       |
| ---------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-3/AP-8  | **VIOLATION (minor)** | The cross-plane id is transported downstream by writing it into the domain `correlationKey` of nested send/scheduled messages — the two planes D5/D6 keep distinct are conflated at the message boundary (F2). |
| AP-9/AP-10 | CLEAR                 | Missing-handler, nested-deferred, unsupported-spawn, and thrown paths are observable and tested                                                                                                                |
| AP-14      | CLEAR                 | plugin wires core `SagaInstrumentation`; defines nothing                                                                                                                                                       |
| AP-20      | CLEAR                 | contracts evolved on existing subpaths, no export-map change; derivatives checked, not regenerated                                                                                                             |
| AP-24      | CLEAR                 | existing exhaustive `switch` extended in place                                                                                                                                                                 |
| AP-25      | CLEAR                 | no global telemetry side effects; `createNativeBus` resolves one instrumentation and injects it                                                                                                                |
| others     | N/A                   | outside scope                                                                                                                                                                                                  |

## Arch-Debt Delta

| Metric                | Count | Evidence                               |
| --------------------- | ----- | -------------------------------------- |
| New entries           | 0     | none required; F2 is a fix, not a debt |
| Resolved entries      | 0     |                                        |
| Deepened violations   | 0     | F-DOCT-5 `19 > 12` unchanged           |
| Unrecorded violations | 0     |                                        |

## Findings

| #  | Severity     | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                                                                                                                  | Required action                                                                                                                                                                                                                                                                                            |
| -- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 | **blocking** | **Approved scope is not complete.** S5 (package README span/attribute tables incl. spawn error-only labeling and the `NetScriptCorrelationAttributes.CORRELATION_ID` convention sentence; Flow-B `prepare-flow-b-fixture.ts` / `validate-flow-b-traces.ts` / `_test.ts`) and S6 (gates 8–12, 17, 18 recorded at the final head) have not landed. Issue acceptance boxes for the Flow-B parent-edge/shared-id assertions, the negative call-site test, and README documentation are unevidenceable; every PR DoD box is unchecked. Verdict definitions require "approved scope is complete" for `PASS`.                                                                                                                                                          | plan ceiling items 16–19 absent from `git diff --name-status f8b4f804...HEAD`; `grep -rln 'saga.cascade\|saga.handle' packages/cli` → nothing; `grep -c saga.cascade packages/plugin-sagas-core/README.md` → 0; `context-pack.md` "Next Steps: 2. In S5 …"; `worklog.md` progress log ends at S4; PR body DoD 0/7 checked | fix (land S5 + S6, then IMPL-EVAL cycle 2)                                                                                                                                                                                                                                                                 |
| F2 | **major**    | **Leaf-introduced behavior regression: the bridge overwrites a handler-supplied `correlationKey` on scheduled messages.** `withScheduledContext` uses `correlationId ? correlationId : scheduled.message.correlationKey` (parent-wins), so `schedule({ type, payload, correlationKey: 'handler-chosen' }, …)` reaches the scheduler as the _upstream_ key. Same root cause on the send path: `#dispatchSend` now stamps `correlationKey: execution?.correlationId` on the nested message (base stamped nothing), so a rule-less downstream saga's instance identity changes from `<sagaId>:<type>` to the upstream cross-plane id. That is a saga-semantics change outside D5–D8 (which keep the two planes distinct), undocumented and untested as a semantic. | Probe (job tmp, base-compatible API): at `456e5590` scheduled `correlationKey` = `upstream-42` (expected `handler-chosen`); at `f8b4f804` = `handler-chosen`. Code: `saga-bus-bridge.ts` `withScheduledContext` and `#dispatchSend`. Head test l.110 only covers the no-user-key case.                                    | fix: never override an explicitly supplied key (`scheduled.message.correlationKey ?? correlationId`) + regression test; for the send path either lock and document (plan D-row, README, test) the rule-less-downstream identity change, or transport the cross-plane id without overloading the domain key |
| F3 | minor        | Compensation handler context `traceparent` under the default (noop) instrumentation. `compensate()` now sets `traceparent: spanContext?.traceparent`; with `NOOP_SPAN` (no `spanContext`) this is `undefined`. For the `sagaCompensate` cascaded path this is **not** a regression (base was also `undefined`: the inner message carries no traceparent — measured). For the `sagaFail`/`compensateFailure` path the request message is the handled message, so base handlers received `message.traceparent` and head handlers receive `undefined` (reasoned from code, not measured).                                                                                                                                                                          | probe PROBE-2 head/base both `undefined` on cascaded path; `saga-compensator.ts` `context.traceparent`; base `f8b4f804` l.71 `traceparent: request.message.traceparent`                                                                                                                                                   | fix (one-line `?? request.message.traceparent`) or record as accepted in worklog                                                                                                                                                                                                                           |
| F4 | minor        | `SagaCompensator.compensate()` / `compensateCascaded()` now throw `SAGA_VALIDATION_FAILED` for a direct caller that supplies no `correlationKey` and has a registered handler — a breaking change on a published `./runtime` API relative to base, deliberately chosen (F3b, worklog decision) and correct for D8, but not yet surfaced to consumers.                                                                                                                                                                                                                                                                                                                                                                                                           | `saga-compensator.ts` `throw SagasError.validationFailed(...)`; no in-repo direct caller outside the bridge                                                                                                                                                                                                               | fix in S5: README row + PR-body "behavior change" line                                                                                                                                                                                                                                                     |
| F5 | minor        | Run-artifact staleness: `worklog.md` Gate Results still carry `PENDING_SCRIPT` / `NOT_RUN` for the fitness set, published surface, and generated derivatives although the sign-off section records the actual results; `context-pack.md` "In Progress: S4 commit and push" is stale after `7517ae50`.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `worklog.md` l.151–168; `context-pack.md` § In Progress                                                                                                                                                                                                                                                                   | fix during S6                                                                                                                                                                                                                                                                                              |
| F6 | info         | Two red gates are **pre-existing, not leaf-caused**: plugin JSR audit `F-JSR-2 ./doctor.ts lacks @module` and `docs:readme:check` on `packages/bench/README.md` fail identically at `f8b4f804`. Plan gate 12's "plugin equivalent … exit 0" was never true at baseline; gate 17's "exit 0" likewise.                                                                                                                                                                                                                                                                                                                                                                                                                                                            | detached `f8b4f804` runs: jsr plugin exit 1 same finding; readme check exit 1 same file                                                                                                                                                                                                                                   | record in `drift.md` (minor, accept); no product action                                                                                                                                                                                                                                                    |
| F7 | info         | `createNativeBus` with a prebuilt `native.engine` and no instrumentation option gives the bridge a fresh noop `SagaInstrumentation` distinct from the engine's. Harmless (noop) but not literally "one instance"; worth one sentence in the README composition notes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `create-saga-runtime.ts` `createNativeBus`                                                                                                                                                                                                                                                                                | none required                                                                                                                                                                                                                                                                                              |

What I could **not** reproduce: nothing the supervisor claimed failed to reproduce. What I did
**not** run: gate 19 (Flow-B runtime) and gate 18 (validator unit — the file is unchanged, so there
is nothing new to prove).

## Lessons for Promotion

| Lesson                                                                                                                                  | Pattern                                                                                       | Applies to  | Confidence |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------- | ---------- |
| Do not dispatch IMPL-EVAL on a mid-plan head; `context-pack.md` "Next Steps" naming an unlanded slice is a hard stop for the dispatcher | supervisor checks `context-pack.md` phase + slice table before requesting the final evaluator | all         | high       |
| When a telemetry id is transported through a domain field, add a "user-supplied value survives" test for every seam that writes it      | parent-wins vs user-wins precedence must be tested, not assumed                               | Archetype 3 | high       |
| Baseline every "exit 0" expectation in the plan's gate table against the actual base before locking it                                  | gate 12/17 were red at baseline; the plan promised green                                      | all         | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | **`FAIL_FIX`** (cycle 1 of 2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rationale | Plan valid and every landed slice honest (red-before by assertion, truthful span seams, F1-residual and F3b executable, correlation consumed not recomputed, ceiling and lock intact, corpus stop/report correct, gate 19 not misrepresented). But S5/S6 have not landed (F1, blocking) and the leaf introduces a measured user-key override on scheduled dispatch (F2, major). Land S5/S6 with the F2 fix and its regression test, refresh artifacts (F5), then re-dispatch IMPL-EVAL cycle 2. |
