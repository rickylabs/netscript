use harness

## SKILL

- `netscript-harness` — apply the formal IMPL-EVAL protocol and evidence standard.
- `netscript-tools` — independently rerun focused gates and verify raw git/remote/lock hygiene.
- `openhands-handoff` — verify model, PAT chain, trigger, output, prompt, and dedupe contracts
  without dispatching OpenHands.
- `netscript-pr` — verify draft PR #806 body, phase trail, exact taxonomy, milestone, and no-merge
  state.
- `rtk` — keep read-heavy git/search inspection compact.

Act only as the separate formal IMPL-EVAL session for run
`.llm/runs/ci-docs-openhands-gate--docs-accuracy/` in `/home/codex/repos/b10-docsgate`, branch
`ci/docs-openhands-gate`, draft PR #806.

Read the evaluator protocol, verdict definitions, run-loop, docs scope overlay, approved plan,
PLAN-EVAL, Design/worklog, context pack, drift, A1 slice review, PR body, the two committed slices,
and PR phase comments. Independently inspect committed `HEAD`
`4eeb44793c237fe3cccea8fbeb7734283ffe9a4f` and verify the remote explicit ref matches it. Re-run
focused read-only YAML/schema/prompt/mirror/model guard checks as useful.

Pay special attention to:

- `pull_request` opened/synchronize/labeled plus `type:docs` OR `area:docs`;
- an attributed `docs-eval:skip` job summary with every dispatch step short-circuited;
- exact `openrouter/minimax/minimax-m3`, closed-model hard failure, and PAT-only chained comment;
- trusted-base prompt loading, 100-iteration budget, full changed-doc review, quick executable
  tests, per-file verdicts, and blocking hallucinated verb/flag/path findings;
- exact-body/head-SHA unanswered dedupe and the existing runner's summary marker;
- labels/source/mirror consistency, no `deno.lock` or unrelated churn, and no new suppressions;
- harness order (PLAN-EVAL before implementation, A1 review before sign-off) and PR #806 remaining
  draft with milestone 13 and exactly the requested final labels including `status:impl-eval`.

OpenHands live dispatch is owner-prohibited and is N/A, not missing evidence. This is not a release
or package/plugin wave. Do not edit implementation, commit, push, comment, dispatch OpenHands, or
merge. Modify only `.llm/runs/ci-docs-openhands-gate--docs-accuracy/evaluate.md`, using the
template, with evidence for every PASS/N/A row. End with exactly one verdict: `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`.
