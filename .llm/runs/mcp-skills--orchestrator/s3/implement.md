use harness

# Slice S3 — telemetry adapters + monitoring/debugging tools

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-deno-toolchain/SKILL.md` (use `deno doc` on `@netscript/telemetry`
before broad reads), `.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s3`. Branch: `feat/netscript-mcp-skills-s3-telemetry`.
- **Base verification preflight (mandatory, first)**: `git -C /home/codex/repos/ns-combo-s3 log
  --oneline -1` must show `3870c553`, and `/home/codex/repos/ns-combo-s3/packages/mcp/mod.ts`
  must exist. If not, STOP and report.
- GitHub issue: rickylabs/netscript#727 (epic #721, umbrella PR #715). Conventional commits
  referencing `#727` (no closing keyword).
- A sibling agent is implementing S2 (docs tools) in a DIFFERENT worktree; you may both touch
  `cli.ts` composition and `tool-contracts.ts` — keep those diffs minimal and additive (the
  supervisor resolves merge overlap). Everything else must be new files or telemetry-scoped.
- Lock hygiene: `@netscript/telemetry` is a workspace package — import it the way sibling
  packages import each other (check how `packages/cli` or others depend on workspace packages);
  avoid new external deps.
- Scope ONLY S3: `get_app_status`, `list_runs`, `get_run`, `get_recent_errors` + endpoint
  discovery. NOT the S4 analytics tools (last_job_result/perf/bottlenecks), NOT docs, NOT CLI
  trigger.

## Context

- Design: `/home/codex/repos/ns-combo-s3/.llm/runs/mcp-skills--orchestrator/design.md` §3
  (monitoring/debugging rows), research `research-netscript-surfaces.md` §1 (TelemetryQueryPort,
  read models, filters, AspireTelemetryQuery endpoint `:18888`, `netscript.*` attribute constant
  modules in `packages/telemetry/attributes.ts`).
- S1 landed contracts/registry/runner: READ `packages/mcp/src/domain/tool-contracts.ts`,
  `tool-types.ts`, `src/application/flows/doctor-flow.ts` (flow pattern),
  `src/domain/telemetry-probe-port.ts`, `cli.ts`.
- Key rule: import `netscript.*` attribute constants from `@netscript/telemetry` — NEVER
  hardcode attribute strings. Use `createTelemetryQuery` / `TelemetryQueryPort` from
  `@netscript/telemetry/query` (verify exact export path with `deno doc`).

## Deliverables

1. **Telemetry query wiring** (`src/infrastructure/`): adapter factory building a
   `TelemetryQueryPort` from resolved endpoint options. **Endpoint discovery chain** (document +
   test): explicit `--endpoint` flag → `NETSCRIPT_TELEMETRY_ENDPOINT` env → Aspire dashboard env
   vars if present (check what the scaffolded app/AppHost exports, e.g. dashboard URL envs) →
  default `http://localhost:18888`. Reuse/extend S1's endpoint resolution so `doctor` and these
  tools share ONE resolver (refactor doctor's v0 resolver into a shared domain/application seam
  rather than duplicating).
2. **Flows** (`src/application/flows/`), each a compact structured summary (counts + bounded
   lists), grouping spans via `netscript.*` constants:
   - `get_app_status`: query resources + recent spans/logs; per-domain rollup (services, workers,
     sagas, triggers, streams): seen count, error count (statusCode===2), most recent activity
     timestamp; overall status pass/warn/fail.
   - `list_runs`: recent executions across domains — group spans by execution identity
     (`netscript.execution.id`, `netscript.job.id`, `netscript.saga.instance.id`,
     `netscript.trigger.id`); each run: id, domain, name, status/outcome, start, duration,
     service; filters: domain/status/service/sinceUnixMs/limit.
   - `get_run`: by id — locate the trace (span attribute match), return span tree summary
     (name, duration, status per span, bounded depth/count) + correlated logs (bounded) +
     outcome/error message.
   - `get_recent_errors`: error spans + error-severity logs since window, grouped by
     service+domain: count, first/last seen, sample message, related run/trace ids (bounded).
3. **Pure aggregation helpers** live in `src/domain/` or `src/application/` pure functions with
   direct unit tests over fixture span/log arrays (no network).
4. **Contract fit**: adjust S1's input/output schemas for these four tools minimally if needed;
   keep all existing tests green.
5. **Tests**: fixture-based `TelemetryQueryPort` fake (in-memory arrays) covering each flow's
   grouping/filtering/bounding; endpoint discovery chain tests (flag/env/default); no live
   network in tests.
6. Do NOT duplicate Aspire's generic list_traces/list_logs semantics — every output is a
   NetScript-semantic rollup, never raw span dumps.

## Validation (run, paste real output into worklog)

- `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts` (+ lint + fmt wrappers)
- `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
- `deno task arch:check`; doc lint on entrypoints; publish dry-run from the package.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s3/.llm/runs/mcp-skills--orchestrator/s3/worklog.md` (append-only),
drift in `s3/drift.md` if any. Small logical commits, then push:
`git -C /home/codex/repos/ns-combo-s3 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s3-telemetry`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.
