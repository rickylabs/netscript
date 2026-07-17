# Plan — S4 trace intelligence

## Metadata and scope

Target: `packages/mcp`; Archetype 6 — CLI/Tooling; overlays: none. Implement only `get_last_job_result`, `analyze_service_performance`, and `analyze_db_bottlenecks`. Doctor, docs, CLI trigger, scaffold, and PR creation are deferred.

Current doctrine verdict: new MCP work follows Archetype 6 while accepted debt `MCP-A6-V2-SHAPE` covers the brief-locked horizontal skeleton. S4 must not deepen it.

## Locked decisions

1. Extend the existing pure aggregation module and typed summary module; no parallel analytics abstraction.
2. A completed job candidate must have `endTimeUnixMs`; select newest by completion time, then start time. Filters are conjunctive when both `jobId` and `jobName` exist. Neither means newest overall.
3. Job status prefers job-status attribute, outcome prefers existing outcome attribute, exit code accepts a numeric job exit-code attribute when present, and error message prefers span status message.
4. Window default is the last 15 minutes, computed by an injectable/default `now`; explicit `sinceUnixMs` wins. Flows query spans once and defensively re-filter the returned spans.
5. Durations use completed spans only. Percentiles use nearest-rank (`ceil(p*n)-1`), without interpolation, documented in code.
6. Service performance groups by span name, reports count/error rate/avg/p50/p95/throughput per minute, and ranks top operations by p95 then count/name. Empty data returns zeroed structured output.
7. DB candidates have a `netscript.kv.*` key or an OTel semantic-convention `db.` key. Labels prefer KV operation, then a whitespace-normalized/truncated DB statement, then span name. Rank by total time and p95; each bounded row includes count, p95, total duration, and error count.
8. `limit` is capped at 20 for compact summaries. No new dependency or lock change.

## Open-decision sweep

- Exact attribute spellings: resolved now by inspecting exported telemetry constants before coding; standard `db.` remains a documented namespace test.
- Missing end time: resolved now; excluded from job completion and duration analytics.
- Zero-length/custom window throughput: resolved now; use elapsed requested window with a positive lower bound.
- Cross-service DB analysis: resolved now; optional service filter, overall when absent.
- Broader telemetry metrics, statement parsing, histogram interpolation: safe to defer.

## Commit slices

1. **Contracts and pure intelligence** — proves typed outputs, selection, percentile/group/ranking, and empty behavior. Create/modify `src/domain/telemetry-summaries.ts`, `src/application/telemetry-aggregation.ts`, `tests/telemetry-aggregation_test.ts`, `tests/telemetry-fixtures.ts`, `src/domain/tool-contracts.ts`, plus S4 artifacts. Gate: focused aggregation tests + scoped check.
2. **Flows and composition** — proves default/override window filtering, service requirement, structured empty summaries, and three registered flows. Create three `src/application/flows/*-flow.ts`; modify `cli.ts`; create/modify `tests/telemetry-flows_test.ts`; update artifacts. Gate: all MCP tests + scoped check.
3. **Merge-readiness evidence** — proves scoped check/lint/fmt, MCP tests, architecture, full-export doc lint, and package publish dry-run; changes run artifacts only except corrections confined to owned S4 files. Scope expansion requires rescope.

## Risks

| Risk | Mitigation |
| --- | --- |
| Backend ignores query filter | Defensive pure window/service filtering in flows/aggregators. |
| Attribute vocabulary mismatch | Use exported constants after `deno doc`; table tests use those constants. |
| High-cardinality statements bloat output | Normalize and truncate labels; cap rows at 20. |
| Percentile ambiguity | Document/test nearest-rank examples. |
| Sibling overlap | Minimal additive edits to `cli.ts` and `tool-contracts.ts`. |

## Gates, debt, and anti-patterns

Required evidence: scoped check/lint/fmt wrappers; all MCP tests; `deno task arch:check`; full-export doc lint; package publish dry-run. Universal Archetype-6 fitness gates and F-CLI gates are reported through architecture output/manual applicability under existing debt. Consumer behavior is covered by registry/server tests. JSR risks are addressed by explicit exported types/JSDoc and final doc/publish gates.

Anti-pattern focus: AP-1/AP-21 monolith growth, AP-2/AP-22 speculative seams, AP-11/AP-25 effects in application code, AP-19 permission drift, and duplicated telemetry vocabulary. No new debt is expected.
