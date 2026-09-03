use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `netscript-doctrine` — `packages/cli` gates before changing framework/template code.
- `aspire` — Aspire 13.5 CLI/TS-SDK surface (`describe`, `logs`, health reports).
- `netscript-pr` — PR body/labels/milestone; no closing keyword on partial work.

# Implement brief — #1844 remaining mandate: `postgres_listener was never published`

Branch `fix/listener-readiness-diagnostics` (from `main` `5ce87fb8b`), worktree `007-leaf-1844`.
Harness: `use harness`. Skills: `netscript-harness`, `netscript-doctrine`, `aspire`, `netscript-pr`.
Generator: Codex `gpt-5.6-sol` · medium. Evaluator is a separate opposite-family session (not you).

## Situation (evidence, not assumption)

#1858 (merged) fixed the Garnet RESP framing and aligned Garnet versions. The **remaining** #1844
signature is now the dominant flake on the Postgres tier — nine hits on 2026-09-02 across seven
unrelated PRs (#1930, #1885, #1909 ×2, #1883, #1916, #1940, #1842, #1895):

```
runtime.wait.postgres — FAILED 300347ms
resource postgres health key postgres_listener was never published; readiness deadline 300s elapsed
  at verifyListenerReadiness (packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts:116)
```

Timing signature: 300 3xx ms every time, never a slow pass. The gate runs **immediately after**
`runtime.aspire-restart-after-db` ("refresh background runtimes"). The same heads pass on rerun.

Registration of the key (emitted AppHost, `generate-register-infrastructure.ts:210-223`):

```ts
builder.addHealthCheck("postgres_listener", async () => {
  const endpoint = await postgres_server.getEndpoint('tcp');
  const host = await endpoint.host();
  const port = await endpoint.port();
  return createListenerReadinessCheck({ kind: "postgres", host, port })();
});
await postgres_server.withHealthCheck("postgres_listener");
```

`verifyListenerReadiness` only inspects `healthReports[key]`; it discards the resource `state`,
`healthStatus`, sibling report keys, and any logs. So today a failure tells us nothing about *why*
the key is absent — which is exactly acceptance box 1 of #1844.

## Hypotheses to decide (do not pick one by taste)

- **H1 — the check callback never completes.** `await endpoint.host()/port()` (or the
  `createListenerReadinessCheck` socket) blocks indefinitely when the endpoint is not yet allocated
  (e.g. right after the restart), so the Aspire host never gets a first result and never publishes
  the report key. Aspire publishes `healthReports[key]` only after the first evaluation completes.
- **H2 — the resource is not `Running`** after `aspire-restart-after-db` (stuck `Starting`/`Waiting`/
  `FailedToStart`), so health checks never execute. The verifier cannot tell H1 from H2.
- **H3 — describe reads a different/old AppHost instance** after the restart (resource matched by
  base name but the instance carrying the check is not the one described).

## Slices (contract → implementation → tests; RED before GREEN)

**S1 — diagnostics at the deadline (required regardless of root cause).** When
`verifyListenerReadiness` reaches its deadline, the thrown message MUST carry a one-shot snapshot
taken *once after* the wait settles (per #1906 doctrine — no new polling): resource `state`,
`healthStatus`, the list of published `healthReports` keys with their statuses, whether the resource
was matched at all, and the last N lines of `aspire logs <resource>` if the CLI exposes it
non-interactively (verify with `aspire logs --help`; if not, say so and omit). Distinguish in the
message: "resource not Running (state=X)" vs "Running but key never published (published keys=…)".
Unit tests on the pure formatting/selection functions; no live Aspire.

**S2 — bound the emitted health check (fix for H1, ship only if H1 is credible from code).**
The emitted callback must not be able to hang: resolve the endpoint with a bounded wait and return
an explicit Unhealthy report (`data.code = 'ENDPOINT_UNALLOCATED'` or similar) instead of awaiting
forever; the socket check must already have its own bound — verify, do not assume. RED test in
`generate-register-infrastructure_test.ts` asserting the emitted text, plus a unit test of the
bounded helper. Keep the emitted helper type-checking (the #1858 lesson: an emitted-workspace type
check must be part of the local gates).

**S3 — evidence.** Push, let hosted `e2e-cli` run both tiers. Acceptance box 3 needs the Postgres
tier green **twice consecutively** at the same head with run IDs; the supervisor collects those —
do not re-fire runs yourself. Record every observation in
`.llm/runs/fix-listener-readiness-diagnostics--0.0.7/worklog.md` (drift → `drift.md`).

## Ceiling

- `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`,
  `listener-readiness-gates.ts`, their tests;
  `packages/cli/src/kernel/templates/aspire/helpers/**` (register generator, emitted
  listener-readiness helper) and their tests. Nothing in `.github/`, nothing in release tooling,
  no timeout increase anywhere (box 4 forbids it without a measured distribution).
- **No local Aspire runtime** — the runtime lease is not held. Unit/template tests only.
- Do not touch `resource-state-stream.ts` (#1909, in flight) or `listener-unreachable-fixture.ts`.

## Local gates before each push

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e/src --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/templates/aspire --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/templates/aspire/helpers/tests
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts
deno task check:aspire-version-parity   # regenerate the manifest if you add/remove files under the Aspire surface
```

## PR

Open a **draft** PR against `main`: `fix(e2e,aspire): diagnose and bound postgres listener readiness (#1844)`.
Body: `Refs #1844` (partial — the two-consecutive-green box is supervisor-collected; do NOT use a
closing keyword), Summary, Scope, Slices with SHAs, Validation with exact commands + results,
Harness run dir, Drift/Debt, Definition of Done. Labels: `type:fix area:cli area:aspire priority:p1
orchestrator:fixes status:impl ci:full gate:e2e`, milestone `0.0.7`. Report the PR number and head
SHA in your final message.
