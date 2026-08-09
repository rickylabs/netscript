# Context Pack: W3-A #1326 durable producer reconnect

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326` |
| Branch         | `fix/streams-durable-producer-reconnect`        |
| Current phase  | `impl — S4 publish/consumer compatibility ready to commit` |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | none; Aspire runtime validation required        |

## Current State

PLAN-EVAL cycle 3 returned `PASS` and implementation is authorized. S1 is committed and pushed with
all eight REDs recorded separately. S2 implements the finite supervisor, exact protocol transport,
dual bounded FIFO, receipts/readiness, and distinct stop/close behavior. All eight behaviors are now
green, and a real reference-server test proves duplicate and gap semantics without adding a package
dependency. S3 now keeps one publish span and trace identity alive through retry, emits distinct
bounded metrics for every terminal outcome, and closes the exact AP-13 producer warning debt after
manual F-14 evidence. The full core suite passes 28/28.

## Completed

- All requested skills and required harness/doctrine/profile/gate references read.
- Live issue #1326 read; seven acceptance rows quoted verbatim in the plan.
- W2-B #1329 research/plan/PLAN-EVAL/runtime evidence and shipped v1 envelope read.
- Exact AP-13 and connector-convergence debt rows cited without widening.
- Upstream client/server producer protocol inspected through `deno doc` and cached primary source.
- Initial-outage desired behavior reproduced RED with raw exit 1.
- Current focused tests, full export doc lint, JSR scan, and raw package publish dry-run recorded.
- Ordered S0–S7 plan and Design checkpoint written.
- PLAN-EVAL F1–F3 repaired: classified RED mechanics, S1 port compile story, scoped fitness/F-14
  evidence, and corrected client/server header-export wording.
- PLAN-EVAL F4 repaired: type-broken negative fixtures moved in the plan from package test roots to
  the slice run dir, preserving green scoped and repo CI checks without exclusions.
- S1 contract/RED slice rebased as `d846f990e`, pushed, and reported on draft PR #1402.
- S2 focused/core tests and scoped check/lint/format are green; lock remains unchanged.
- S2 rebased as `fa0da6608`, pushed, and reported on draft PR #1402.
- S3 telemetry, package-scoped quality/doctrine, F-14, docs, and aggregate gates are green locally.
- S3 rebased as `3e9a37822`, pushed, and reported on draft PR #1402.
- S4 isolated public consumer, downstream consumers, JSR, raw/package workspace publish, and scoped
  wrappers are green; the only consumer repair is a test fake now using `MemoryStreamProducer`.
- S5 real Aspire stop/restart proof is green with FIFO receipts, one dashboard trace, and actual
  captured-forwarded OTLP metrics; rebased commit `8836491f2` is reported on PR #1402.
- S6 JSR, workspace publish, mandatory aggregates, and review-thread gate are green. The aggregate
  quality/doctrine tasks remain non-decisive because #1403 owns their missing package root.
- S7 used ledger row 59 for exactly one serialized `scaffold.runtime` run: raw exit 0,
  `passed=79 failed=0 skipped=2`; `behavior.streams.producer-reconnect` passed.
- Post-run leak and review-thread gates exit 0. No W3-A-owned resource survives; only the known
  foreign Redis remains untouched.
- Separate Claude · Fable 5 IMPL-EVAL passed. Two minor terminal-reason fidelity findings are filed
  under #1405 and intentionally remain outside this PR.
- The branch rebased cleanly onto `origin/main@3f41a3639`; the post-rebase package suite exits 0
  with 29 passed and 0 failed.
- CI `scaffold.service` exposed a W3-A-owned static type seam: the CLI coordinator imported a probe
  below a plugin tree absent from service-only smoke workspaces. #1400/#1401 are not involved.
- The seam-only repair is locally green: focused 5/5, check/lint/fmt exit 0, and exact
  `scaffold.service` passes 5/5. Producer runtime behavior is unchanged.
- New-head repo check then found the reference-server test omitted the required request timeout.
  Its four direct calls are repaired; exact root check is green over 2,680 files and 23 batches.

## In Progress

- Both CI type seams are repaired locally. The serialized runtime verdict is untouched and the
  existing IMPL-EVAL remains applicable because no product behavior changed.

## Next Steps

1. Commit and push the CI type-seam repair plus evidence.
2. Comment the raw TS2307, reporter narrowing, and exact static GREEN on PR #1402.
3. Wait for the new CI head; do not rerun the serialized runtime gate.

## Key Decisions

| Decision                               | Source       | Notes                                                             |
| -------------------------------------- | ------------ | ----------------------------------------------------------------- |
| Finite seven-state lifecycle           | plan D1      | Exhaustion is visible terminal failure, not dormant retry.        |
| 8-attempt bounded exponential policy   | plan D2      | Deterministic clock/random ports.                                 |
| Dual FIFO bounds and reject-newest     | plan D4      | 256 events + 1 MiB UTF-8 defaults.                                |
| Every write returns completion receipt | plan D5–D8   | No silent accepted-write loss; ambiguity is `delivery-unknown`.   |
| Exact tuple/body replay                | plan D7      | Narrow adapter over upstream-exported protocol constants.         |
| Stop differs from close                | plan D11     | Only acknowledged close implies remote `streamClosed`.            |
| One write span survives outage         | plan D12–D13 | Same injected trace/correlation, span open until receipt settles. |
| W2-B envelope unchanged                | plan D15     | No offset parsing or second contract.                             |

## Files Changed

| Path                    | Status  | Notes                                                                  |
| ----------------------- | ------- | ---------------------------------------------------------------------- |
| Slice `supervisor.md`   | changed | Live branch/base/evaluator identity replaces stale preparation fields. |
| Slice `research.md`     | new     | Live issue, upstream constraints, JSR scan, debt, RED.                 |
| Slice `plan.md`         | new     | Locked decisions, exact acceptance, risks, gates, ordered slices.      |
| Slice `worklog.md`      | new     | Design checkpoint and baseline evidence.                               |
| Producer application/ports/adapters | changed | Finite reconnect supervisor and exact protocol edge.             |
| Core and plugin service tests | changed | Eight behaviors plus reference-server idempotency proof.                |
| Slice artifacts         | changed | S2 gates and bounded implementation drift.                              |
| Slice `drift.md`        | new     | Preparation/upstream/audit divergences.                                |

## Gates

| Gate family | Current status                       | Evidence                                                                                   |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Static      | baseline green; reconnect RED proven | `worklog.md` gate table                                                                    |
| Fitness     | green; exact AP-13 row closed        | Decisive scoped pair and manual F-14; aggregates non-decisive under #1403.            |
| Runtime     | focused proof green                  | Exact stop/restart, FIFO receipts, one dashboard trace and captured-forwarded OTLP metrics; serialized gate still requires grant. |
| Consumer    | green                                | Isolated public types plus focused auth/sagas/workers and streams/triggers checks.    |

## Open Questions

- None that force implementation rework. PLAN-EVAL may challenge the locked defaults or adapter
  seam; any such finding returns to plan-only repair.

## Drift and Debt

- Drift: stopped-resource proxy required a finite request timeout; Aspire 13.4 has no metric query
  endpoint, so actual OTLP metric envelopes are captured and forwarded; prior drift remains.
- Debt: exact producer AP-13 row closed in S3; connector convergence remains open.

## Commits

- `d846f990e` — S1 contract and classified RED evidence.
- `fa0da6608` — S2 reconnect supervisor and focused GREEN evidence.
- `3e9a37822` — S3 correlated trace/metrics and exact AP-13 debt closure.
- `d85ef4af0` — S4 published/consumer compatibility.
- `8836491f2` — S5 focused real Aspire outage/recovery and correlated OTEL proof.
- `ead937b62` — S6 cheaper-gate closeout and serialized-token request.
- `a1d30b311` — S7 serialized runtime verdict and token release.
- `8cfbff9a8` — post-eval landing, clean rebase, and post-rebase package verdict.
- CI type-seam repair commit pending.
