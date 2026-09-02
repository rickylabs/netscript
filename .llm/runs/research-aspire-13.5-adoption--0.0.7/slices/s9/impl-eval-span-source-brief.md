use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `aspire` (`.agents/skills/aspire/SKILL.md`) — the 13.5.3 receipt this repair is judged against.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-eval-slot (read-only, detached at the head below)
PR #1759 (S9), head `ce1b80e2f`, base `main`.

Do not dispatch or re-run hosted runtime tiers. Static work only.

### Scope

`git diff 3ba9c414b..ce1b80e2f` — the span-source repair (`0291213af`) plus a clean merge of main
`732b1f0eb` (#1858 Garnet readiness). Evaluate the repair; the merge is mechanical.

    aspire-dashboard-telemetry.ts       | 187 ++++++++++-------
    aspire-dashboard-telemetry_test.ts  | 160 ++++++++++----

### What it fixes, and why the previous cycle passed while broken

The prior head sourced trace **spans** from the MCP `list_traces` tool. `.agents/skills/aspire/SKILL.md:365`,
written from the S9-STATIC 13.5.3 capture, states: **"There is no MCP tool for spans — use
`aspire otel spans` for span-level detail."** So every trace normalised to an empty span set and the
hosted `behavior.otel.traces` gate failed `TC-1/TC-2` — unsatisfiable by construction.

**It passed unit tests and a prior IMPL-EVAL because the test fixture invented an inline `spans`
array.** A fixture that encodes an assumption about a tool, rather than its observed output, is not
evidence. That is the specific failure mode to hunt here.

### Judge exactly this

1. **Is the span source now the CLI, completely?** `list_traces` should have zero references in the
   adapter. Confirm spans come from `aspire otel spans` and that no raw HTTP dashboard reader has
   been reintroduced.
2. **Fixture honesty — the central question.** The new tests are large (+160). Are their payloads
   derived from the documented 13.5.3 field list (`traceId`, `spanId`, `parentSpanId`, `kind`,
   `name`, `source`, `status`, `statusMessage`, `durationMs`, `attributes`) with the source named,
   or are they invented again? Would the new tests fail against the *previous* implementation? If a
   test passes against both, say so — that is the defect repeating.
3. **Grouping.** Spans must be grouped into traces by `traceId`. Verify `validateFlowB`'s requirement
   is satisfiable: a trace containing `trigger.ingress`/`trigger.detect`, `queue.enqueue`,
   `queue.dequeue` and `job.execute` must be constructible from the new path.
4. **Contract preservation.** `TelemetryQueryPort` unchanged for its three consumers;
   `findJobExecuteIdentity` still resolves the `job.execute` span whose `netscript.job.id` is
   `flow-b-callback`.
5. **Auth property retained.** The CLI authenticates itself; no API key should be handled in gate
   code, and `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS = "false"` must not be reverted.
6. State plainly what cannot be verified without a live AppHost.

Run: `deno check --unstable-kv` on changed paths; `deno test --allow-all packages/cli/e2e/tests/`.

Output STRICT JSONL, last line the verdict:
{"area":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran.
