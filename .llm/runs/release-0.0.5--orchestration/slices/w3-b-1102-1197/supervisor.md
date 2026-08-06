# W3-B supervisor preparation — #1102 + #1197

- Status: prepared, not dispatchable until W1-C proves OpenCode MCP attachment and W2/W3 scheduling
  reaches this lane.
- Planned branch: `feat/mcp-intent-guidance-1102`
- Planned worktree: `/home/codex/repos/ns005-w3-intent-guidance`
- Base at dispatch: exact then-current canary.15 train head containing W1-C.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high for product implementation; observational adoption is
  adjudicated separately by the milestone orchestrator.

## Current issue state and closure rule

- #1102 is open at `status:triage` with seven unchecked product acceptance rows.
- #1197 is open at `status:plan` with five unchecked observational rows and an owner instruction
  that no PR closes it. Mechanical availability and behavioral adoption must be reported separately.
- The code PR may use `Closes #1102` when earned and `Refs #1197`. #1197 is hand-closed only from a
  re-measured real-agent run after the attached product surface is published.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-doctrine`,
`netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, `aspire`, and `rtk`,
plus the provider/measurement constraints established by W1-C.
