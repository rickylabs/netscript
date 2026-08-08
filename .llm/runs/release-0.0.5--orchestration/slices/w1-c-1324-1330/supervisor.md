# W1-C supervisor preparation — #1324 + #1330

- Status: prepared, not dispatchable until the inherited T1/T2 train is coherent and the approved
  OpenRouter transport can execute live MCP/resume gates.
- Planned branch: `fix/opencode-mcp-resume-1324`
- Planned worktree: `/home/codex/repos/ns005-w1-opencode`
- Base at dispatch: exact then-current `canary/0.0.5-canary.14` head.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Dependency hold

Do not provision, branch, relabel, or dispatch before T1/T2 merge and current train gates pass. A
real provider resume and later Qwen evaluation are decisive; the current OpenRouter monthly-limit
block therefore also holds this cluster's completion even after code can begin.

## Current issue state

Both issues are open in milestone 0.0.5 at `status:triage`; #1324 is `priority:p0`, #1330 is
`priority:p1`, and all twelve combined acceptance rows are unchecked. Neither has a product PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-tools`,
`netscript-pr`, `netscript-deno-toolchain`, `openhands-handoff` only for routing constraints, and
`rtk`. It must carry the full Codex launch-evidence contract and the canonical provider-profile,
credential-isolation, and no-secret-log rules.
