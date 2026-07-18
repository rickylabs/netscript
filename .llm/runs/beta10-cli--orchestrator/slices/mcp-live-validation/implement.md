use harness

## SKILL
- netscript-harness — pre-first-publish manual validation slice for @netscript/mcp
- netscript-cli — scaffold/E2E commands, native-worktree rule
- netscript-tools; aspire; rtk; netscript-deno-toolchain (deno doc for the tool surface)

## Slice: live-validate ALL 13 @netscript/mcp tools against a real scaffolded, running app

Worktree `/home/codex/repos/b10-mcpvalidate` (main @ 4d438ce1). VALIDATION ONLY: no source changes, no commits, no pushes.

Why: @netscript/mcp ships its FIRST JSR publish in v0.0.1-beta.10; only the stdio smoke (initialize → tools/list → doctor + search_docs + get_app_status) is on record. Precedent: the NF1 incident — execute_command's allowlist carried phantom verbs while every unit test was green. Only live exercise catches that class.

Plan:
1. Discover the real tool surface from code (registry/tool definitions + `deno doc`) — expect 13 tools (monitoring: get_app_status/list_runs; debugging: get_run/get_recent_errors; trace intelligence: get_last_job_result/analyze_service_performance/analyze_db_bottlenecks; doctor; docs: search_docs/list_docs/get_doc; CLI: list_commands/execute_command) — confirm exact names from code, never trust this list.
2. Stand up a live app the cheapest reliable way: `deno task e2e:cli run scaffold.runtime --format pretty` WITHOUT --cleanup (leaves the generated app + Aspire running), or the suite's builders. Reuse the E2E project; do not hand-roll a scaffold.
3. Drive the MCP server over stdio against that project (`netscript agent mcp` / the mcp cli entrypoint): initialize → tools/list, then call EVERY tool with realistic args. Trigger a worker job first so runs/executions/telemetry exist. For execute_command: one allowlisted verb (e.g. plugin list) MUST succeed AND one non-allowlisted/destructive verb MUST be default-denied.
4. Record per-tool: request, response-shape sanity, token-bounding/truncation behavior, verdict PASS/FAIL + evidence snippet. Errors, empty results when data provably exists, or contract violations = FAIL with detail.
5. CLEAN UP fully: stop Aspire, remove the generated project, leave the worktree clean (verify git status).

Write the report (per-tool table + overall SHIP/HOLD verdict + publish-blocking findings) to `/home/codex/repos/netscript-beta10-cli/.llm/runs/beta10-cli--orchestrator/slices/mcp-live-validation/report.md`. This is the deliverable — the report file, not a PR. No self-evals.
