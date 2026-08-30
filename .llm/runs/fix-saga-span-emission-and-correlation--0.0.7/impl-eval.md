# IMPL-EVAL cycle 2 (FINAL): Emit and correlate saga cascade spans (#1368 / PR #1764)

Fresh native opposite-family session (Fable 5), separate from the Codex author, the fixes topic
supervisor, and both plan evaluators. Read-only over source except this artifact; no `e2e:cli`,
Aspire, Docker, container, or leased gate was run; no label, draft state, issue, or acceptance box
was touched. Session and thread identifiers are intentionally omitted. This is the second and final
permitted cycle; the verdict is terminal.

## Metadata

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Run ID         | `fix-saga-span-emission-and-correlation--0.0.7`                                  |
| Evaluator      | Fable 5 native opposite-family, medium; worktree `007-eval-1368`; 2026-08-30     |
| Evaluated head | `22f6fa6157b736160c6c09af750e2f03489888a2` (Tier-A sign-off; product `ed270f2a`, corpus `89bfa6ca`) |
| Base           | `f8b4f804cc5fe77054d4f220974eae66becf090c`                                       |
| Prior gates    | PLAN-EVAL c1 `FAIL_PLAN` `7b96c498`; c2 `PASS_PLAN` `81c5f874`; IMPL-EVAL c1 `FAIL_FIX` `72be7d12` |
| Head identity  | local HEAD = PR #1764 `headRefOid` = `22f6fa61`; on `origin/fix/saga-span-emission-and-correlation`; draft; milestone `0.0.7` |

## Verdict summary

**`FAIL_IMPL`.** Everything the supervisor claimed reproduces, every cycle-1 finding is genuinely
resolved (F2 by a design better than either authorized option, and I measured it), the corpus
regeneration is sound, and the run artifacts are honest. But the evaluated head carries a
**leaf-caused, deterministic red test** the entire gate set missed:
`plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts` passes 2/2 at base `f8b4f804` and
fails at head (`Expected 2 to equal 1`), because the new engine-owned `saga.cascade.complete` span
invalidates that unchanged consumer test's span-cardinality pin. Root `deno task test` includes it,
PR CI is `skipping`, so merging this head turns `main` red with nothing in the pipeline to catch
it. The green-gate merge bar makes that blocking regardless of the plan's narrower gate table. The
required fix is one assertion in one out-of-ceiling file plus a rerun of the full `plugins/sagas`
suite — small, precisely scoped, coordinator-authorized.

## Cycle-1 disposition — checked, not trusted

| Cycle-1 finding | Disposition claimed | My verification |
| --- | --- | --- |
| F1 mid-plan head (S5/S6 absent) | withdrawn as stale | **Confirmed resolved.** S5 landed `8d3317a3` (README +46 lines with the five-span table, spawn error-only label, correlation convention; Flow-B fixture/validator/`_test` +333/-23), S6 `ff161a44`. Flow-B validator unit suite run by me: exit 0, 5/5. In-scope README carries the contract; all 19-ceiling items 1–12, 15–19 accounted for. |
| F2 scheduled/send correlation override | resolved by redesign | **Confirmed resolved, measured.** `withScheduledContext` is now child-wins (`scheduled.message.correlationKey ?? correlationId`); head test `bridge preserves a handler-supplied scheduled correlation key` asserts scheduled key `handler-chosen` survives publisher key `upstream-42` while the span still carries `CORRELATION_ID='upstream-42'`. `#dispatchSend` stamps nothing on the nested domain message; the id travels as `engine.handle(msg, { correlationId })` and `#handleEntry` resolves `suppliedCorrelationId ?? message.correlationKey ?? correlationKey`. AP-3/AP-8 plane conflation is genuinely cleared, not relocated: the only remaining domain-key write is the scheduled-absent-key fallback, which is exactly what cycle 1 prescribed, is locked in amended D8, and is README-documented. |
| F3 compensation `traceparent` under noop | resolved | **Confirmed resolved, measured on both paths.** Head test measures the direct `compensate()` path (`traceparent` and `tracestate` both). I additionally probed the `sagaFail`/`compensateFailure` path cycle 1 only reasoned about: under noop instrumentation the handler receives `00-ee…-ff…-01` / `vendor=failpath` from the message. Fixed by `spanContext?.traceparent ?? request.message.traceparent` + matching `tracestate`. |
| F4 `SAGA_VALIDATION_FAILED` break unsurfaced | resolved | **Confirmed.** README line 181–182 carries an explicit "**Behavior change:**" sentence; a dedicated negative test pins the throw and its span. |
| F5 stale worklog rows | resolved | **Confirmed.** Zero `PENDING_SCRIPT`; the only `NOT_RUN` rows are the truthful Flow-B lease gate. |
| F6 pre-existing red gates | drift-recorded | **Confirmed.** Two drift entries with raw base-to-head no-diff proof for `packages/bench/README.md` and `plugins/sagas/doctor.ts` (I re-verified `doctor.ts` byte-identical to base). |
| F7 `createNativeBus` note | resolved | **Confirmed.** README composition paragraph present. |

## Supervisor evidence — reproduced or refuted (all run by me at `22f6fa61`, clean tree)

| Claim | Result | My evidence |
| --- | --- | --- |
| Focused `saga-cascade-spans_test.ts` 12/0 | **Reproduced** | wrapper exit 0, 12 passed / 0 failed |
| Whole `packages/plugin-sagas-core` 84/0/3 | **Reproduced** | wrapper exit 0, 84/0/3 ignored |
| `plugins/sagas` targeted 7/0 | **Reproduced as scoped — scope insufficient** | the 7 targeted tests pass inside my full-tree run, but the full `plugins/sagas` tree is 50 passed / **1 failed** / 1 ignored (finding F-A) |
| check / lint / fmt 112 files, 0 findings | **Reproduced** | core 112 + plugin 84 files, zero findings on all six wrapper runs |
| `arch:check` exit 0 | **Reproduced** | exit 0, pre-existing WARNs only; `quality:scan` also exit 0, 7 pre-existing allowances |
| Core JSR audit exit 0, 2 WARN | **Reproduced** | `F-DOCT-5` 19>12 and `F-JSR-7` slow-types, exactly |
| Plugin JSR audit pre-existing `F-JSR-2` | **Reproduced** | same single FAIL on `./doctor.ts`; `doctor.ts` byte-identical to base |
| `publish:dry-run` core | **Reproduced** | both core and plugin: `Dry run complete`, exit 0 |
| `check:mcp-export-corpus` exit 0 | **Reproduced** | exit 0; `packageCount 35 / subpathCount 270 / symbolCount 7614` — exact plan baseline |
| `check:publish-assets` / assets-barrel `--check` | **Reproduced** | both exit 0; `git status --porcelain` empty afterwards |
| `deno.lock` byte-unchanged | **Reproduced** | `git diff --exit-code f8b4f804 22f6fa61 -- deno.lock` exit 0 |
| Ceiling 17-in-19 + corpus exception | **Reproduced** | 18 product paths; 17 = ceiling items 1–12, 15–19 (13/14 unused); 18th is the corpus carrier, touched only by `89bfa6ca` |

## The five judgments requested

### 1. Supervisor corpus regeneration — evidence SUFFICIENT

`89bfa6ca` touches exactly one file, the generated carrier. The declared non-inspection of the
base64+gzip payload does not weaken the evidence, because `check:mcp-export-corpus` **recomputes
the corpus from head sources and compares**: my own exit-0 run at `22f6fa61` proves the committed
carrier is byte-equal to the deterministic generator output of this tree — stronger than any manual
line inspection could be. Counts identical to the plan baseline prove no export was added or
removed; movement is signature-only, matching the author's stop-and-report prediction and plan
D10's owner-sequenced ordering. Sufficient.

### 2. `SagaEngine.handle` widening — backward-compatible; surfacing adequate, one JSDoc gap

Verified by a five-form typecheck probe: `handle(msg)`, `handle(msg, 3)`, `handle(msg, {attempt})`,
`handle(msg, {correlationId})`, `handle(msg, {attempt, correlationId})` all compile against the
head type. No export-map key changed; the corpus captures the new signature; the README documents
the transport semantics ("supplies the upstream cross-plane ID to the engine separately").
Method-parameter bivariance keeps structural implementors assignable. What is missing is small: the
`handle` JSDoc still reads only "Execute all handlers registered for a message type." and does not
describe the `execution` parameter's object form. Minor, non-blocking; add one JSDoc sentence
whenever this file's ceiling is next open.

### 3. Changed test literal — legitimate refinement, NOT manufactured green

Pickaxe history: the send-transport test was **added** at `bd89e523` asserting the downstream
`SAGA_CORRELATION_KEY` equals `'upstream-42'` — i.e. it pinned the very behavior cycle 1's F2
flagged as the regression (cross-plane id written into the domain plane). `4b67a14c` changed the
product to domain-key-neutral send and the assertion to `'send-correlation-transport:next'`, which
is the **pre-leaf base behavior**: at `f8b4f804`, `resolveCorrelationKey` for a rule-less, keyless
message returns `` `${definition.id}:${message.type}` ``. The same test retains
`handles[1].CORRELATION_ID === 'upstream-42'`, proving the cross-plane transport still works
out-of-band. The change strengthens the suite (it now pins restoration of base semantics instead of
pinning the regression). Nothing was weakened or removed; original S2 case names and assertions
survive verbatim.

### 4. Churn commits — net-zero verified, broader than claimed; non-blocking

`git diff 4b67a14c ed270f2a -- packages plugins` is empty (exit 0) — I checked **all** product
paths, not just the two `src` trees the supervisor named; byte-identical. `f1e7d03a` exactly
reverts `45c77a21`'s product content. The commit trail is honest (both messages truthful, the
supervisor's stale correction recorded as supervisor error #3 in the sign-off). Two extra commits
of history on a leaf PR do not block merge; if the repo squash-merges they vanish entirely. No
required action.

### 5. Flow-B consumer runtime `NOT_RUN` — cannot be merge-ready with it outstanding

The gate is truthfully recorded `NOT_RUN` everywhere (worklog, sign-off, PR) — never presented as
passing; that honesty is boundary compliance, not a defect of this leaf. But it is the REQUIRED
acceptance evidence for issue #1368's Flow-B boxes (parent-edge and shared-correlation assertions
in a real scaffolded app), and evaluator protocol rule 12's close-gate requires every `gate:` box
evidenced before `status:ready-merge`. Judgment: IMPL-EVAL of the implementation does not require
the gate, but the leaf **must not** flip to ready-merge or merge until `scaffold.runtime` Flow-B
has run green somewhere real — supervisor lease off this host, CI, or another capable host (D-42/
D-43 block this one). With PR CI `skipping`, there is currently no automatic backstop; the
coordinator owns sequencing that run before ready-merge.

## Findings

| # | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| F-A | **blocking** | **Leaf-caused red consumer test at head.** `plugins/sagas/tests/telemetry/publish-trace-linkage_test.ts` › "publishSagaMessage propagates API trace headers as saga.handle parent context" fails `Expected 2 to equal 1`: its saga handler returns a `complete` effect, so the head engine now starts `saga.cascade.complete` alongside `saga.handle`, breaking the test's `tracer.started.length === 1` cardinality pin. Deterministic; passes 2/2 at detached `f8b4f804`, fails at `22f6fa61`. Root `deno task test` (unfiltered wrapper) includes it, and PR #1764 CI jobs are `skipping`, so a merge turns `main` red with no pipeline backstop. The test is **stale relative to the approved plan** (D1/PASS_PLAN legitimize the new span; the test's purpose is trace-header propagation, and its other assertions — parent linkage, `spans[0]` identity, outcome — still hold), so this is not evidence of a product defect. But a red in-tree test fails the green-gate merge bar, and the file is **outside the 19-path ceiling**, so the author could not have fixed it without a coordinator ceiling amendment. Nobody ran the full `plugins/sagas` tree: the author's plugin gate was the 7-test targeted file, the supervisor re-derived the same scope, and the plan's "Structural span implementors" ceiling-completeness row missed this span-cardinality consumer (PLAN-EVAL c2 missed it too). | Full-tree run: 50 passed / 1 failed / 1 ignored; base run 2/2; test source ll.61–62; `deno.json` root `test` task; `gh pr checks 1764` = skipping | Coordinator amends the ceiling by one path; author updates the single cardinality assertion to count `saga.handle` spans by name (or expect the new cardinality) without touching the propagation assertions; rerun the **full** `plugins/sagas` suite plus the focused suites; supervisor re-signs. This cycle is terminal, so per protocol the loop escalates to the owner — the fix itself is a one-line test amendment. |
| F-B | minor | Plan ceiling-completeness analysis and both PLAN-EVAL cycles classified span consumers only structurally (`implements SagaTelemetrySpan`), missing behavioral span-cardinality consumers reachable through `createSagaTelemetry`. Lesson-grade process gap that produced F-A. | plan.md "Structural span implementors" row; F-A | Record as lesson (below); no separate product action beyond F-A. |
| F-C | info | `SagaEngine.handle` JSDoc does not document the widened `execution` parameter. | `saga-engine.ts` l.160 | One JSDoc sentence next time the file is open; not blocking. |

## Anti-pattern check

AP-3/AP-8: **CLEAR** (cycle-1 violation resolved; the scheduled absent-key fallback is a locked,
documented, tested D8 semantic, not silent conflation). AP-9/AP-10, AP-14, AP-20, AP-24, AP-25:
CLEAR, unchanged from cycle 1's verification, re-spot-checked at head. Arch-debt delta: 0 new / 0
resolved / 0 deepened / 0 unrecorded (F-DOCT-5 19>12 unchanged).

## Lessons for promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| A telemetry-emission leaf must run the full test tree of every workspace member inside its ceiling, not only targeted files — new spans break span-counting consumers that structural (`implements`) sweeps cannot find | ceiling-completeness must enumerate behavioral consumers (`grep` for the instrumentation factory, then run those suites) | Archetype 3/5 | high |
| A PR whose CI is `skipping` has no red-test backstop; the evaluator must run the widest cheap suite over changed members, not just the plan's gate table | evidence tables reproduce claims; evaluation must also probe what the claims never measured | all | high |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`FAIL_IMPL`** (cycle 2 of 2 — terminal; escalate to owner) |
| Rationale | Every supervisor claim reproduced; all seven cycle-1 findings genuinely resolved (F2 measured on both dispatch paths, F3 measured on both compensation paths); corpus regeneration proven byte-equal to the head generator; churn net-zero; widening backward-compatible; Flow-B honestly `NOT_RUN` and correctly gating ready-merge, not this eval. The single blocker is F-A: a deterministic, leaf-caused red test in `plugins/sagas` that would turn `main` red on merge and that no gate in the run measured. The plan remains valid; the fix is one out-of-ceiling assertion plus a full plugin-tree rerun under coordinator authorization. |
