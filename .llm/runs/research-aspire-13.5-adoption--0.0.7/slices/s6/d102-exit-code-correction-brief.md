# S6 D-102 bounded correction: `aspire wait` exit-code contract

## Ruling (coordinator, sourced from Aspire 13.5.3 authoritative docs)

Exit 17 (`Timed out waiting for resource '<name>' to be healthy after <n>s.`) is the CORRECT exit
code for "resource stays running but remains Unhealthy through the wait timeout." Exit 18 is reserved
for a resource that enters a failed/terminal state. The D-101 synthetic listener fault intentionally
keeps the resource `Running`/`Unhealthy` — it never fails or terminates it — so the fixture's
hard-coded expectation of exit 18 in `listener-unreachable-fixture.ts` is stale, not the runtime.

## Scope of this correction (bounded)

1. In `packages/cli/e2e/src/application/gates/scaffold/runtime/listener-unreachable-fixture.ts`,
   change the `aspire wait <resource> --status healthy --timeout 10 ...` assertion to require exit
   code **17**, not 18. Keep requiring the exact diagnostic text
   (`Timed out waiting for resource '<resource>' to be healthy after <timeoutSeconds>s.`) in the
   error/receipt path so a future runtime regression that returns some other code or message still
   fails loudly, not silently.
2. Update the receipt shape/field wording (`ListenerRecoveryReceipt.waitExitCode` and any adjacent
   comments/log text) so nothing in code or docs still says "expects 18" for this timeout path.
3. Update focused tests that assert the exit-code expectation (test doubles / fixtures around this
   fixture, if any exist) to the corrected value of 17.
4. Do **not** change the health-check transition logic, the synthetic listener architecture, the
   fixed reserved ports (18998/18999), or force the resource into any failed/terminal state to make
   18 appear correct. The resource must keep running the whole time, exactly as today.
5. No PLAN-EVAL. No DeepSeek/OpenRouter rerun — this is a bounded code correction on already-reviewed
   architecture, not new design.

## Evidence this correction is grounded in

Live run at product head `3a20d00be1a6` / evidence-only `929ff72a2908` (before this correction):
baseline Healthy polls passed for both test-only keys; controller-closed the postgres synthetic
listener; the fixture's own `pollReport` correctly observed `Unhealthy` with the expected
description; real backing keys (`postgres_listener`, `garnet_resp`) stayed Healthy throughout,
confirmed via `aspire describe`, proving the real Postgres container was never touched. The only
failure was the immediately-following `aspire wait postgres --status healthy --timeout 10` step,
which returned exit 17 with the message above — exactly the documented "still running, still
Unhealthy, timed out" contract. Full raw output:
`.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s6/phase-b/postgres-single-gate.log`.
Full narrative: drift.md D-102.

## After this change

Commit the correction, run focused/unit checks for the touched files, then freeze/push. The
coordinator will run Tier-A review and an independent evaluator pass, and will then request a fresh
Postgres single-gate lease from zero (a new AppHost, new relay, exact-zero host proof before and
after — the prior lease has already been fully torn down). SQLite tier only proceeds after Postgres
is green under the corrected assertion.
