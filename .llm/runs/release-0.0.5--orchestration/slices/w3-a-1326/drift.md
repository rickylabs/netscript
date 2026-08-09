# Drift Log: W3-A #1326 durable producer reconnect

Drift is append-only.

## 2026-08-09 — Live dispatch supersedes preparation identity

- **What:** Historical `supervisor.md` named `fix/streams-producer-reconnect-1326`, a separate
  worktree, a future canary.15 base, and Qwen evaluation.
- **Source:** Slice preparation artifact versus the inlined live dispatch.
- **Expected:** Dispatch identity is authoritative at activation.
- **Actual:** Branch is `fix/streams-durable-producer-reconnect`, worktree is this checkout, exact
  base is `aa8e151e6`, and both formal evaluators are separate Claude/Fable 5 medium sessions.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `supervisor.md`; raw `git rev-parse` results recorded in research.

## 2026-08-09 — Upstream append declaration is not its runtime behavior

- **What:** `AppendOptions` declares producer id/epoch/sequence fields, but the 0.2.6
  `DurableStream.append` runtime never emits their headers. `IdempotentProducer.onError` also lacks
  the failed payload/sequence and fires after removing the batch.
- **Source:** `deno doc` declarations and cached upstream `dist/index.js` implementation.
- **Expected:** A declared idempotent append seam might have supported package-level replay.
- **Actual:** Using it would produce a false fix or lose the failed batch.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `research.md` findings 4–7; plan D7 narrows a transport adapter over
  upstream-exported constants and verified server responses.

## 2026-08-09 — JSR helper banner false positive

- **What:** `audit-jsr-package.ts` reports one slow-type warning by counting the dry-run banner.
- **Source:** Helper output versus raw `deno publish --dry-run --allow-dirty --no-check`.
- **Expected:** Helper and raw dry-run agree.
- **Actual:** Raw dry-run has no slow-type diagnostic and exits 0; helper reports one warning.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` baseline table; `netscript-tools` makes raw output authoritative.

## 2026-08-09 — Root fitness gates omit plugin-streams-core

- **What:** `quality:scan` defaults to CLI/plugin roots, and the doctrine root list omits
  `packages/plugin-streams-core`; the aggregate `quality:gate` therefore supplies no package
  coverage for this slice. F-14 also has no implementing script.
- **Source:** PLAN-EVAL cycle 1; `.llm/tools/quality/scan-code-quality.ts`, root `deno.json`, and
  `.llm/tools/fitness/check-doctrine.ts`.
- **Expected:** Framework-law commands traverse every changed framework package.
- **Actual:** Bare aggregate exits would be vacuous evidence for this package.
- **Severity:** significant repo-tooling gap; local proof mechanism is repairable.
- **Action:** use package-scoped commands plus manual F-14 evidence marked `PENDING_SCRIPT`;
  preserve repo-wide repair as separate issue #1403.
- **Evidence:** revised `plan.md` validation rows 10–12. No tooling source is changed in this slice.

## 2026-08-09 — Owner-ratified third PLAN-EVAL cycle

- **What:** Cycle 2 found that intentionally type-broken S1 fixtures were planned under the package
  tree, making scoped and repo CI checks unsatisfiable until S2.
- **Source:** PLAN-EVAL cycle 2 and owner escalation in the supervisor thread.
- **Expected:** Two `FAIL_PLAN` cycles normally require escalation before further plan work.
- **Actual:** The threshold was reached, and the owner explicitly ratified cycle 3 on the
  evaluator-recommended fixture relocation.
- **Severity:** process exception, bounded.
- **Action:** move only the planned fixture location to the slice run dir, update direct commands,
  and preserve all confirmed contract, ordering, and gate decisions.
- **Evidence:** revised `plan.md` S1 files/evidence decision and validation rows 1b/1c; no product
  or tooling source change.

## 2026-08-09 — Scoped check wrapper owns unstable-kv

- **What:** The approved command passed `--unstable-kv` through `--deno-arg`, while
  `run-deno-check.ts` already injects that flag.
- **Source:** First S1 compile-safety run.
- **Expected:** The wrapper checks the package with KV support and no lock rewrite.
- **Actual:** The duplicated flag made Deno exit 1 before checking any file; the wrapper reported no
  diagnostics because argument parsing failed.
- **Severity:** command-only.
- **Action:** remove only the duplicate forwarded flag; retain `--deno-arg --no-lock`. The wrapper
  reports the effective command as `deno check --unstable-kv --no-lock <files>`.
- **Evidence:** raw invalid invocation exit 1; corrected wrapper exit 0 with 31 files, zero failed
  batches, zero diagnostics. Plan validation row 4 corrected.

## 2026-08-09 — S2 compatibility and reference-server test locality

- **What:** Atomic widening of `StreamProducerPort` required its in-memory implementation and tests
  to move from the planned S4 compatibility slice into S2. The real-server proof lives under
  `plugins/streams/tests/service/`, whose package already declares the server dependency, while the
  core adapter unit tests remain in `packages/plugin-streams-core`.
- **Source:** Type-safe atomic port widening and the locked no-dependency-change/lock-hygiene rule.
- **Expected:** The plan listed the memory producer under S4 and left focused test paths open.
- **Actual:** Leaving the memory producer until S4 would make S2 scoped check fail; declaring a new
  server test dependency in the core package would contradict this lane's dependency boundary.
- **Severity:** minor slice-boundary movement; no product or dependency scope expansion.
- **Action:** include compatibility implementation in S2 and keep the real-server proof with the
  existing dependency owner. S4 still runs the complete consumer/publish compatibility gates.
- **Evidence:** S2 scoped check exit 0; full core tests 26/26; reference-server test exit 0; no
  `deno.lock` or package manifest diff.

## 2026-08-09 — Real stopped-resource proxy requires a per-request timeout

- **What:** A stopped Aspire `streams` resource leaves its allocated proxy reachable while the
  backend is absent. The producer's fetch therefore remained pending and never entered the finite
  attempt/backoff loop.
- **Source:** First real S5 stopped-resource run: behavioral gate exit 1 after ten seconds with no
  backoff transition, despite the resource being positively stopped and its health endpoint
  unavailable.
- **Expected:** D2's finite retry budget bounds the whole reconnect operation.
- **Actual:** Attempt count and delay were finite, but one transport request had no duration bound.
- **Severity:** significant, in-scope runtime correctness gap exposed by the required real proof.
- **Action:** add a documented finite `requestTimeoutMs` reconnect-policy field (default five
  seconds), pass it through the transport port, and combine it with lifecycle cancellation at the
  fetch adapter. The focused probe uses 500 ms. A hanging-request adapter test now proves timeout is
  classified retryable.
- **Evidence:** real behavioral RED exit 1; transport test green; full core suite 29/29; final real
  reconnect gate exit 0.

## 2026-08-09 — Aspire 13.4 dashboard has no metric query endpoint

- **What:** The dashboard exposes JSON telemetry for traces, but `/api/telemetry/metrics` serves the
  dashboard HTML and `aspire otel` lists only logs, spans, and traces.
- **Source:** Real S5 telemetry read-back after recovery.
- **Expected:** The plan's generic telemetry query port could read both the trace and metrics from
  the dashboard.
- **Actual:** The publish trace was queryable; metrics had no Aspire 13.4 read API.
- **Severity:** evidence-mechanics narrowing; product metrics are unchanged.
- **Action:** keep the decisive trace assertion against the Aspire dashboard and insert a local
  OTLP/HTTP JSON capture-forwarder for the probe. It records the actual retry/recovery/delivered
  metric envelopes while forwarding the same payloads to Aspire's collector. No synthetic metric
  is accepted.
- **Evidence:** final gate asserts one dashboard trace id plus positive captured OTLP metric points
  for the exact stream path and producer id; exit 0.
