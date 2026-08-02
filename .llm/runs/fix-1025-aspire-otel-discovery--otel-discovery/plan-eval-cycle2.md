# PLAN-EVAL — cycle 2 (post-FAIL redirection)

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Scope: the cycle-2 direction handed to the slice in
`/home/codex/repos/.briefing/slices/1025/implement-2.md`, after the cycle-1 IMPL-EVAL returned
`FAIL` (`evaluate.md`).

## Plan-Gate checklist

| # | Check | Verdict | Evidence |
| - | - | - | - |
| 1 | Cause is established, not assumed | PASS | Cycle-1 A/B: removing only `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` moved automatic discovery from exit 12 to exit 0 (`research.md` F4, F7-F9; owner issue comment). |
| 2 | The cycle-1 FAIL is respected, not re-litigated | PASS | Brief Step 0 reverts all seven cycle-1 source edits; the direction forbids touching dashboard env vars again. |
| 3 | The rejected change was genuinely rejectable | PASS — independently re-verified | Anonymous mode is load-bearing for consumers that strip the token: `validate-flow-b-traces.ts:12-16` and `otel-gates.ts:80-98` reduce `dashboardUrl` to `.origin`; `consume-flow-b-stream.ts:94` builds an absolute `/api/telemetry/traces`; and every scaffolded app's telemetry page fetches `${baseUrl}/api/telemetry/traces` with no `Authorization` header (`assets/app/routes/examples/telemetry/(_shared)/telemetry-trace.ts.template:85-94`). |
| 4 | The replacement fix is necessary, not cosmetic | PASS | `ASPIRE_EPHEMERAL_PORT = 0` (`generate-aspire-config.ts:16`) means the dashboard URL is not deterministic, so a statically documented URL would be wrong and a runtime resolver over `aspire ps --format Json` is genuinely required. |
| 5 | The fix clears the cluster's real bar (discoverability, not file count) | PASS | Brief requires an *emitted* zero-memorisation route (generated `aspire:otel` / `aspire:export` tasks) plus the README task table; prose alone is explicitly disallowed, because prose is what already failed — the tools were named six times in shipped skills and invoked zero times. |
| 6 | Blast radius of the replacement fix is bounded | PASS | Additive workspace tasks + docs/skill text; the brief forbids changes to dashboard env vars, generated Aspire config, or security posture. |
| 7 | Scope creep is fenced | PASS | The 53-file dashboard-guidance sweep stays deferred in `drift.md`; only `docs/site/observability/how-to/add-opentelemetry.md` and the Aspire skill are in scope. |
| 8 | Regression test lands in the gate that actually runs | PASS | Brief moves the runtime assertion from `.llm/tools/e2e/scaffold-e2e-test.ts` (a diagnostic — cycle-1 finding, `.llm/tools/README.md:189`) into `packages/cli/e2e/src/application/gates/scaffold/`. |
| 9 | Acceptance mapping is honest | **PARTIAL — see below** | Issue box 1 and box 4 cannot be fully met by this plan. |
| 10 | Evaluator route | PASS | Owner waiver 2026-08-01; generator Codex/GPT, evaluator Claude/Opus, separate sessions. |

## Where this plan is weak — and it is my framing that made it so

Check 9 is the honest failure, and it is a defect in the direction *I* wrote, so I state it plainly:

- **Box 1 cannot be fully met.** It asks that `aspire otel logs|spans|traces` work "without a manual
  `--dashboard-url`", **or** that "the failure names the actual cause and prints the working
  `--dashboard-url` invocation." `aspire otel --help` exposes no environment-variable fallback for
  the dashboard URL (verified against Aspire CLI 13.4.6), and the failing message belongs to the
  Aspire CLI, which NetScript cannot rewrite. So NetScript can supply a *route* that needs no manual
  URL, but bare `aspire otel` will still fail with Aspire's flat message. Neither clause is
  literally satisfied. This is a judgement call that belongs to the owner, not to me.
- **Box 4 cannot be met here.** It requires an upstream Aspire issue to be opened and linked if the
  cause is upstream. Filing issues on an external repository is outside this lane's authority, and
  the slice is instructed not to fabricate one. The documentation half is in scope; the upstream
  half needs owner action.

Consequence, decided in advance so it is not rationalised later: boxes 1 and 4 must **not** be
ticked on the issue, the PR must carry `Refs #1025` rather than a closing keyword, and the final
report is `draft_needs_human` rather than `ready_for_merge` — even if every gate is green.

## Verdict

`PASS` — with the acceptance limitation above binding on the outcome. The plan is the correct
*engineering* response to the cycle-1 FAIL: it removes a change that would have broken the merge
gate and every scaffolded app's telemetry page, and replaces it with a bounded, additive fix aimed
at the measured defect. It is not a complete answer to the issue as written, and it must not be
reported as one.
