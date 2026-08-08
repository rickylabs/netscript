# W2-B supervisor preparation — #1329

- Status: prepared, not dispatchable until canary.14 is published and its green pair is verified.
- Planned branch: `fix/streams-sse-contract-1329`
- Planned worktree: `/home/codex/repos/ns005-w2-streams-sse`
- Base at dispatch: exact fresh canary.15 train head created from verified C14 main.
- Route: Codex GPT-5.6 Sol medium, justified by the cross-package public contract, replay semantics,
  Fresh consumer, documentation, and correlated telemetry design.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1329 is open in milestone 0.0.5 at `status:triage`, `priority:p0`, with eight unchecked acceptance
rows and no product PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-doctrine`,
`netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, `deno-fresh`, `aspire`,
and `rtk`. Contract-first ordering, package archetype, and Fresh 2.x consumer conventions are
mandatory before implementation.
