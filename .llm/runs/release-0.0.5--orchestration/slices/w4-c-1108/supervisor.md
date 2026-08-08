# W4-C supervisor preparation — #1108

- Status: prepared, dispatchable only when the W4 schedule opens after the verified C15 boundary.
- Planned branch: `docs/reference-export-alignment-1108`
- Planned worktree: `/home/codex/repos/ns005-w4-reference-exports`
- Base at dispatch: exact fresh canary.16 train head created from verified C15 main.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1108 is open in milestone 0.0.5 at `status:triage`, `priority:p1`. Four tooling/authority criteria
are already checked through PR #1292; three repair/integration criteria remain unchecked.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-tools`,
`netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, and `rtk`. Live export maps and `deno doc`
are the authority; no handwritten replacement inventory is permitted.
