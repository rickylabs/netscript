use harness

# Opposite-family slice review: #1087 evaluator child-model cost guard

## SKILL

- `.agents/skills/netscript-harness` — apply the substantive slice-review and verdict rules.
- `.agents/skills/netscript-tools` — treat compact wrapper output as evidence and preserve lock hygiene.

You are the separate Claude reviewer for a Codex-authored implementation slice. Review only; do not
edit product/tooling source. Write your compact verdict to:

`.llm/runs/fix-1087-harness-hardening--release-blockers/review-1087.md`

The implementation is the uncommitted diff after `410b90e87` plus the new untracked files
`.llm/tools/agentic/claude/evaluator-model-guard.ts` and
`.llm/tools/agentic/claude/evaluator-model-guard_test.ts`.

Review against issue #1087's exact boundary:

1. Enforcement is on every spawned formal-evaluator model request, configured through the child
   environment, not prompt text.
2. Only `OPEN_EVALUATOR_MODEL_IDS` is accepted, with no duplicated model-id authority.
3. A prohibited or missing model fails closed, aborts the evaluator, exits non-zero, and records a
   credential-blind audit event containing the prohibited model and actual requesting session.
4. Ordinary non-evaluator Claude/OpenRouter presets retain their existing behavior.
5. Streaming/forwarding, launch and resume session identity, server teardown, spawn failures, and
   races cannot bypass the guard or leave the evaluator alive.
6. Existing route invariants remain green, including `formal evaluator rejects the Gemini
   documentation-authoring generator lane` and the volatile-value guard.

Observed author gates:

- Focused policy/guard set: 47 passed, 0 failed.
- Complete `.llm/tools/agentic/` suite: 329 passed, 0 failed.
- Scoped check: 129 files, 0 findings.
- Scoped lint: 129 files, 0 findings.
- Scoped fmt after formatting: 129 files, 0 findings.

Inspect the implementation and tests directly. Your artifact must contain:

- `Verdict: PASS` or `Verdict: FAIL_FIX`.
- Findings ordered by severity with file/line evidence.
- Explicit assessment of the six boundaries above.
- Any gate you ran and its observed result.

Do not spawn sub-agents or workflows. Do not modify any file except the named review artifact.
