use harness

## SKILL

Read and follow root `AGENTS.md`, `netscript-harness`, `netscript-tools`, `netscript-pr`, and `rtk`.
Read the parent run's complete `research.md`, `plan.md`, `plan-eval.md`, `worklog.md`, `drift.md`,
and S1 implementation evidence before reviewing.

Act as a fresh, independent ordinary adversarial reviewer for S1 of issue #1338 / draft PR #1339.
This is the explicit owner-authorized OpenRouter Grok 4.5 temporary review route because the Claude
plan is exhausted until Saturday. It is advisory `REVIEW`, not PLAN-EVAL or IMPL-EVAL.

First verify and print exact local HEAD, authoritative remote branch head, and PR head. Review the
current exact clean PR target against base `canary/0.0.5-canary.14`, focusing on implementation
commit `22d7d980f22ed3b30500c897de1c71947a97a0de` and its six typed source/test files. Confirm:

1. formal PLAN-EVAL remains Minimax M3 high;
2. formal IMPL-EVAL resolves DeepSeek V4 Flash 0731 max through `claude-openrouter`;
3. Qwen 3.8 is absent from active formal evaluator allowlists/presets and retained only as a
   centralized generic literal or explicit negative fixture where justified;
4. stale/cross-phase/well-formed retired-Qwen inputs fail closed;
5. typed config/preset/policy/tests agree without weakening open-only or session-independence guards;
6. no package/plugin, release/publication, historical #1331 evidence, or `deno.lock` scope leaked.

Inspect the diff and existing gates. You may run read-only or explicitly lockless focused checks,
but do not edit any repository file, stage, commit, push, comment on GitHub, change labels, launch
another agent, start S2/S3, or touch `deno.lock`. Emit the complete review to stdout beginning
exactly `**[PHASE: REVIEW] [VERDICT: PASS]**` or
`**[PHASE: REVIEW] [VERDICT: CHANGES_REQUESTED]**`. Include requested/observed provider/model/
effort, exact reviewed head, prioritized concrete findings with file/symbol evidence, validation,
lock observation, and next action. Never call the result a formal evaluator verdict.
