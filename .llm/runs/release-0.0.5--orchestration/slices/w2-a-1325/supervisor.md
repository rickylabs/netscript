# W2-A supervisor preparation — #1325

- Status: prepared, not dispatchable until canary.14 is published and its green pair is verified.
- Planned branch: `fix/triggers-kv-bootstrap-1325`
- Planned worktree: `/home/codex/repos/ns005-w2-triggers-kv`
- Base at dispatch: exact fresh canary.15 train head created by the orchestrator from verified C14
  main.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1325 is open in milestone 0.0.5 at `status:triage`, `priority:p1`, with six unchecked acceptance
rows and no product PR. No branch, worktree, label, or PR should be created before the C14 boundary.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-doctrine`,
`netscript-cli`, `netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`,
`aspire`, and `rtk`. The plugin-thinness and generated-resource glue boundaries must be explicit
before implementation.
