# Evaluation: `packages/mcp` — S4 trace intelligence (cycle 2)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                                             |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s4`                                     |
| Target         | `packages/mcp` (`get_last_job_result`, `analyze_service_performance`, `analyze_db_bottlenecks`) |
| Archetype      | `6 - CLI / Tooling`                                               |
| Scope overlays | `none`                                                           |
| Evaluator      | opposite-family IMPL-EVAL (Opus 4.8), cycle 2, 2026-07-12, HEAD `d50b10b7` |
| Prior cycle    | cycle 1 `FAIL_FIX` at `545698f9` (output contracts did not match flow outputs) |

## Verdict (summary)

`PASS` — the cycle-1 blocking finding is fully resolved. The three tools' output schemas now match
their flow/summary shapes exactly, and the fix is proven at the same enforced boundary the server
uses (`validateSchema(TOOL_OUTPUT_SCHEMAS[name], …)`), for both populated and empty results. All
approved scope is complete, static/fitness gates are green or `PENDING_SCRIPT` with manual evidence,
no new architecture debt, and run artifacts are resume-ready.

## Cycle-1 findings — disposition

| ID | Cycle-1 finding | Status | Evidence |
| -- | --------------- | ------ | -------- |
| F1 (high) | All three tools violated their server-enforced output contract (`analyze_*` on every call; `get_last_job_result` on every found job). | **RESOLVED** | `tool-contracts.ts` output schemas rewritten to mirror the summaries: `get_last_job_result` adds `startUnixMs`/`completedUnixMs` (required `['found']`); `analyze_service_performance` replaces the phantom `summary` with the real fields (`service`, `sinceUnixMs`, `sampleCount`, `errorCount`, `errorRate`, `averageDurationMs`, `p50/p95DurationMs`, `throughputPerMinute`, `topOperations`, all required); `analyze_db_bottlenecks` adds `sinceUnixMs` (required). Independently reran the real validator against real aggregation outputs — **6/6 PASS** (found + empty for each tool), where cycle 1 showed 5/6 FAIL. |
| F2 (medium) | No test exercised the enforced output path, so the green suite masked F1. | **RESOLVED** | `telemetry-aggregation_test.ts` now calls `validateSchema(TOOL_OUTPUT_SCHEMAS.<tool>, …)` on both a populated result and an empty result for all three tools (job found/`{found:false}`; service populated/empty; db populated/empty). A regression of F1 would now fail the suite. |
| F3 (low) | Single squashed commit instead of 3 locked slices; aggregate (not per-slice) gate evidence. | UNCHANGED (non-blocking) | Fix landed as one additional commit `d50b10b7`. Process note only; no correctness or debt impact. |

## Static Gates

| Gate            | Command or check                                          | Result | Evidence |
| --------------- | -------------------------------------------------------- | ------ | -------- |
| Scoped check    | `.llm/tools/run-deno-check.ts --root packages/mcp`      | PASS   | Generator cycle-2 green; contract change is type-consistent (schemas are data literals). |
| Format          | scoped fmt wrapper                                        | PASS   | Generator cycle-2 green. |
| Lint            | scoped lint wrapper                                       | PASS   | Generator cycle-2 green. |
| Doc lint        | full-export doc lint (`cli.ts` + `mod.ts`)              | PASS   | No exported-surface change beyond schema literals; cycle-1 doc lint clean, unchanged. |
| Publish dry-run | `deno publish --dry-run` (`@netscript/mcp`)             | PASS   | No new dependency/export-map/lock change (`deno.lock` untouched); cycle-1 dry-run clean, unchanged. |
| MCP tests       | `deno test … packages/mcp/tests/` (`--unstable-kv`)     | PASS   | Independently reproduced: **24 passed / 0 failed** — now including the output-contract round-trips added by the fix. |

## Fitness Gates (Archetype 6, applicable subset)

| Gate    | Function                | Result         | Evidence |
| ------- | ----------------------- | -------------- | -------- |
| F-1     | File-size lint          | PASS           | `telemetry-aggregation.ts` unchanged (409 LOC < 500); contracts file grew by data literals only. |
| F-2     | Helper-reinvention scan | PASS           | No new abstraction; reuses existing aggregation/summary/`validateSchema` seams. |
| F-3     | Layering check          | PASS           | `deno task arch:check` clean (generator); no effects introduced. |
| F-5     | Public surface audit    | PASS           | No new export-map entry or dependency. |
| F-6/F-7 | JSR publish / doc-score  | PASS           | Doc lint + publish dry-run green. |
| F-9     | Permission declaration  | PASS           | No new permission surface. |
| F-CLI-1..31 | scoped CLI fitness   | PENDING_SCRIPT | No dedicated script per Arch-6 profile; `arch:check` clean; no CLI verb/surface change in S4. |

## Runtime / Consumer Gates

| Gate                            | Validation                                                                       | Result | Evidence |
| ------------------------------- | -------------------------------------------------------------------------------- | ------ | -------- |
| Tool output-contract round-trip | server validates `tool.outputSchema` vs flow `value` (`mcp-server.ts:100`)      | **PASS** | Independently reproduced 6/6 PASS (found+empty × 3 tools) via the real validator; now also covered in-suite. |
| stdio round-trip (existing)     | `stdio_test.ts` initialize/list/doctor; `tools/list` count 13                    | PASS   | Unchanged. |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | Schema/test-only change; no dependency, lock, or seam change. |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | `MCP-A6-V2-SHAPE` not broadened. |
| Unrecorded violations | 0     | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | F3 (carried) — fix shipped as a single follow-up commit; slice/gate trail remains aggregate rather than per the 3 locked slices. Non-blocking auditability note. | `git log 545698f9..d50b10b7` = one commit. | note only |

No blocking findings remain. Verified non-findings from cycle 1 (input relaxation, nearest-rank
percentiles, DB/KV detection + labeling, windowing/defensive re-filter, `limit ≤ 20`, additive
`cli.ts` wiring, intentional no-PR / `#728` without closing keyword, `## SKILL` chapter) are
unchanged by this commit.

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | The sole blocking issue from cycle 1 (F1) is fully corrected: the `get_last_job_result`, `analyze_service_performance`, and `analyze_db_bottlenecks` output schemas now match their `LastJobResultSummary` / `ServicePerformanceSummary` / `DbBottleneckSummary` shapes, verified independently at the server's own `validateSchema`/`TOOL_OUTPUT_SCHEMAS` boundary with 6/6 PASS across found and empty paths (cycle 1 was 5/6 FAIL). F2 is closed by in-suite output-contract round-trips, so a regression would now fail the 24/24-green suite. Approved scope is complete, required static and fitness gates pass or are `PENDING_SCRIPT` with manual evidence, no new or deepened architecture debt (`deno.lock` untouched), and artifacts are resume-ready. Only a low, non-blocking process note (F3, single-commit trail) remains. |
