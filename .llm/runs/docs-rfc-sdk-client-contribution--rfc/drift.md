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

## 2026-08-08 — Root oRPC v2 audit invalidated stable-v1-shaped adapter assumptions

- **What:** The finished RFC correctly kept upstream types out of its public descriptor, but still
  described v1 `RPCLink.headers` and `.$meta<T>` too normatively and assumed link-header preparation
  naturally occurred once before retries.
- **Source:** root-requested `.llm/tmp/orpc-v2-audit-followup.md`; official oRPC releases, v1-to-v2
  migration, request-header plugin, TanStack, error docs, and `v2.0.0-beta.25` codec/retry source.
- **Expected:** A NetScript-owned extension seam should survive upstream-major changes and preserve
  one credential/context snapshot across a logical call.
- **Actual:** v2 replaces typed metadata initialization with `defineMeta` plugins; its protocol is
  incompatible with v1; direct link headers resolve during encoding and the retry plugin re-enters
  downstream per attempt. The incoming request-header plugin is optional and does not implement
  outbound contribution policy. A repository scan found 74 non-test `@orpc/*` files, confirming that
  migration is substantially broader than RFC-A.
- **Severity:** significant post-generator design drift; root-requested research amendment, not an
  evaluator verdict.
- **Action:** make upstream-major neutrality normative; specify private NetScript metadata,
  prepared-header, and transport-policy ports; require prepare-once above retry or immutable
  per-logical-call memoization; implement RFC-A against stable v1; split v2 into a separate
  RFC/spike with coordinated rollout, parity, telemetry, cache, runtime, E2E, and publish gates.
- **Evidence:** amended RFC sections “Procedure metadata,” “Internal adapter ports,” “Async context,
  retries, and cancellation,” “Transport ownership and oRPC alignment,” “Compatibility and
  migration,” and “Staged implementation plan and issue decomposition.”

## 2026-08-08 — Formal PLAN-EVAL cycle 1 found ten completeness defects

- **What:** Claude Fable 5 returned authoritative `FAIL_PLAN / CHANGES_REQUESTED` for cycle 1. The
  core contribution axis survived, but its gates and compatibility record omitted six
  implementation-forcing decisions and four evidence/board corrections (F-A1 through F-A10).
- **Source:** `plan-eval.md`, 159 lines as received at evaluator commit
  `f1a29fe1a65d59f71a59bf4b6b2a48fc49e1e86f`; SHA-256
  `0690af2a2914ad0a9118be04ccebb933af33b2bac8f3f743bc7990f8f5f38cdd`.
- **Expected:** The post-audit RFC would be decision-complete for implementation and have executable
  gates.
- **Actual:** A whole-graph zero-oRPC scan could not pass unchanged `ContractLike`; server key
  algebra and generic defaults were incomplete; retry preparation could freeze stream credentials;
  Desktop bypass and private port placement were unstated; transport retry fields leaked into the
  contribution view; the v2 GET direction/gates were incomplete; the inference proof was ignored;
  and #1350 metadata ownership needed an explicit stage split.
- **Severity:** authoritative formal evaluator failure, cycle 1 of 2. This supersedes any earlier
  generator readiness self-audit; it does not overturn the extension-axis design.
- **Action:** scope zero-upstream inspection to named new RFC-A/generated declaration nodes under a
  non-growing #1350/#1278 baseline; specify exact default 3-tuple/partitioned 5-tuple algebra across
  six server/cache surfaces and recursive TanStack wrapping; default every widened generic; make
  iterator reconnect a fresh preparation epoch; reject HTTP contributions on Desktop; locate and
  negatively test the private ports; expose only contribution-declared context plus signal; correct
  the v2 preserve-GET/retire-GET fork and complete its gates; commit a real-surface 16/17 fixture;
  and split #1350 Stage 1a from metadata Stage 1b ownership.
- **Evidence:** revised RFC sections “Internal adapter ports,” “Tuple type algebra,” “Query and
  generated type propagation,” “Server key algebra and compatibility,” “Async context, retries, and
  cancellation,” “Desktop transport boundary,” “Boundaries reserved for the v2 migration,”
  “Compatibility and migration,” and “Conformance and fitness gates”; committed fixture
  `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`; remediation tables in
  `research.md` and `worklog.md`.
