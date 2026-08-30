# S10 Phase-B cycle 2 — nullable `healthReports[].status` (same thread, same branch)

Same rules as cycle 1 (thread `01a052a5-21d9-7d80-b4b1-c267be7e112a`, branch
`test/aspire-13-5-s10-e2e-gate-upgrades` @ `73b37ac8`): no evaluators, no runtime, no CI dispatch,
explicit-refspec push, focused gates only, no PLAN-EVAL.

## Evidence

Hosted proof run 33327294781 (sha `6e6163a21` = your `73b37ac8` on the combined head): both
runtime tiers pass 36 gates, then `runtime.aspire-start` fails in your parser with
`… has no string status` — postgres job on the web `/health` check, sqlite job on the
`workers-api` check. Early follow lines carry `healthReports` entries whose `status` is
**omitted/null** until the first check completes. Official 13.5.3
`ResourceHealthReportJson.Status` is nullable.

**Real capture (use it as the fixture source, do not hand-write shapes):**
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/receipts/preflight-topology-181223Z/03-describe-follow.ndjson`
— 18 lines from a real 13.5.3 `aspire describe --follow --format Json` stream on this host; line 1
has `"healthReports":{"postgres_check":{},"preflight-topology-db_check":{}}` and later lines carry
`"status":"Healthy"` for the same reports. Copy it (redact nothing but the `dashboardUrl` host/port
if you wish) as `fixtures/aspire-describe-follow-13.5.3-capture.ndjson` and keep your DTO-derived
fixture only if a test still needs it.

## Required change (bounded)

1. `healthReports` entry parsing: a report object with **missing or `null` `status`** parses as
   pending (`status: 'Unknown'` or an explicit pending marker — pick one and name it in the type).
   Keep fail-closed: a non-object report, or a non-null non-string `status`, still throws with the
   precise line/resource/report name.
2. `evaluateDescribeFollow`: a pending report means "not converged yet" → the existing retryable
   did-not-converge path; a later line's `Healthy` for the same resource/report replaces it
   (last-seen wins, already your semantics).
3. Tests in `aspire-structured-evidence_test.ts`: RED first with the real capture — (a) early
   empty-report line alone → not converged, no throw; (b) full capture → postgres converges Healthy;
   (c) `"status": 7` and `"postgres_check": "x"` → precise throws.
4. Gates: `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts --ext ts,tsx` on
   `packages/cli/e2e`, `run-deno-test.ts -- --allow-all` on the evidence test file. Commit with
   the run id and the Aspire DTO reference; push `HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`;
   report the new head SHA and exit codes.
