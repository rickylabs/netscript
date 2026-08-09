# Context pack: W3-B3 #1376

- Phase: `plan-eval`; no product source changed.
- Baseline: `aa8e151e6`; branch `fix/mcp-execute-command-host-cli`.
- Issue: #1376; all ten live acceptance rows are quoted in `plan.md`.
- Locked boundary: #1375 owns docs-root, host-config, environment, and corpus changes. This slice's
  eventual `run-agent-mcp.ts` edit is limited to CLI version/executor injection.
- Locked design: one executor-owned identity shared by list/execute; host re-entry uses current
  executable/main module; standalone remains visibly MCP-version pinned; execute receipts use child
  exit semantics and optional resource; list is explicitly receipt-exempt.
- Next action: orchestrator launches mandatory separate Claude · Fable 5 PLAN-EVAL. Do not add RED
  tests or product source until PASS.
