use harness

# IMPL-EVAL: issue #1082 Antigravity documentation route

Act as the separate formal IMPL-EVAL session for PR #1086 in
`/home/codex/repos/ns004-lanefix`. You are the bound open-model Qwen evaluator, not the Codex
generator and not the native Claude ordinary reviewer.

Read `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, the run-loop, the Archetype 6
profile and docs overlay, all tracked artifacts in
`.llm/runs/fix-lane-gemini-antigravity--1082/`, issue #1082, PR #1086, and the commit/diff against
`2d58481e4`. Verify the owner-waived PLAN-EVAL is accurately recorded. Independently validate the
implementation and requested gates in proportion to this small slice.

Do not change implementation, `deno.lock`, configuration, or any file except
`.llm/runs/fix-lane-gemini-antigravity--1082/evaluate.md`. Do not commit, push, comment, label, or
contact GitHub with a mutation. Write the complete evaluator artifact using the harness template.
End with exactly one machine-readable line: `IMPL_EVAL_VERDICT: PASS`, `FAIL_FIX`, `FAIL_RESCOPE`,
or `FAIL_DEBT`.

Pay special attention to the formal-evaluator invariant. The existing named test
`formal evaluator rejects the Gemini documentation-authoring generator lane` now passes because
the documentation route is rejected by purpose before model checking; verify the separate
closed-model guard still exercises the open-model allowlist.

## SKILL

- `.agents/skills/netscript-harness` — IMPL-EVAL protocol, session separation, and verdict artifact.
- `.agents/skills/netscript-tools` — trustworthy wrapper/gate evidence and lock hygiene.
- `.agents/skills/netscript-pr` — PR close-gate and acceptance evidence requirements.
- `.agents/skills/rtk` — token-efficient read-heavy git/gh/search inspection.
