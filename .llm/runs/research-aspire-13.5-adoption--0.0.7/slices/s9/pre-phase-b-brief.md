Supervisor steering (same thread, S9 #1721) — coordinator-RATIFIED contract correction + residuals,
as ONE bounded pre-Phase-B commit on your branch (static; no runtime; no rebase). Ratified D-45
(drift D-49 in the supervisor run dir): the exact 13.5.3 baseline is the REQUIRED set of 14 tools
INCLUDING `refresh_tools` and EXCLUDING `get_integration_docs` (list_resources, list_console_logs,
list_structured_logs, list_traces, list_trace_structured_logs, execute_resource_command,
list_apphosts, select_apphost, list_integrations, list_docs, search_docs, get_doc, doctor,
refresh_tools). Rules: any missing required tool or any baseline removal → fail;
`get_integration_docs` is a SEPARATE `documentedUnobserved` INFO item (its later appearance is
optional INFO, never fail); `toolsMissing` is computed only over the 14 and must be `[]`;
`baselineDiff.added` expected `[]` (an observed extra is INFO). Apply in place: (1) the gate's
expected-set constant, contract/evaluate/receipt schema (add
`documentedUnobserved: ["get_integration_docs"]` + observed-state info field; keep every other key),
the recorded-transcript fixture tests (14-tool transcript must now yield toolsMissing [] and a PASS
receipt; an extra `get_integration_docs` yields INFO, not warning/fail), the static receipt
annotation if it carries the expectation, and the skill prose tool table (14 required,
`get_integration_docs` documented-but-unobserved info line) + regen chain (agentic:sync-claude,
gen:assets-barrel, gen:mcp-export-corpus, gen:publish-assets, agentic:dogfood-skills; all *:check
tasks green). (2) F-3b: `.llm/tools/gates/run-aspire-mcp-smoke.ts` must pass `run-gate.ts` a budget
strictly greater than the inner `wholeGateMs` (or persist the partial receipt before the inner
deadline) — test it. (3) F-4b: stop hard-coding `items: []` in `stdio-transport.ts` — parse the real
`list_structured_logs` result shape (items/entries) so `entryCount` reflects the response; if no
13.5.3 response shape receipt exists, say so in the receipt and make the count nullable rather than
claim 0; fix the overclaiming comment. (4) docs-audit M2: cite the S2-V9 timing (13.065 s) to the
`.time.txt` receipt (`elapsed_ms: 13065`) instead of the `.raw.txt`. Then scoped gates
(check/lint/fmt on changed files, tests for cli/e2e/tests, quality:scan, arch:check, assets-barrel,
publish-assets, mcp-export-corpus, sync-claude:check, check-claude, dogfood-skills:check, `13.4.6`
grep 0), keep aspire ps [] and docker ps -a empty, commit as 'fix(e2e): ratify the 14-tool 13.5.3
MCP baseline; get_integration_docs documented-unobserved (D-45)', push with the explicit refspec,
post '## [PHASE: IMPL] S9 pre-Phase-B contract correction (D-45 ratified)' on PR #1759 with a change
table, update your run dir, end with DONE or BLOCKED: <reason>. Only a scoped supervisor recheck
follows — no new ordinary evaluation for this correction.
