# W1-B supervisor preparation — #1024 + #1328

- Status: prepared, not dispatchable until the inherited T1/T2 train is coherent.
- Planned branch: `fix/consumer-quality-gates-1024`
- Planned worktree: `/home/codex/repos/ns005-w1-consumer-quality`
- Base at dispatch: exact then-current `canary/0.0.5-canary.14` head.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Dependency hold

Do not provision, branch, relabel, or dispatch before T1/T2 merge and current train gates pass.
Re-query both issues and the shipped #1092 surface before launch; do not resurrect discarded scratch
patches or re-implement criteria already merged.

## Current issue state

- #1024 is open in milestone 0.0.5 at `status:in-progress`. PR #1092 already delivered criteria 1–5;
  only the clone-independent full consumer smoke remains unchecked.
- #1328 is open at `status:triage`, with eight unchecked owned-source quality criteria and an owner
  note that #1335 must not absorb or weaken them.
- The old `feat/1024-agent-tooling-bundle` worktree is historical merged evidence at `5d940069e`,
  not the new implementation branch.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-cli`,
`netscript-tools`, `netscript-pr`, `netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`,
`aspire`, and `rtk`. It must carry the full Codex launch-evidence and resource-ownership contract.
