use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-eval-slot (read-only, detached at the head below)
PR #1759 (S9), branch `fix/aspire-13-5-s9-skills-mcp-alignment`, head `3ba9c414b`, base `main`.

**Do not dispatch or re-run the hosted runtime tiers** — they are executing on this exact head now.
Static work only: `deno check --unstable-kv`, targeted `deno test`, lint/fmt on changed paths.

### Scope: two commits

**1. `ec872eb69` — the authenticated-telemetry repair (the substance).**

    aspire-dashboard-telemetry.ts       | 346 +++++++++-------
    otel-gates.ts                       | 254 +--------
    consume-flow-b-stream.ts            |  62 +---
    aspire-mcp/entry-point.ts           |  32 ++
    aspire-mcp-smoke.ts                 |  18 +-
    aspire-dashboard-telemetry_test.ts  | 158 ++++----
    dashboard-traces-url_test.ts        |  31 --
                                          455 insertions(+), 519 deletions(-)

Why it exists: this branch sets `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS = "false"` (commit
`cdd347475`) because anonymous mode suppresses the dashboard API key Aspire MCP requires. That is
correct and must stay. The consequence was that every raw HTTP telemetry reader lost its credential,
producing two failures that look different but share one cause — sqlite `HTTP 401` in
`behavior.otel.stream-consumer`, docker `trace ids=[none]` in `behavior.live-db-endpoint`. The repair
routes the shared `createLiveAspireTelemetryQuery` adapter through the existing MCP stdio transport
(`list_traces`, `list_structured_logs`, `list_trace_structured_logs`) and folds
`consume-flow-b-stream.ts`'s private reader onto it.

**2. `3ba9c414b` — the restack onto `main 77ad823dc`.** Seven conflicts; see the commit message for
the resolution of each.

### Judge exactly this

1. **Does the adapter actually authenticate, or does it just move the failure?** The MCP stdio
   transport authenticates via the CLI subprocess. Confirm no raw HTTP dashboard reader survives
   anywhere in `packages/cli/e2e/src` — the claim is that this removes the last one.
2. **Test honesty.** `aspire-dashboard-telemetry_test.ts` changed heavily and
   `dashboard-traces-url_test.ts` was deleted. Was the deletion correct (its subject — token
   preservation through URL construction — no longer exists), and do the remaining tests assert real
   adapter behaviour against realistic `list_traces` output rather than their own mock's shape?
3. **Contract preservation.** Three gates consume the adapter (`verify-live-db-endpoint.ts`,
   `validate-flow-b-traces.ts`, `verify-producer-reconnect.ts`). Did the `TelemetryQueryPort` contract
   survive so they did not need reshaping? Does `findJobExecuteIdentity` still find the `job.execute`
   span whose `netscript.job.id` is `flow-b-callback` and return its correlation and trace ids?
4. **Restack correctness — the highest-risk resolution.** The argument-contract conflict was resolved
   to S9's side: `args[0]=appHost, [1]=projectRoot, [2]=configPath, [3]=database`. Verify the script
   and its caller in `runtime-gates.ts` agree, because a mismatch here fails at runtime, not at
   compile time.
5. **`.agents/skills/aspire/SKILL.md`** was merged by hand: S9's 333-line rewrite plus #1907's
   "Observing resource state" section. Confirm nothing was dropped from either side and there are no
   duplicated headings.

### Validation to run

- `deno check --unstable-kv` on changed `packages/cli/e2e` paths
- `deno test --allow-all packages/cli/e2e/tests/` (report counts)

Output STRICT JSONL, last line the verdict:
{"area":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran.
