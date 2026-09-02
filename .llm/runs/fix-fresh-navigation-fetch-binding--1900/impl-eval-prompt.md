use harness

# IMPL-EVAL — #1900 captured platform fetch receiver

You are the formal IMPL-EVAL evaluator. This is a fresh, opposite-family native Claude session.
The implementation and the prior Tier-A slice review were performed by other sessions. Evaluate;
do not continue implementation and do not edit either product file.

## SKILL

- `netscript-harness` — evaluator protocol, verdict rules, tracked evidence, close-gate.
- `deno-fresh` — Fresh 2.3.3 partial-navigation semantics.
- `netscript-doctrine` — `packages/fresh` Archetype 4 gates and public surface.
- `netscript-tools` — structured focused validation and lock hygiene.
- `netscript-pr` — close-gate and phase-evidence contract.
- `jsr-audit` — package publication evidence interpretation.
- `claude-manager` — native-session identity and handoff record.

## Target

- Repository: `/home/agent/projects/netscript/worktrees/007-leaf-1900`
- Run: `.llm/runs/fix-fresh-navigation-fetch-binding--1900/`
- PR: `rickylabs/netscript#1904`
- Evaluated implementation/review head: `5a21b1013eaafb4aa3341704902b731e9b463ddc`
- Base: `e938ecd31fd1c909f23bb7dd60029a302ce8d428`

Read completely before evaluating:

1. `.agents/skills/netscript-harness/SKILL.md`
2. `.agents/skills/deno-fresh/SKILL.md`
3. `.agents/skills/netscript-doctrine/SKILL.md`
4. `.agents/skills/netscript-tools/SKILL.md`
5. `.agents/skills/netscript-pr/SKILL.md`
6. `.agents/skills/jsr-audit/SKILL.md`
7. `.llm/harness/evaluator/protocol.md`
8. `.llm/harness/evaluator/verdict-definitions.md`
9. `.llm/harness/workflow/run-loop.md`
10. the selected Archetype 4 profile and frontend overlay named by the run
11. all existing tracked artifacts in the run directory, especially `plan.md`, `worklog.md`,
    `context-pack.md`, `drift.md`, and `slice-review.md`
12. the exact base-to-head diff and commit list

The issue contract deliberately selects `PLAN-EVAL: N/A` because this was a pre-diagnosed,
mechanical, one-line receiver fix plus its regression. Verify that the N/A decision was recorded
before implementation and is justified; do not require a nonexistent `plan-eval.md` when it is.

## Required independent verification

- Confirm `originalFetch` remains the raw function for exact-identity restoration while the two
  transport call sites use a callable bound to the actual browser receiver (`globalThis`).
- Confirm the new regression double genuinely throws on detached invocation and exercises both the
  intercepted partial-navigation path and the pass-through path.
- Confirm drain-never-abort and EOF-awaiting disposal semantics are unchanged. Production
  navigation must contain zero `.abort(`, `AbortController`, or `.cancel(`.
- Confirm product scope is exactly `coordinator.ts` and `coordinator_test.ts`; `deno.lock`,
  `mod.ts`, `types.ts`, and `keyed-partial.tsx` are unchanged.
- Confirm the navigation entrypoint remains exactly 7 exported symbols (2 values, 5 types).
- Independently rerun the smallest useful focused structured tests/checks. Do not run Chromium,
  Docker, Aspire, or `e2e:cli`; hosted `fresh-browser` proof is explicitly supervisor-owned.
- Interpret the already-reproduced full-package `doc:lint` result accurately: 45 diagnostics in
  unrelated builders/query/route/streams sources, zero in navigation. Determine whether it is
  baseline drift or a blocker under the approved bounded issue contract; do not repair it here.
- Verify PR #1904 has `Closes #1900`, the #1895 handoff note, required opening metadata, and that
  issue #1900 contains no unchecked acceptance or `gate:` boxes. Hosted browser proof remains an
  explicit follow-up and must not be claimed as locally run.

## Output and mutation boundary

Write `.llm/runs/fix-fresh-navigation-fetch-binding--1900/evaluate.md` from the harness template
with evidence in every PASS row and an exact verdict from `verdict-definitions.md`. Append a concise
IMPL-EVAL entry to `worklog.md`. Do not edit product code, PR metadata, or GitHub. Do not commit or
push; the supervising session will review and commit the evaluator-owned artifacts after you exit.

If any command would violate the local gate prohibition, mark it `NOT_RUN` with the ownership
reason. Report your evaluator session id, provider/model/effort, verdict, findings, and files written
in the final response.
