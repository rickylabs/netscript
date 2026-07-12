# Evaluation: `packages/mcp` — S4 trace intelligence

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                                             |
| -------------- | ---------------------------------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s4`                                     |
| Target         | `packages/mcp` (`get_last_job_result`, `analyze_service_performance`, `analyze_db_bottlenecks`) |
| Archetype      | `6 - CLI / Tooling`                                               |
| Scope overlays | `none`                                                           |
| Evaluator      | opposite-family IMPL-EVAL (Opus 4.8), 2026-07-12, HEAD `545698f9` |

## Verdict (summary)

`FAIL_FIX` — the plan and archetype are correct and the pure math is sound, but the three tools'
**output contracts do not match their flow outputs**. The MCP server enforces the output schema at
runtime (`mcp-server.ts:100`, `additionalProperties:false`), so every real result path returns
`-32603 invalid_tool_result`. The 24-test suite is green only because it asserts on flow return
values directly and never routes a found/populated result through `validateSchema(tool.outputSchema,
…)`. This is a false-done state, not a working slice.

## Process Verification

| Check                                  | Result   | Evidence                                                                                 |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS     | `plan-eval.md` verdict `PASS`; separate opposite-family session recorded in `worklog.md`. |
| Design section exists in worklog       | PASS     | `worklog.md` §Design (public surface, vocabulary, ports, constants, slices, contributor path). |
| Commit slices match design plan        | FAIL     | Plan/`plan-eval` locked **3** ordered slices; the branch is a **single** squashed commit `545698f9 feat(mcp): add trace intelligence analytics (#728)`. No per-slice gate trail exists on the commit history. Minor process finding. |
| Each slice has a passing gate          | PARTIAL  | `worklog.md` §Gate evidence lists aggregate gates (check/lint/fmt/tests/arch/doc/publish), not per-slice gates. Independently reproduced 24/0 tests; but the gates do not exercise the enforced output contract (see Findings F1). |
| No speculative seams (unused files)    | PASS     | Three flow files + summary types are all wired via `cli.ts` and consumed by tests; no dead files. |
| Constants used for finite vocabularies | PASS     | KV/job/exec/saga/trigger attrs from `@netscript/telemetry/attributes`; `db.` documented as OTel semconv namespace; window/limit/label constants named. No NetScript value-string duplication. |

## Static Gates

| Gate            | Command or check                                             | Result | Evidence |
| --------------- | ----------------------------------------------------------- | ------ | -------- |
| Scoped check    | `.llm/tools/run-deno-check.ts --root packages/mcp`          | PASS   | Generator: 37 files, 0 failed batches. Type surface compiles (contract mismatch is a runtime, not a type, error — flows return `unknown`-typed `value`). |
| Format          | scoped fmt wrapper                                           | PASS   | Generator: 37 files, 0 findings. |
| Lint            | scoped lint wrapper                                          | PASS   | Generator: 37 files, 0 occurrences. |
| Doc lint        | full-export doc lint (`cli.ts` + `mod.ts`)                  | PASS   | Generator: 0 errors / 0 private refs / 0 missing JSDoc. Exported summary types + aggregation fns carry return types + JSDoc. |
| Publish dry-run | `deno publish --dry-run` (`@netscript/mcp@0.0.1-beta.8`)   | PASS   | Generator: slow-type checks passed, "Success Dry run complete". |
| MCP tests       | `deno test … packages/mcp/tests/` (`--unstable-kv`)        | PASS*  | Independently reproduced: **24 passed / 0 failed**. *Green but non-probative for the output contract — see F1. |

## Fitness Gates (Archetype 6, applicable subset)

| Gate    | Function                | Result         | Evidence |
| ------- | ----------------------- | -------------- | -------- |
| F-1     | File-size lint          | PASS           | `telemetry-aggregation.ts` = 409 LOC, < 500 universal ceiling; other new files small. |
| F-2     | Helper-reinvention scan | PASS           | Extends existing aggregation/summary seams; reuses `TelemetryQueryPort`, `duration`, `serviceOf`, `spanStatus`. No parallel analytics abstraction. |
| F-3     | Layering check          | PASS           | `deno task arch:check` exit 0 (generator); domain→application flow, no effects in aggregation. |
| F-5     | Public surface audit    | PASS           | No new export-map entry or dependency; flows composition-internal. |
| F-6/F-7 | JSR publish / doc-score  | PASS           | Doc lint + publish dry-run green. |
| F-9     | Permission declaration  | PASS           | No new permission surface; `cli.ts` unchanged in flags. |
| F-CLI-1..31 | scoped CLI fitness   | PENDING_SCRIPT | Per Arch-6 profile, F-CLI gates have no dedicated script; `arch:check` reported clean by generator. No CLI verb/surface change in S4. |

## Runtime / Consumer Gates

| Gate                              | Validation                                                                 | Result | Evidence |
| --------------------------------- | -------------------------------------------------------------------------- | ------ | -------- |
| Tool output-contract round-trip   | server validates `tool.outputSchema` against flow `value` (`mcp-server.ts:100`) | **FAIL** | Reproduced below (F1): all three tools violate their output schema on real results. No test covers this path. |
| stdio round-trip (existing tools) | `stdio_test.ts` initialize/list/doctor                                     | PASS   | Unchanged; only exercises `doctor`. `tools/list` count still 13. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| **high** | **F1 — All three S4 tools fail the server-enforced output contract.** `analyze_service_performance` and `analyze_db_bottlenecks` fail on **every** call (empty and populated); `get_last_job_result` fails on **every found job** (its primary success path). The server returns `-32603 invalid_tool_result` instead of a result. | Ran the actual validator against actual aggregation outputs (`validateSchema(TOOL_OUTPUT_SCHEMAS[name], aggregate…())`):<br>• `get_last_job_result` (found): `$.startUnixMs is not allowed; $.completedUnixMs is not allowed` — `LastJobResultSummary` returns `startUnixMs`/`completedUnixMs` (aggregation L251-252) but the output schema (`tool-contracts.ts:104-114`, `additionalProperties:false`) omits them.<br>• `analyze_service_performance` (empty **and** populated): `$.summary is required; $.service…p50…p95…throughputPerMinute is not allowed` — flow returns the full `ServicePerformanceSummary`, but the schema (`tool-contracts.ts:115-119`) requires a `summary` object and forbids the actual fields.<br>• `analyze_db_bottlenecks` (empty **and** populated): `$.sinceUnixMs is not allowed` — `DbBottleneckSummary` includes `sinceUnixMs` (L328) not in schema (`tool-contracts.ts:120-123`). | fix |
| medium | F2 — Tests do not exercise the enforced output contract. `telemetry-flows_test.ts` asserts on flow `.value` directly; `telemetry-aggregation_test.ts` asserts on aggregation returns; `registry_test.ts` validates only **input** schemas + malformed rejection; `stdio_test.ts` calls only `doctor`. Nothing routes a found/populated S4 result through `TOOL_OUTPUT_SCHEMAS`, so the green suite masks F1. Brief deliverable #3 ("contract fit … keep existing tests green") and plan slice 1 ("proves typed outputs") are not actually proven. | Test file reads above; reproduced 24/0 pass with F1 latent. | fix (add an output-contract round-trip test per S4 tool, both found and empty) |
| low | F3 — Single squashed commit instead of the 3 locked slices; per-slice gate evidence is aggregate. Weakens auditability but not correctness. | `git log dd89ced9..HEAD` = one commit. | note / follow process next slice |

Non-findings (verified, correct): input relaxation of `get_last_job_result` to optional
`jobId`/`jobName` with newest-overall (design-conformant, `tool-contracts.ts:57-62`); nearest-rank
interpolation-free percentiles (`nearestRank`, test L91 p50=20/p95=40); DB candidate detection over
`netscript.kv.*` + OTel `db.` with KV→`db.operation.name`→statement→span-name labeling +
whitespace-normalize/truncate; conjunctive job filters; completed-span-only durations; window default
15 min with `sinceUnixMs` override + defensive re-filter; `limit` bounded ≤ 20; additive `cli.ts`
wiring; no leaf PR and `#728` referenced without a closing keyword (both per explicit supervisor
instruction — **not** findings); `## SKILL` chapter present in `implement.md`.

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new dependency, lock, or seam; `deno.lock` unchanged. |
| Resolved entries      | 0     | — |
| Deepened violations   | 0     | `MCP-A6-V2-SHAPE` horizontal skeleton extended in place, not broadened; aggregation module < 500 LOC. |
| Unrecorded violations | 0     | F1 is a correctness/contract defect, not an architecture-debt gap; `FAIL_FIX`, not `FAIL_DEBT`. |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `FAIL_FIX` |
| Rationale | Plan, archetype, scope, and pure aggregation are sound, so this is neither `FAIL_RESCOPE` nor `FAIL_DEBT`. But the implementation ships three tools that cannot return a valid result: the server enforces each tool's output schema (`mcp-server.ts:100`, `additionalProperties:false`) and the flow outputs violate it — `analyze_service_performance` and `analyze_db_bottlenecks` on every call, `get_last_job_result` on every found job. Brief deliverable #3 (contract fit) is met for none of the three, and no test covers the enforced output path (F2), so all gates report green over a functionally broken slice. Required fix: reconcile the three output schemas in `tool-contracts.ts` with the actual `LastJobResultSummary` / `ServicePerformanceSummary` / `DbBottleneckSummary` shapes (or reshape the flow outputs to the schemas), and add an output-contract round-trip test per tool for both found and empty cases. |
