# IMPL-EVAL — PR #1957 release hotfix, immutable head e23dc30c2 (bounded recovery evaluation)

You are the separate-session evaluator (NetScript harness, `.llm/harness/evaluator/protocol.md` and
`verdict-definitions.md`). Route: OpenRouter z-ai/glm-5.3-flash, effort xhigh. You are in a fresh
detached worktree checked out at exactly `e23dc30c2cd50807d8304e975f464306087a24c1`. Do not commit,
push, checkout, rebase, or modify any tracked file. Read-only against git; write only the two output
files named below.

## Scope — judge ONLY this five-file hotfix (plus one surface-manifest TSV row)

Diff base is main `308d99c78` (the merge of #1909). Run `git diff --stat 308d99c78..HEAD` and confirm
exactly these files changed:
- packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts
- packages/cli/e2e/src/application/gates/scaffold/runtime/verify-typed-db-phase-b.ts
- packages/cli/e2e/tests/application/gates/controlled-follower.ts (new)
- packages/cli/e2e/tests/application/gates/listener-unreachable-fixture_test.ts
- packages/cli/e2e/tests/application/gates/resource-state-stream_test.ts
- packages/cli/e2e/tests/application/builders/runtime-gates_test.ts
- .llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv (one line)

## Context you must weigh (do not re-derive)

- Canary 6 production receipt: GitHub run 33684157301, job 100427490701 — `verify-typed-db-phase-b`
  failed with `postgres did not become listener-Unhealthy; last=Healthy tcp listener ready on
  localhost:18998`, using a private `REPORT_DEADLINE_MS = 30_000` describe poll, after the preceding
  `runtime.health.listener-unreachable` gate had PASSED observing the same synthetic departure.
  Coordinator ruling: preserve the fault-injection invariant (synthetic `test_only_postgres_listener`
  MUST go Unhealthy after controller ack; real `postgres_listener` stays Healthy); the defect was the
  duplicated, shorter private deadline, not the contract.
- Required design (coordinator): subscription established via #1909 `resource-state-stream.ts`
  `watchResourceUpdates` BEFORE the synthetic listener is closed; wait for aggregate Unhealthy under
  the existing 120s test-failure ceiling; then scoped snapshot asserting the test-only report is
  Unhealthy with structured code (ECONNREFUSED|ETIMEDOUT) and the real report is Healthy; the 10s
  `db init` bounded assertion (`ASPIRE_CLI_START_TIMEOUT`) is preserved; the interim 90s polling
  reuse must NOT be present; include delayed-transition coverage beyond the old 30s boundary.
- Exact-head hosted evidence already obtained (do NOT rerun): `e2e-cli` run 33686579366 at
  e23dc30c2 — `scaffold-runtime (aspire + docker + postgres)` SUCCESS and
  `scaffold-runtime-sqlite (aspire + sqlite + garnet)` SUCCESS; `quality`, `check-test`,
  `code-quality`, `scaffold-static` SUCCESS. `close-gate` is red only because DoD boxes are unticked
  (label-gated mirror) — never raise that as a finding.
- Scope rule: test-observer only. Any change to product behaviour, the listener fault controller,
  `owned-container-log`, or #1952 prose would be a FAIL_RESCOPE finding.

## Checks (each row needs evidence: file:line or command output)

1. In `verify-typed-db-phase-b.ts`: `observeInducedListenerDeparture(appHost, expectation, async () => { commandListenerFaultController(...postgresOpen:false...) })` — the subscription is live before the close; no `REPORT_DEADLINE_MS`, `REPORT_POLL_MS`, private description regex, or `'describe',` poll remains; `WAIT_TIMEOUT_SECONDS = 10` and the `db init` bounded assertion block are unchanged versus 308d99c78; receipt records failure code, real-backing status, evidence source, departure ceiling; database parsed via `parseListenerFaultDatabase`.
2. In `listener-unreachable-fixture.ts`: `RESOURCE_TRANSITION_FAILURE_CEILING_MS = 120_000` exported; `observeInducedListenerDeparture` calls `watchResourceUpdates` before `induce()`, waits with `resourceHealthIs(update,'Unhealthy')`, attributes through `reportsAfterTransition` (structured code via `assertExpectedListenerFailure`; real backing must be Healthy), closes the subscription in `finally`; `verifyListenerFailureRecovery` flow otherwise unchanged.
3. Tests: `controlled-follower.ts` shared helper; new cases in `listener-unreachable-fixture_test.ts` cover subscribe-before-close ordering, delayed transition past the retired 30s boundary (scaled 1:1000: departure at 45 ms under a 120 ms ceiling — judge whether that scaled model is honest and clearly labelled), non-vacuous ceiling failure, real-backing continuity, structured-code requirement; `runtime-gates_test.ts` source-shape test forbids the private poll; `resource-state-stream_test.ts` only moved the helper.
4. Run exactly this and nothing broader:
   `deno test --allow-all packages/cli/e2e/tests/application/gates/ packages/cli/e2e/tests/application/builders/runtime-gates_test.ts`
   plus `deno fmt --check` and `deno lint` on the six TypeScript files. Do NOT run scaffold runtime suites, `deno task test`, `deno task check`, or anything that starts Aspire/Docker.
5. Doctrine: no `packages/*/src` product code touched; no lockfile change; no generated carrier edited.

## Output

- Write `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/hotfix-1957/evaluate.md` using
  `.llm/harness/templates/evaluate.md`: severity-ranked findings with evidence, required action per
  finding, and exactly one verdict line `VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`.
- Also write `.llm/tmp/impl-eval-1957-comment.md`: a compact (≤ 60 lines) PR-comment version with the
  same findings and the same verdict line, first line `IMPL-EVAL (separate session, OpenRouter
  z-ai/glm-5.3-flash xhigh) — head e23dc30c2`.
- Finish your final message with the single verdict line. Do not explore the wider repository.
