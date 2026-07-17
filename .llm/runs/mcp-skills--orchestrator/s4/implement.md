use harness

# Slice S4 — trace intelligence: `get_last_job_result`, `analyze_service_performance`, `analyze_db_bottlenecks`

## SKILL

Read before coding: `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-deno-toolchain/SKILL.md` (`deno doc` before broad reads),
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent. Worktree (ABSOLUTE, every file op):
  `/home/codex/repos/ns-combo-s4`. Branch: `feat/netscript-mcp-skills-s4-intel`.
- **Base verification preflight (mandatory, first)**: `git -C /home/codex/repos/ns-combo-s4 log
  --oneline -1` must show `30fd0288`, and
  `/home/codex/repos/ns-combo-s4/packages/mcp/src/application/telemetry-aggregation.ts` must
  exist. If not, STOP and report.
- **Harness provisioning**: you are authorized to provision this slice's run-dir artifacts
  yourself at `/home/codex/repos/ns-combo-s4/.llm/runs/mcp-skills--orchestrator/s4/`
  (pattern: the committed `s1/` and `s3/` dirs on your branch), including the separate-session
  PLAN-EVAL. After two PLAN-EVAL failures, escalate to the supervisor instead of proceeding.
- GitHub issue: rickylabs/netscript#728 (epic #721, umbrella PR #715). Conventional commits
  referencing `#728` (no closing keyword).
- A sibling agent works S5 (doctor) in a different worktree; keep `cli.ts` /
  `tool-contracts.ts` diffs minimal and additive. Everything else new files or S4-scoped.
- Lock hygiene: no new external deps.
- Scope ONLY S4's three analytics tools. NOT doctor, docs, CLI trigger.

## Context

- Design: `/home/codex/repos/ns-combo-s4/.llm/runs/mcp-skills--orchestrator/design.md` §3
  (trace intelligence rows). S3 landed the telemetry substrate — READ
  `packages/mcp/src/application/telemetry-aggregation.ts` (classification, executionId,
  existing aggregations), `src/domain/telemetry-summaries.ts`, the flow files, and
  `src/infrastructure/telemetry-query-adapter.ts`. REUSE these seams; do not duplicate.
- Attribute constants: `@netscript/telemetry/attributes` (job/execution/kv modules). DB/KV
  spans carry `netscript.kv.*` attributes; generic db semconv spans (`db.*`) also count for
  bottleneck analysis — use OTel standard `db.` prefix string for those (document it as the
  OTel semconv namespace, not a NetScript attribute).

## Deliverables

1. **Pure aggregation functions** (extend `telemetry-aggregation.ts` or a sibling module in
   `src/application/`), table-driven tests for each:
   - last-job-result: given spans, select the most recent completed execution for an optional
     `jobName`/`jobId` filter (most recent by completion/start time); return job name, id,
     status/outcome, exit code (when present), duration, error message, trace id.
   - service performance: given spans for a service + window: count, error rate, avg/p50/p95
     duration (interpolation-free percentile is fine — document choice), throughput per minute,
     top-N slowest operations (span name + p95 + count).
   - db bottlenecks: select spans with `netscript.kv.*` attrs or `db.`-prefixed semconv attrs;
     rank operations by total time and by p95; flag error-prone operations; return top-N with
     op label (kv operation / db statement summary truncated), count, p95, error count.
2. **Flows** (`src/application/flows/`): `get_last_job_result`, `analyze_service_performance`
   (require `service`), `analyze_db_bottlenecks`; window defaults (e.g. last 15 min,
   `sinceUnixMs` override); all outputs compact structured summaries (counts + top-N).
3. **Contract fit**: minimally adjust the three tools' input/output schemas in
   `tool-contracts.ts` if S1's shapes don't carry these outputs; keep all existing tests green.
   Note: S1's `get_last_job_result` input requires `jobId` — relax to optional `jobId`/`jobName`
   (most-recent-overall when neither given) to match the design's "did my job run" scenario.
4. **Composition**: wire the three flows in `cli.ts` (additive lines only).
5. **Tests**: fixture spans (reuse/extend `tests/telemetry-fixtures.ts`) covering percentile
   math, grouping, ranking, window filtering, jobName vs jobId selection, empty-data behavior
   (structured empty summary, not an error).

## Validation (run, paste real output into worklog)

- `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts` (+ lint + fmt wrappers)
- `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/`
- `deno task arch:check`; doc lint on entrypoints; package publish dry-run.

## Definition of done

Deliverables + validations green with evidence in
`/home/codex/repos/ns-combo-s4/.llm/runs/mcp-skills--orchestrator/s4/worklog.md`; drift in
`s4/drift.md`. Small logical commits, then push:
`git -C /home/codex/repos/ns-combo-s4 push origin HEAD:refs/heads/feat/netscript-mcp-skills-s4-intel`.
Do NOT open a PR; do NOT merge — the supervisor reviews and merges into the umbrella.
