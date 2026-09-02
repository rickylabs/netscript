use harness

## SKILL

- `netscript-harness` — RED/GREEN discipline, drift/worklog artifacts, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.
- `netscript-tools` — validation wrappers and gate evidence.
- `rtk` — prefix read-heavy git/grep to cut output tokens.

## ROLE

Implementation slice for S9 (#1759 / #1721). Worktree:
`/home/agent/projects/netscript/worktrees/007-aspire-s9`, branch
`fix/aspire-13-5-s9-skills-mcp-alignment` at `e72da5161`.

**Do not dispatch runtime tiers and do not push workflow changes.** This branch is held from hosted
runtime dispatch until #1908 lands, and a PAT cannot author `.github/workflows/**` changes. Static
work only: source, unit tests, `deno check`, targeted `deno test`.

## PROBLEM

Both of this branch's runtime tiers now fail on their merits (run `33592084708`), and both share one
cause.

This branch's commit `cdd347475` makes the runtime start script set
`ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS = "false"` before launching the AppHost. That is
**correct and must stay**: anonymous mode suppresses the dashboard API key that Aspire MCP requires,
and the MCP smoke depends on it.

The consequence is that the dashboard now requires authentication, and every telemetry reader in the
gate layer reads it over plain HTTP with no credential:

- sqlite tier: `behavior.otel.stream-consumer` → `Dashboard traces read failed: HTTP 401`
- docker tier: `behavior.live-db-endpoint` → `telemetry correlation did not converge after 20
  attempt(s): structured-log trace ids=[none]`

A 401 and an empty result set are the same defect from two angles. There is no credential available
to the gate layer: `aspire-mcp/stdio-transport.ts` launches `aspire agent mcp` as a subprocess and the
CLI authenticates internally, and the reported `dashboardUrl` carries no `?t=` token.

## THE SEAM

`packages/cli/e2e/src/application/gates/scaffold/aspire-dashboard-telemetry.ts`.
`createLiveAspireTelemetryQuery` builds its endpoint with `new URL(metadata.dashboardUrl).origin`
(origin-only, credential discarded) and reads through `createLiveAspireFetch`. Three gates consume it:

- `verify-live-db-endpoint.ts:99` (the failing docker gate)
- `validate-flow-b-traces.ts:11`
- `verify-producer-reconnect.ts:170`

`consume-flow-b-stream.ts:169` keeps a **fourth, private** raw reader (`readJobExecuteIdentity`).

## REQUIRED CHANGE

1. Route `createLiveAspireTelemetryQuery` through the existing stdio MCP transport instead of raw
   HTTP, using the already-declared dashboard tools in `aspire-mcp/tools.ts`:
   `list_traces`, `list_structured_logs`, `list_trace_structured_logs`.
2. Fold `consume-flow-b-stream.ts`'s private reader onto the same adapter, so **no raw dashboard
   reader remains in the tree**. Preserve its `findJobExecuteIdentity` semantics: it must still find
   the `job.execute` span whose `netscript.job.id` is `flow-b-callback`, and return its
   `correlationId` and `traceId`.
3. Keep the adapter's existing `TelemetryQueryPort` contract so the three consumers do not change
   shape. The OTLP normalisation in `createLiveAspireFetch` moves from OTLP envelopes to the MCP
   tools' output — that is the substance of the work.
4. Do **not** revert the anonymous-mode switch, and do not add a second AppHost (#1720 box 5
   forbids it).

## RED/GREEN REQUIRED

Write the failing test first, against realistic `list_traces` output, and show it red before the
change and green after. A test that passes against the unrepaired adapter is a defect, not evidence.
Fixture-only tests that never exercise the adapter are what let this reach hosted CI in the first
place — the existing unit suite was green while both tiers failed.

## VALIDATION

- `deno check --unstable-kv` on every changed file
- `deno test --allow-all packages/cli/e2e/tests/` (report passed/failed counts)
- `deno task lint` and `fmt:check` scoped to changed paths

## REPORT

Commit and push to the branch, then report: the commit SHA, the RED evidence (test failing before),
the GREEN evidence (after), and the exact counts. State plainly anything you could not verify
statically — the hosted tiers cannot be run from here.
