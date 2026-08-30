Supervisor steering (same conversation, S11 #1723 / PR #1771) — docs_audit cycle 2 = AUDIT: FAIL_FIX
at b8d66f6f (report:
/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s11/docs-audit/report-cycle-2.md
and the [PHASE: DOCS-AUDIT cycle 2] comment on PR #1771). Seven findings are CLOSED (H1, H4, H7, M1,
M2, M4, wrapper half of H6). Apply the remaining items as ONE bounded prose slice (no product code
beyond regenerated carriers; no history rewrite; base stays a46ea16d; no AppHost/containers): H2
(worklog): in your run dir worklog
(.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/worklog.md lines ~19-21, 46) replace the
nonexistent `03-v2-*`, `03-v3-*`, `03-v4-*` receipt names with the real S2 files
(`02-runtime-lifecycle.md`, `02-aspire-start-1.json`, `02-aspire-ps-1.json`,
`aspire-13.5-verification.md`) and mark the historical line superseded; delete the S10
runtime-receipt assertion (S10 Phase B was not delivered). H3 (detached-start how-to +
explanation/aspire.md:98-99 + reference/aspire/index.md:13-18): timing — two observed starts do not
establish "typically"; write "in the two recorded 13.5.3 runs, cold start took 38.62 s and a second
run 24.80 s (S2 V2); budget with ASPIRE_CLI_START_TIMEOUT" or purely qualitative wording.
`--isolated` — say exactly what 13.5.3 help proves: randomized ports and isolated user secrets;
delete "run state into a dedicated directory"; delete every "free infra ports" / "parallel-safe
ports" claim on all touched pages (S2 V3: two isolated starts reused Postgres host port 14428) — say
host ports of container resources are not guaranteed unique across isolated starts. H5 (version
train, decision recorded by the supervisor as D-62): the exact head generates 13.4.6 because the
13.5.3 pin (S1) has not landed; keep the CURRENT generated 13.4.6 JSON (already correct) and add one
clearly labelled "Target after the 13.5.3 pin" block/sentence stating SDK/hosting 13.5.3 and
Browsers 13.5.3-preview.1.26425.3 and that the CLI/SDK must stay on one train; remove the
reference-page claim that the generated AppHost pins the 13.5 Browsers package (it does not at this
head). Do not claim 13.5.3 as current output anywhere. H6 (add-opentelemetry.md:157-169): the
NetScript MCP telemetry resolver TODAY has FOUR sources in this order — explicit `--endpoint`
option, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`, default `http://localhost:18888`
(packages/mcp/src/domain/telemetry-endpoint.ts:13,23-40; the CLI flag is `--endpoint` per
packages/cli/src/public/features/agent/mcp/agent-mcp-command.ts:37). Replace the five-step list with
exactly that four-step contract and the `--endpoint` flag; do NOT mention an `aspire ps` source
(that is planned work, not shipped). Keep the wrapper paragraph as fixed. M3 (manifest disposition,
.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/manifest-disposition.md + PR body): make
the per-row dispositions true by construction: derive EDITED rows from
`git diff --name-only a46ea16d..HEAD` and mark every other S11 row VERIFIED_CLEAN with its proving
grep; fix the ten rows wrongly marked EDITED (aspire-resource-graph.mmd, glossary.md, index.vto,
deploy.md, quickstart/aspire.md, three tutorial rows, why.vto, README.md) and the two changed files
wrongly marked VERIFIED_CLEAN (docs/site/_data/xref.ts, docs/site/how-to/index.md); commit the
corrected report and refresh the PR body link/summary. M5 (diagrams:check): the supervisor is
handling the `mmdc` environment; run `deno task diagrams:check` from docs/site once and record the
exact output in your worklog (green or the exact error) — do not work around it. Then:
`deno task gen:agent-docs-prose`, `gen:publish-assets`, `check:agent-docs-prose`,
`check:publish-assets`, `docs:links`, Lume build; scans on touched public pages: 0 hits for
"parallel-safe", "free infra port", "aspire ps" inside the MCP resolver section, "D-17", "OF-1",
"/home/agent", "receipt"; keep aspire ps [] and docker ps -a empty; commit as
`docs(aspire): apply S11 docs_audit cycle-2 fixes`, push with
`git push origin HEAD:refs/heads/docs/aspire-13-5-s11-public-docs-refresh` (no force), post
`## [PHASE: IMPL] S11 docs_audit fix cycle 2` on PR #1771 with a finding→change table (H2, H3, H5,
H6, M3, M5), update your run dir, and end with the exact final line `DONE` or `BLOCKED: <reason>`.
