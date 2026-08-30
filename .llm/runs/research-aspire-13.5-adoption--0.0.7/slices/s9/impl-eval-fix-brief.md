Supervisor steering (same thread, S9 #1721) — IMPL-EVAL cycle 1 = FAIL_FIX at e11de98d (independent
Fable 5 session; full report:
/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/evaluate.md
and the [PHASE: IMPL-EVAL] comment on PR #1759). Your docs-audit fix commit already covers F-1 (the
S9-HELP citation path). Apply the remaining fixes as ONE narrow code slice on your branch (static;
no runtime; no rebase/history rewrite):

- F-2 (medium, required): in the agent.aspire-mcp-smoke gate, the failure receipt must NOT discard
  the observation — when the tool-surface assertion fails (e.g. toolsMissing non-empty, the exact
  D-45 scenario Phase B will hit), the persisted receipt must still carry the full toolsObserved
  list, toolsMissing, toolsExtra, baselineDiff, serverInfo, doctor, and the partial lifecycle
  timings gathered so far. Add a recorded-transcript fixture test that drives the 14-tool response
  and asserts the failure receipt contains toolsObserved with 14 names and toolsMissing ==
  ["get_integration_docs"].
- F-3 (low): the outer gate timeout equals the inner deadline, so the partial receipt can be killed
  before it is written — make the outer budget strictly larger than the sum of inner deadlines (or
  write the partial receipt before the final deadline expires) and test it.
- F-4 (low): check list_structured_logs for isError and record the entry count in the receipt
  (info), instead of only "returns without error".
- F-5 (info, Phase-B input): do not change code; add to your run-dir worklog that the sqlite-tier
  visibility names (expectedVisible / expectedMcpExcluded on the sqlite runtime tier) are assumed,
  not proven, and must be captured in the Phase-B brief. Then: scoped check/lint/fmt + raw lint/fmt
  on changed files, tests for packages/cli/e2e/tests, quality:scan, arch:check, check:assets-barrel,
  check:publish-assets, check:emitted-samples; keep aspire ps [] and docker ps -a empty; commit as
  'fix(e2e): keep observed tool surface in the MCP smoke failure receipt', push with the explicit
  refspec, post '## [PHASE: IMPL] S9 IMPL-EVAL fix cycle 1' on PR #1759 with a finding→change table,
  update your run dir, and end with DONE or BLOCKED: <reason>.
