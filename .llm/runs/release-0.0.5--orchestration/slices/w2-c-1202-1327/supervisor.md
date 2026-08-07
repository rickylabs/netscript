# W2-C supervisor preparation — #1202 + #1327

- Status: prepared, not dispatchable until canary.14 is published and its green pair is verified.
- Planned branch: `fix/db-migrate-artifacts-1202`
- Planned worktree: `/home/codex/repos/ns005-w2-db-migrate`
- Base at dispatch: exact fresh canary.15 train head created from verified C14 main.
- Route: Codex GPT-5.6 Sol low, bypass, one new sender-free thread launched only through
  `.llm/tools/agentic/`.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state and closure rule

- #1202 is open in milestone 0.0.5 at `status:plan`, with original stale-endpoint rows plus an owner
  amendment requiring collision evidence and three consecutive clean runtime passes.
- #1327 is open at `status:triage` with six unchecked migration-artifact rows.
- The code PR may use `Closes #1327` when earned. It must use `Refs #1202`, not a closing keyword:
  the Windows-service/collision and consecutive-run acceptance is observational and remains under
  orchestrator evidence closure rather than a code PR.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `netscript-cli`,
`netscript-doctrine`, `netscript-tools`, `netscript-pr`, `netscript-deno-toolchain`, `jsr-audit`,
`aspire`, and `rtk`, with exact resource ownership and TTY/headless test contracts.
