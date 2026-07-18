# @netscript/mcp live validation — pre-first-publish

## Re-validation (post-#808 fixes)

**Verdict: HOLD**  
**Validated:** 2026-07-17 (Europe/Zurich)  
**Fix checkout:** `/home/codex/repos/b10-808`, branch `fix/808-mcp-live-defects`, clean at `bd52f4b6`  
**Generated app:** `.llm/tmp/cli-e2e/plugin-smoke-20260717-074108` (moved to trash after validation)  
**MCP transport:** local maintainer CLI `netscript agent mcp`, newline-delimited stdio JSON-RPC, protocol `2025-11-25`  
**Server self-reported version:** `0.0.1-beta.9`

### Executive result

The three blockers reported in the first round are fixed in the live consumer path:

1. **Telemetry fixed:** raw Aspire 13.4 telemetry was normalized into 11 resources / 100 bounded spans; the MCP server listed real runs, resolved the triggered `health-check` run end-to-end, found its completed result, and computed non-zero workers performance.
2. **Doctor bounding fixed:** `doctor` returned a valid structured result with four top-level family summaries and bounded family details. There was no JSON-RPC/output-schema failure.
3. **Default docs fixed:** without passing `--docs-root`, the server searched, listed, and retrieved the shipped `mcp` document; retrieved content was string-truncated with the server's marker.

However, the exact live run found one new publish-blocking false diagnostic: the doctor marked the canonical, E2E-generated scaffold as failed because it requires `.netscript/generated/plugins.ts`. The successful `generated.plugins-check` gate had produced the actual plugin-specific registries, including `.netscript/generated/plugin-workers/job-registry.ts` and the AI registries. Re-running doctor on this known-green scaffold therefore gives users an incorrect failure and an ineffective instruction to rerun `netscript generate plugins`.

The command-policy regression cases remain green: allowlisted `plugin list` succeeded against the generated project, while `deploy` was denied by `deny_deploy` before spawning.

### Setup and live-data evidence

- `deno doc packages/mcp/mod.ts` and live `tools/list` both confirmed exactly the same 13 tool names.
- Canonical scaffold command: `deno task e2e:cli run scaffold.runtime --format pretty` without `--cleanup`.
- Scaffold result: **58 passed, 0 failed**, including `generated.plugins-check`, worker execution, and OTEL trace validation.
- As in round one, the suite's detached AppHost exited when the suite process ended. The exact generated AppHost was restarted in the native Linux worktree with `aspire run --non-interactive --isolated --apphost aspire/apphost.mts`.
- Fresh trigger: `POST /api/v1/workers/jobs/health-check/trigger` → `{"jobId":"health-check","triggered":true}`.
- Raw Dashboard immediately before stdio calls: `/api/telemetry/spans?limit=100` returned the Aspire `data.resourceSpans` shape with 1 resource-span group and 100 bounded spans.
- `initialize` succeeded for `@netscript/mcp`, protocol `2025-11-25`; `tools/list` returned 13 tools.
- The MCP process was intentionally terminated after all replies; exit 143 is teardown, not a server failure. Stderr was empty.

### Per-tool evidence

| Tool | Live request | Response-shape / token-bound sanity | Verdict | Evidence snippet |
| --- | --- | --- | --- | --- |
| `get_app_status` | `{"limit":100}` | Full contract shape; 5 domain summaries (schema max 5), spans capped at the requested 100. | **PASS** | `status:"pass"`; `resources:11`, `spans:100`, `errors:0`; recent activity present. |
| `list_runs` | `{"limit":100}` | Contract-shaped and within the 100-run bound; returned proven live executions. | **PASS** | `count:2`; IDs `health-check` and `workers-plugin-health-check`; first run `outcome:"completed"`, service `workers`. |
| `get_run` | `{"id":"health-check"}` | Successful end-to-end summary; 13 spans, below schema max 50; logs array below max 20. | **PASS** | Trace contained `queue.enqueue → queue.dequeue → job.execute`; summary/outcome `completed`. |
| `get_recent_errors` | `{"limit":100}` | Contract-shaped and bounded. Empty result was consistent with raw/live evidence and app status `errors:0`. | **PASS** | `{"count":0,"groups":[]}` with no errors observed in the live capture. |
| `get_last_job_result` | `{"jobId":"health-check"}` | Full success shape for the freshly triggered job. | **PASS** | `found:true`, `status:"ok"`, `outcome:"completed"`, duration 24 ms, matching trace ID. |
| `analyze_service_performance` | `{"service":"workers","limit":100}` | Full analytics contract; 4 ranked operations, below max 20. | **PASS** | `sampleCount:4`, average 25.25 ms, p95 54 ms; operations included dequeue, execute, HTTP, scheduler. |
| `analyze_db_bottlenecks` | `{"limit":100}` | Full bounded contract. No DB/KV operation spans existed in this capture, so zero was legitimate rather than adapter-empty. | **PASS** | `sampleCount:0`, `operations:[]`; other telemetry tools simultaneously proved adapter connectivity. |
| `doctor` | `{"endpoint":"https://localhost:43895"}` | Output now validates and is bounded: 4 summary checks; plugin-family details capped at 20 with an explicit omitted-check summary. Semantics contain a false failure on the canonical generated registry. | **FAIL** | `project/plugin_registry: fail`, “generated registry is missing,” although `generated.plugins-check` passed and plugin-specific generated registries existed. |
| `search_docs` | `{"query":"worker","limit":20}` | Shipped default corpus used without override; one match within max 20, snippet bounded. | **PASS** | Match `slug:"mcp"`, title `@netscript/mcp`, positive score 3. |
| `list_docs` | `{"limit":100}` | Shipped default corpus returned a real descriptor within max 100. | **PASS** | `count:1`; `slug:"mcp"`. |
| `get_doc` | `{"slug":"mcp"}` | Successful default-corpus retrieval; long Markdown was server-truncated with `…[truncated]`. | **PASS** | Title `@netscript/mcp`; content began with the package README and ended at the configured string bound. |
| `list_commands` | `{"limit":100}` | Exactly the requested/schema maximum of 100 valid descriptors. | **PASS** | Included `agent mcp`, `plugin list`, `deploy`, and nested commands. |
| `execute_command` | Allowed `plugin list --project-root PROJECT`; denied `deploy`. | Allowed result had all bounded fields; output remained under the 4096-byte tail (`truncated:false`, `timedOut:false`). Denied result was a structured error and did not spawn. | **PASS** | Allowed `exitCode:0` and listed `ai`, `auth`, `sagas`, `streams`, `triggers`, `workers`; denied `command_denied` / `deny_deploy`. |

### Resolution of original blockers

| Original blocker | Re-validation result |
| --- | --- |
| PB-1: Aspire live payload not normalized | **RESOLVED.** Real run, job, trace, resource, and performance data returned through stdio. |
| PB-2: doctor output exceeds schema | **RESOLVED.** Family summaries and per-family omission accounting kept output within all declared maxima. |
| PB-3: default docs corpus empty | **RESOLVED.** Search → list → get succeeded without a docs-root override. |

### New publish-blocking finding — doctor expects an obsolete/non-canonical registry path

`ProjectWiringDoctorFamily` treats configured plugins as healthy only when
`<project>/.netscript/generated/plugins.ts` exists. The canonical generator/E2E path instead emitted
plugin-owned registries such as:

- `.netscript/generated/plugin-workers/job-registry.ts`
- `.netscript/generated/plugin-ai/agents.registry.ts`
- `.netscript/generated/plugin-ai/tools.registry.ts`

The same run's `generated.plugins-check` passed, and all six plugins were live/listable. Doctor still
reported overall `status:"fail"` and prescribed `netscript generate plugins`, the operation already
successfully performed by the suite. This is a live false negative on the primary consumer scaffold.

**Required before ship:** make the project doctor validate the canonical generated registry layout
(or a generator-owned completion marker/manifest) rather than the absent monolithic `plugins.ts`.
Re-run `doctor` on `scaffold.runtime` output and require the `plugin_registry` diagnostic to pass.
Warnings for undeclared permissions may remain warnings; the generated registry must not be a false
failure.

### Cleanup evidence

- Foreground Aspire was stopped with Ctrl+C and reported `Stopping Aspire`.
- The re-validation generated project was moved to trash (recoverable).
- The temporary stdio driver was deleted.
- Final `aspire ps`, project-absence, and raw `git status --short` checks were run after this report write.
- No source changes, commits, pushes, or PR mutations were made.

### Final verdict

**HOLD.** PR #809 resolves all three #808 blockers and 12 of 13 tools pass the exact live procedure.
The remaining blocker is a new `doctor` false failure against the canonical, otherwise green
scaffold. Fix its generated-registry detection, then rerun this matrix; no other blocker was found.

## Round 3

**Final verdict: SHIP**  
**Validated:** 2026-07-17 (Europe/Zurich)  
**Fix checkout:** `/home/codex/repos/b10-808`, branch `fix/808-mcp-live-defects`, fetched/reset to `418efd69` (`fix(mcp): recognize generated plugin registry layouts`)  
**Scope:** fresh canonical scaffold; doctor plus three telemetry tools and one default-docs tool

### Setup

- Fetched `fix/808-mcp-live-defects`; the verified origin `FETCH_HEAD` and final worktree HEAD were both `418efd69`.
- Reset the validation worktree hard to that fetched origin tip as explicitly requested.
- Ran `deno task e2e:cli run scaffold.runtime --format pretty` without cleanup: **58 passed, 0 failed**.
- The fresh project was `.llm/tmp/cli-e2e/plugin-smoke-20260717-075509`.
- As in rounds 1–2, the suite's detached AppHost ended with the suite process; restarted the exact generated AppHost in isolated foreground mode at `https://localhost:43083`.
- Triggered a fresh worker job: `{"jobId":"health-check","triggered":true}`.
- Raw Dashboard proof before stdio calls: 2 `resourceSpans` groups and 12 spans; the MCP calls subsequently observed 17 spans as telemetry continued arriving.

### Scoped live results

| Tool | Request | Verdict | Evidence |
| --- | --- | --- | --- |
| `doctor` | `{"endpoint":"https://localhost:43083"}` | **PASS** | Valid bounded response; overall `status:"warn"` is attributable only to non-blocking Aspire/plugin permission warnings. Counts: 21 pass, 8 warn, **0 fail**. `project_summary` passed 3/3; `plugin_registry` passed with `Generated plugin registries are present (3 module(s)).` No protocol error or false missing-registry diagnostic. |
| `get_app_status` | `{"limit":100}` | **PASS** | `status:"pass"`; 11 resources, 17 spans, 0 errors; service and stream activity present. |
| `list_runs` | `{"limit":100}` | **PASS** | Returned 2 real runs. `health-check` was `status:"ok"`, `outcome:"completed"`, service `workers`, with a live trace ID. |
| `get_last_job_result` | `{"jobId":"health-check"}` | **PASS** | `found:true`, `status:"ok"`, `outcome:"completed"`, duration 27 ms; trace ID matched the `list_runs` result. |
| `search_docs` | `{"query":"worker","limit":20}` | **PASS** | Default shipped corpus returned one bounded result: slug `mcp`, title `@netscript/mcp`, positive score 3. No docs-root override was supplied. |

The stdio server initialized successfully with protocol `2025-11-25`, emitted no stderr, and was intentionally terminated after all responses. The prior full round remains the evidence for the other eight tools and both `execute_command` policy directions.

### Cleanup

- Foreground Aspire stopped cleanly and reported `Stopping Aspire`.
- Fresh generated project moved to trash (recoverable).
- Temporary Round 3 stdio driver deleted.
- Post-report verification confirmed `aspire ps` empty, the fresh project absent, and `/home/codex/repos/b10-808` clean.
- Validation only: no source edits, commits, pushes, or PR mutations.

### Final decision

**SHIP `@netscript/mcp` for beta.10.** The last Round 2 blocker is resolved on `418efd69`: doctor now recognizes the canonical generated plugin registry layouts and returns zero failures on the green scaffold. The telemetry and shipped-docs spot checks remained green, while rounds 1–2 retain full 13-tool and command-policy coverage.
