# W4-A supervisor preparation — #1333

- Status: prepared, not dispatchable until canary.15 is published and its green pair is verified.
- Planned branch: `fix/frontend-reference-scaffold-1333`
- Planned worktree: `/home/codex/repos/ns005-w4-frontend-reference`
- Base at dispatch: exact fresh canary.16 train head created from verified C15 main.
- Implementation route: Codex GPT-5.6 Sol medium, bypass, one new sender-free thread launched only
  through `.llm/tools/agentic/`.
- Mandatory design checkpoint: canonical OpenRouter GLM 5.2 xhigh design lane before implementation;
  its design artifact may guide choices, but GLM's absent reasoning trace is not gate evidence.
- Formal evaluator: separate Qwen 3.8 Max high after terminal implementation handoff.

## Current issue state and closure rule

#1333 is open in milestone 0.0.5 at `status:triage`, `priority:p0`, with ten unchecked acceptance
rows and an owner note that #1335 must not absorb this frontend exemplar/dynamic-name slice. The
last row is a measured-agent adoption/rejection observation. The code PR must use `Refs #1333`, not
a closing keyword; the orchestrator hand-closes only after the separate measured smoke is recorded.

## Required skills at launch

The final prompt must begin with `use harness` and name `netscript-harness`, `design`, `deno-fresh`,
`fresh-ui-horizontal` only when its locked-slice authority actually applies, `netscript-cli`,
`netscript-doctrine`, `netscript-tools`, `netscript-pr`, `aspire`, `playwright-cli`, and `rtk`.
