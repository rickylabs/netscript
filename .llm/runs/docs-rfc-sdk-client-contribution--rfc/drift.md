# Drift Log: typed SDK client contribution RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-08 — Active desktop thread is not registered in runtime-controller state

- **What:** `deno task agentic:runtime status --worktree /home/codex/repos/ns-rfc-sdk-client`
  returned `MISSING_IDENTITY`, while the launch-generated run artifact identifies this live thread,
  rollout, worktree, requested/observed route, and full-access policy.
- **Source:** `.llm/tools/agentic/runtime`; `codex-thread-ids.md`; current session context.
- **Expected:** A daemon-attached session would also be discoverable by the desired-state runtime
  controller.
- **Actual:** The thread is mobile/desktop launch-attached but not present in controller session
  state (`sessions: 0`).
- **Severity:** minor.
- **Action:** accept for this docs-only generator run. Do not repair or relaunch: the owner forbids
  a rival session and the concrete launch identity is already recorded.
- **Evidence:** runtime command exit 3 with `MISSING_IDENTITY`; thread
  `019fe242-2bd9-7ff3-8044-bd9d09585397`; rollout path in `codex-thread-ids.md`.

## 2026-08-08 — Owner-directed review route differs from default formal evaluator lane

- **What:** The brief reserves cross-RFC review for the existing Claude Fable 5 session and a final
  Qwen adversarial pass, and forbids this generator from triggering PLAN-EVAL/IMPL-EVAL.
- **Source:** owner brief.
- **Expected:** Default local formal PLAN-EVAL uses the open-model route in `lane-policy.md`.
- **Actual:** Review orchestration and route identity are explicitly delegated to the root
  orchestrator.
- **Severity:** significant process override, owner-authorized.
- **Action:** stop at `status:plan-eval`, provide exact reviewer instructions, and let the root
  orchestrator record observed evaluator identities/verdicts.
- **Evidence:** `implement.md` § Required output 5; `supervisor.md` routes table.

## 2026-08-08 — Proposed trace contribution conflicts with current span ownership

- **What:** The carried-in proposal and #1353 choose trace propagation as the second contribution,
  but the current HTTP link creates the CLIENT span inside its `fetch` callback and injects that
  span's trace context into the final request.
- **Source:** carried-in RFC-A §9; `packages/sdk/src/client/http-client-link.ts`; W3C Trace Context.
- **Expected:** A second non-auth consumer would exercise the same ratified preparation seam.
- **Actual:** Preparing `traceparent` before the client span either produces the wrong parent or is
  overwritten by transport injection.
- **Severity:** significant design drift.
- **Action:** reserve `traceparent`/`tracestate`, keep trace transport-owned, re-scope #1353 to a
  conformance proof, and use locale/`accept-language` as the non-auth contribution.
- **Evidence:** RFC “Transport ownership and oRPC alignment” and rejected-alternatives sections.

## 2026-08-08 — Proposal omitted response-cache identity for contributed context

- **What:** The proposal threads auth/trace context and allows query behavior but does not prove
  that identical procedure input under two credentials/locales cannot share existing server or
  TanStack cache entries.
- **Source:** current `query-factory.ts`, `query-key.ts`, `service-query-utils.ts`, and upstream
  TanStack query option types.
- **Expected:** End-to-end typed context would remain safe through generated query paths.
- **Actual:** Current full keys do not contain client context; blindly forwarding it permits
  cross-principal/representation reuse.
- **Severity:** significant design drift and security risk.
- **Action:** require every contribution to declare `invariant`, synchronous non-secret
  `partitioned`, or `direct-only`; omit unsafe generated query maps.
- **Evidence:** RFC “Query and generated type propagation”; `research.md` findings 5–7.

## 2026-08-08 — Current JSR/doc-lint baseline is not clean

- **What:** Repository-native audits report publish dry-run success but existing private-type-ref,
  module-tag, cardinality, and slow-type findings in packages the implementation would touch.
- **Source:** `audit-jsr-package.ts` and `run-deno-doc-lint.ts` on contracts/sdk/plugin/auth-core.
- **Expected:** A clean doc/publish baseline would let future failures be attributed directly.
- **Actual:** combined private-type refs are 9/3/15/4; plugin audit exits 1 on four existing
  module-tag failures plus cardinality warnings; all four publish dry-runs still report OK.
- **Severity:** baseline debt/evidence; not caused by this docs PR.
- **Action:** record exact baseline, forbid new regressions, and require #1350/contribution work to
  reduce or isolate private upstream refs rather than invoking the current baseline as a waiver.
- **Evidence:** `research.md` JSR section; `worklog.md` gate table.
