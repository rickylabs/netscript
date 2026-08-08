# W3-A supervisor preparation — #1326

- Status: prepared, not dispatchable until W2-B's versioned SSE envelope has merged into the
  canary.15 train.
- Planned branch: `fix/streams-producer-reconnect-1326`
- Planned worktree: `/home/codex/repos/ns005-w3-streams-reconnect`
- Base at dispatch: exact then-current canary.15 train head containing W2-B.
- Route: Codex GPT-5.6 Sol medium, justified by the public concurrency/state-machine, buffering,
  shutdown, and telemetry contract.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state

#1326 is open in milestone 0.0.5 at `status:triage`, `priority:p0`, with seven unchecked acceptance
rows and no product PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-doctrine`,
`netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`, `aspire`, and `rtk`. The
design checkpoint must lock the state machine and failure semantics before implementation.
