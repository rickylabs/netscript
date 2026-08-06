use harness

## SKILL

- `netscript-harness`: enforce separate ordinary review, exact-target identity, and evidence rules.
- `netscript-tools`: use trustworthy read-only diff and focused gate evidence.
- `netscript-pr`: emit one structured PR review comment without changing lifecycle state.
- `rtk`: compress read-heavy Git/GitHub inspection.

Act as the fresh, independent ordinary adversarial reviewer for S1 of issue #1338 / draft PR #1339.
This is an owner-authorized temporary OpenRouter Grok 4.5 review route because the Claude plan is
exhausted until Saturday. It is **not** PLAN-EVAL or IMPL-EVAL and cannot substitute for either.

Review the exact current PR head and report its full SHA before judging. The implementation commit
to scrutinize is `22d7d980f22ed3b30500c897de1c71947a97a0de`; compare it with PR base
`canary/0.0.5-canary.14` and focus on the S1 typed route/test changes. Verify:

1. formal PLAN-EVAL remains Minimax M3 high;
2. formal IMPL-EVAL resolves DeepSeek V4 Flash 0731 max through `claude-openrouter`;
3. Qwen 3.8 is absent from the active formal allowlist/preset but retained only where justified;
4. stale/cross-phase/well-formed retired-Qwen inputs fail closed;
5. typed policy/config/tests agree without weakening open-model or independence guards;
6. no package/plugin, release, publication, historical #1331 evidence, or `deno.lock` scope leaked.

Inspect the diff and existing S1 gate evidence. You may run read-only or lockless focused validation,
but do not edit files, commit, push, change labels, launch another agent, or post outside the
workflow-owned PR summary. Findings must be concrete, prioritized, and cite file/line or exact
symbol. Distinguish blocking correctness findings from optional observations. Write the required
`OPENHANDS_SUMMARY_PATH` artifact and have the workflow publish a PR comment beginning exactly:

`**[PHASE: REVIEW] [VERDICT: PASS]**`

or

`**[PHASE: REVIEW] [VERDICT: CHANGES_REQUESTED]**`

Include requested/observed model and effort, exact reviewed head, findings, validation, lock-scope
observation, and next action. Never call this a formal evaluator verdict.
