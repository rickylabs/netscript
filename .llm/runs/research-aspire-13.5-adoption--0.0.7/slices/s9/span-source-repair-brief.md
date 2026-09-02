use harness

## SKILL

- `netscript-harness` — RED/GREEN discipline, drift/worklog artifacts, evidence rules.
- `aspire` (`.agents/skills/aspire/SKILL.md`) — **the authority for this repair; read it first.**
- `netscript-tools` — validation wrappers.

## ROLE

Implementation slice for S9 (#1759). Worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s9`, branch
`fix/aspire-13-5-s9-skills-mcp-alignment`, head `3ba9c414b`.

Do not dispatch hosted runtime tiers. Static work only.

## THE PROVEN RED

Hosted docker tier at `3ba9c414b`: 92 passed / **1 failed** —
`behavior.otel.traces` → `Flow-B trace assertions did not converge: TC-1/TC-2 FAIL: named,
explicitly-kind-ed Flow-B spans share one trace`.

## ROOT CAUSE — and it is stated in this repo's own 13.5.3 receipt

`ec872eb69` routed telemetry through Aspire MCP and sources trace **spans** from the `list_traces`
tool, normalising each item's inline `spans` array into `scopeSpans`. But
`.agents/skills/aspire/SKILL.md:365`, written from the S9-STATIC 13.5.3 capture, says plainly:

> **There is no MCP tool for spans — use `aspire otel spans` for span-level detail.**

So `list_traces` returns no spans, every trace normalises to `scopeSpans: [{ spans: [] }]`, and
`validateFlowB` can never find a trace containing `trigger.ingress`/`trigger.detect`,
`queue.enqueue`, `queue.dequeue` and `job.execute`. TC-1/TC-2 is unsatisfiable by construction.

**Why the unit tests did not catch it, which matters as much as the defect:**
`aspire-dashboard-telemetry_test.ts` feeds a hand-written fixture whose `list_traces` payload has an
inline `spans` array. That fixture encodes an assumption about the tool rather than its observed
output, so the suite passes while the real tool returns nothing usable. **A fixture invented from an
assumption is not evidence.** Do not repeat this shape.

## REQUIRED CHANGE

Source spans from the CLI, which authenticates itself — the property the MCP route was chosen for:

    aspire otel traces --format Json --non-interactive --nologo
    aspire otel spans  --format Json --non-interactive --nologo [--trace-id <id>]

Per `SKILL.md:264-271`, pass `--dashboard-url "$DASH"` (from `aspire ps --format Json`) when needed;
the CLI handles authentication, so no API key is handled in gate code. Per `SKILL.md:246-249` a span
carries `traceId`, `spanId`, `parentSpanId`, `kind`, `name`, `source`, `status`, `statusMessage`,
`durationMs`, `attributes`.

Keep MCP for what it genuinely provides (`list_structured_logs`, `list_trace_structured_logs`).
Preserve the `TelemetryQueryPort` contract so the three consumers do not change, and keep
`findJobExecuteIdentity` semantics (`job.execute` span whose `netscript.job.id` is `flow-b-callback`,
returning correlation and trace ids). Do **not** reintroduce a raw HTTP dashboard reader, and do
**not** revert the `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS = "false"` switch.

## RED/GREEN

Write the failing test first, and make it fail for the *right* reason: a `list_traces` payload with
**no** inline spans must produce an empty span set today, and the new span source must populate it.
Group spans into traces by `traceId` yourself.

**Fixture honesty is the acceptance bar here.** Derive the shape from `SKILL.md`'s documented field
list and say so in a comment naming the source; do not invent fields. State plainly in your report
which parts you could not verify without a live AppHost — the hosted tier is the real acceptance and
it will run after you push.

## VALIDATION

- `deno check --unstable-kv` on changed paths
- `deno test --allow-all packages/cli/e2e/tests/` (report counts)
- lint/fmt on changed files

## REPORT

Commit and push; report the SHA, the RED evidence, the GREEN evidence, exact counts, and every
assumption you could not verify statically.
