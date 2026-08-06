You are the independent Tier-A ordinary adversarial reviewer for S1 of NetScript issue #1331.
This is a read-only review. Do not edit files, commit, push, or act as formal IMPL-EVAL.

Worktree: `/home/codex/repos/ns1331-qwen-evaluator`
Run: `.llm/runs/chore-qwen-3-8-evaluator--1331/`

Review the current uncommitted diff for S1 against `plan.md`, `plan-eval.md`, and the repository
contracts. S1 must keep canonical PLAN-EVAL on `minimax/minimax-m3`, migrate canonical IMPL-EVAL to
`qwen/qwen3.8-max`, add dedicated evaluation presets and phase-specific lanes, reject cross-phase
routes, retain open-only/session-separation guards, and remove active 3.7 executable bindings.

Inspect the diff and relevant tests. Focus on correctness, type safety, compatibility impact,
negative coverage, stale active bindings, and whether the focused gates are sufficient. Report
findings ordered by severity with exact file/line references. If there are no substantive findings,
say `PASS` explicitly and list residual risks. Include observed model/session identity in the output.
