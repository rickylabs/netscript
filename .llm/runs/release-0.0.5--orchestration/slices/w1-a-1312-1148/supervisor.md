# W1-A supervisor preparation — #1312 + #1148

- Status: prepared, not dispatchable until the inherited T1/T2 train is coherent.
- Planned branch: `fix/release-publish-budget-1312`
- Planned worktree: `/home/codex/repos/ns005-w1-release-budget`
- Base at dispatch: exact then-current `canary/0.0.5-canary.14` head, never the value recorded
  during preparation.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.
- Intended draft PR closes both #1312 and #1148 only after every acceptance row has current-head
  evidence. The milestone orchestrator retains merge and publish authority.

## Dependency hold

Do not provision the worktree, create the branch, change issue lifecycle labels, or dispatch the
supervisor until T1 and T2 have merged into the train and their complete pre-merge gates pass.
Before launch, re-query both issues, current main/train, release-provider state, and workflow state.

## Current issue state

Both issues are open in milestone 0.0.5 at `status:triage`; #1312 is `priority:p0` and #1148 is
`priority:p2`. Neither has a product PR. #1312 has five unchecked acceptance rows; #1148 has four.
The orchestration PR references them without closing keywords.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-release`,
`netscript-pr`, `netscript-tools`, `netscript-deno-toolchain`, `jsr-audit`, and `rtk`. It must also
carry the full Codex launch-evidence contract and prohibit any real publish from the PR lane.
