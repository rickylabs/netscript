# W3-C supervisor preparation — #1119

- Status: prepared, independent of W2 product code but not dispatchable before the W3 schedule
  opens.
- Planned branch: `chore/model-rollout-canary-names-1119`
- Planned worktree: `/home/codex/repos/ns005-w3-model-rollout-names`
- Base at dispatch: exact then-current canary.15 train head.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1119 is open in milestone 0.0.5 at `status:plan`, `priority:p2`, with four unchecked acceptance
rows and no product PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-tools`,
`netscript-pr`, `netscript-deno-toolchain`, `netscript-release`, and `rtk`. Release-canary ownership
and active/generated/history reference classes must be explicit before the rename.
