# Worklog

## Design

1. Public surface: existing workers/streams policy interfaces and service factory arguments gain
   optional requestLevel/responseLevel fields matching native 'debug' | 'info' levels.
2. Domain vocabulary: request started and successful response completed levels. Error responses
   remain native warnings. No new named vocabulary or exports.
3. Ports: existing PluginServiceConfig.logger and native withLogger middleware; no new ports.
4. Constants: native level literals debug/info; per-owner private debug defaults if repetition
   warrants a constant. No exported constants.
5. Commit slices: bootstrap research/plan (this directory); then one cohesive implementation
   slice spanning five plugin service owners, per-owner tests, logging docs and run artifacts.
   Gate set is in plan.md. Independent evaluator substantively reviews before sign-off.
6. Deferred scope: core logging defaults, new environment/config path, lifecycle/auth changes,
   release, scaffold E2E execution (coordinator CI required).
7. Contributor path: docs/site/observability/telemetry.md describes factory options; each
   factory forwards into its existing createPluginService logger configuration.

## Owner overrides

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
“Do not add or change labels or milestones (the coordinator owns e2e-cli-gate).”
“The PR body starts with: Refs https://github.com/rickylabs/netscript/issues/2394
(never Fixes or Closes).” Specific owner instructions override generic template conventions.

## Bootstrap

Matrix queried, baseline fetched/current, committed memories consulted, MCP flows queried.
RTK absent; focused commands used directly. PLAN-EVAL pending, no implementation begun.
