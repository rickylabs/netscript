# Tier-A slice review — S2 (#1714, PR #1735) — supervisor: Fable 5 medium

Status: **TIER-A SIGN-OFF at exact head `fffbb0c473de…` (2026-08-30)** — pending independent
IMPL-EVAL.

## Commits (branch `test/aspire-13-5-s2-runtime-verification`, base `origin/main` `21d516224`)

| SHA         | Message                                              | Verdict                                                                                                                           |
| ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `71a14e3b9` | test(aspire): prove 13.5.3 scaffold restore          | OK — V1: 13.5.3 SDK declares `withHttpHealthCheck(options?: WithHttpHealthCheckOptions)`; tsc green after workspace deps.         |
| `0956b2d3d` | test(aspire): record 13.5.3 runtime lifecycle probes | OK — V2–V7 + V11 live receipts on one isolated AppHost.                                                                           |
| `cef4ec83b` | test(aspire): capture 13.5.3 MCP and CLI contracts   | OK — V8 stdio client transcript (serverInfo `aspire-mcp-server 13.5.3`), V9 toolkit projection, V10 doctor JSON, V12 deploy help. |
| `fffbb0c47` | test(aspire): finalize 13.5.3 verification receipts  | OK — table complete (0 pending), leak-check before/after teardown, `run-resources.json` empty.                                    |

## Supervisor zero-leak proof (independent, read-only, 2026-08-29T23:11Z)

`deno task agentic:leak-check -- --slice-dir <s2 run dir> --worktree /home/codex/repos/netscript-aspire-13-5-s2`
→ `survivors: []`, probes aspire/docker `ok`;
`docker ps -a --filter label=com.microsoft.developer.usvc-dev.creatorProcessId` → 0; no process
references `netscript-aspire-13-5-s2/.llm/tmp`; `aspire ps --format Json` → `[]`. Host CLI remains
13.5.3 (lease-authorized state change, kept).

## Findings that change downstream slices (epic-level)

| Row   | Finding                                                                                                                                                                                                                                            | Downstream                                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| V2    | Cold `aspire start --isolated` 38.6 s, second start 24.8 s (vs the skill's 13 s on 13.4.6); web readiness timed out because generated Prisma/Zod output was absent before the web resource started; `withBrowserLogs()` child stayed `NotStarted`. | S9 skill timings; S10 startup order/readiness gate; scaffold ordering (db codegen before web) → drift for the fixes lane / S8. |
| V3    | Proxy URL ≠ `environment.PORT` (unchanged model); **both isolated starts reused Postgres host port 14428** → `verify-live-db-endpoint` exit 1. Isolation does not randomize the generated Postgres host port.                                      | S5 (host-port pinning removal must cover infrastructure), S3/S10 gate expectations, BC-5 note in S11.                          |
| V4    | Bare detached `aspire otel` still exit 12 on 13.5.3; `--dashboard-url` works.                                                                                                                                                                      | Keep `.netscript/aspire-cli.ts` fallback; S9 skill text; arch-debt `aspire-otel-cli-discovery` re-anchored (append).           |
| V5    | `aspire ps` adds `logFilePath`, keeps `sdkVersion` (13.5.3); `describe` shape compatible.                                                                                                                                                          | S3 fixture capture from these receipts.                                                                                        |
| V6/V7 | Kill-launcher → `aspire ps` self-cleans in 385 ms; `stop --force --apphost` removes run-created containers incl. persistent Postgres in 4.4 s.                                                                                                     | S7 teardown; S10 cleanup gate.                                                                                                 |
| V8    | 13.5.3 MCP server: 14 tools, `get_integration_docs` absent (drift D-15).                                                                                                                                                                           | S9 expectation corrected (#1721 comment).                                                                                      |
| V9    | `addDenoApp`/`addDenoTask` projected from CommunityToolkit 13.5.0.                                                                                                                                                                                 | S4 anchors; S12 spike unblocked.                                                                                               |
| V11   | #1447 needs a `Services[].Env` fixture; #1575/#1577 need a launched browser session — recorded as partial with evidence.                                                                                                                           | S3/S10 follow-ups.                                                                                                             |

Non-blocking: the V2 web readiness timeout and the V3 Postgres host-port reuse are **product
findings**, not S2 defects; both get drift entries in the epic run dir and issue comments.
