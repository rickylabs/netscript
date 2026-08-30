use harness

# IMPL-EVAL — issue #1791 open-evaluator routing

You are the mandatory fresh, separate-session implementation evaluator. Evaluate the exact published
head `d9722b0b17a478af3db5bdafad87391a2ccbfd67` in worktree
`/home/agent/projects/netscript/worktrees/007-leaf-routing` for PR #1792. The generator was Codex /
OpenAI GPT-5.6 Sol high in thread `01a05481-a2ff-7632-809a-e478889e626e`; you are a distinct
Claude/OpenRouter session.

This evaluation deliberately dogfoods the product changed by this leaf: requested route OpenRouter /
`z-ai/glm-5.3-flash` / `max`, preset `claude-evaluator-glm-5-3-flash`. Treat that as a disclosed
dependency, not route-independent evidence. Verify the observed launch identity and record it in the
verdict.

Read, in order:

1. `.agents/skills/netscript-harness/SKILL.md` and the IMPL-EVAL protocol it routes to.
2. `.llm/harness/evaluator/protocol.md` and `verdict-definitions.md`.
3. Every artifact in `.llm/runs/chore-agentic-open-evaluator-routing/`, especially `research.md`,
   `plan.md`, `worklog.md`, `drift.md`, and `context-pack.md`.
4. The exact diff from owner base `a3ddcbb598f81180437e06f743e24d6ef137b101` through the current
   head, plus relevant source/tests/docs/workflows.

Independently verify acceptance, with special attention to:

- current selectors contain only Qwen 3.8 Flash and GLM 5.3 Flash for evaluator routing while all
  four retired preset identities still deserialize and cannot be selected for a new launch;
- formal PLAN/IMPL policy has one current OpenRouter row per phase and no complexity split;
- hybrid/gateway defaults, evaluator guard, distinct Deno task aliases, and effort defaults;
- static/live canary evidence records `--effort max`, output budget >=300, non-empty content, and
  requested-versus-observed route identity;
- policy/doc parity, OpenHands Qwen/GLM dispatch, and honest OpenHands effort-unavailable wording;
- source skill mirrors, workflow syntax/static behavior, volatile-ID guard, and `deno.lock` hygiene;
- the generator's full structured gate evidence and the small lint-gate remediation added to make
  genuine 165-file coverage green.

Run the smallest independent structured gates needed to verify those claims. Use `--no-lock` and do
not mutate `deno.lock`. Do not edit product source. Write the completed evaluator artifact to
`.llm/runs/chore-agentic-open-evaluator-routing/evaluate.md` using the repository template, with N/A
for package/plugin-only fitness rows. Include the exact evaluated head, evaluator session identity,
requested and observed provider/model/effort, findings, and one verdict: `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`.

End your response with exactly one machine-readable line: `IMPL_EVAL_VERDICT: <verdict>`.
