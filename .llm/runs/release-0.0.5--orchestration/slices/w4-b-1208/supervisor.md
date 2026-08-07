# W4-B supervisor preparation — #1208

- Status: prepared, not dispatchable until W4-A merges and its retained executable patterns are
  known.
- Planned branch: `docs/page-builder-tutorial-1208`
- Planned worktree: `/home/codex/repos/ns005-w4-page-builder-tutorial`
- Base at dispatch: exact canary.16 train head containing W4-A.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state and closure hold

#1208 is open in milestone 0.0.5 at `status:plan`, `priority:p0`. Its body has three unchecked Phase
1 rows, while owner comments require a later Phase 2 inconsistency/underleverage sweep and add Loom
to the measured tutorial corpus. Until the Phase 2 ownership is separately resolved or completed,
the PR uses `Refs #1208`, not a closing keyword.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `deno-fresh`,
`netscript-doctrine`, `netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`,
`playwright-cli`, and `rtk`. W4-A is the pattern authority; this lane must not redesign it.
