# W5-A supervisor preparation — #1137 + #1138

- Status: prepared, dispatchable only when the W5 schedule opens on the canary.16 train.
- Planned branch: `docs/openapi-contract-reference-1137`
- Planned worktree: `/home/codex/repos/ns005-w5-openapi-reference`
- Base at dispatch: exact then-current canary.16 train head containing the shipped OpenAPI→MCP
  product surface.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1137 and #1138 are open in milestone 0.0.5 at `status:plan`, under `epic:openapi-mcp`. Each has one
unchecked gate row. #1137 is `priority:p1`; #1138 is `priority:p2`. Neither has a product PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-doctrine`,
`netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, and `rtk`. Public
contract/export inspection must use `deno doc` and the live shipped MCP mapping as authorities.
