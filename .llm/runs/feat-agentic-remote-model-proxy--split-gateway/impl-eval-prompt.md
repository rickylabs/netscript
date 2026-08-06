use harness

## SKILL

- `netscript-harness` — conduct formal IMPL-EVAL in a separate local session.
- `netscript-tools` — independently run scoped gates and inspect raw git truth.
- `claude-manager` — verify inference-only vs Remote Control/mobile claims.
- `rtk` — use repository-standard read-heavy wrappers where helpful.

You are the formal IMPL-EVAL for PR #1314 and run
`feat-agentic-remote-model-proxy--split-gateway`, executing locally through OpenCode/Qwen. Do not
modify files and do not dispatch OpenHands/cloud agents.

Read `.llm/harness/evaluator/protocol.md`, verdict definitions, the Archetype 6 profile, gate
matrix, run `plan.md`, both plan-eval artifacts, `worklog.md`, `context-pack.md`, `drift.md`,
`grok-review.md`, and the raw diff from `015ddef6d226d6cf2773c21e116a1debbf3d1cac`.

The approved superseding contract is an inference-only Claude/OpenRouter launcher supporting
new/resume/fork, forced configured model, bypass permissions, credential isolation, loopback-only
gateway, bounded request buffering, streaming responses, cleanup, central volatile values, docs,
and explicit rejection of Remote Control. It must never claim mobile attachment.

Independently run the focused tests and scoped check/lint/fmt where possible. Verify `deno.lock` is
unchanged, skill mirror/docs links pass, no old task name remains in current docs/code, and the live
sentinel evidence is consistent with the tmux/session state. Treat missing evidence as a finding.

Return a complete evaluator artifact with findings and exactly one verdict: `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`. Emit only; do not edit the repository.
