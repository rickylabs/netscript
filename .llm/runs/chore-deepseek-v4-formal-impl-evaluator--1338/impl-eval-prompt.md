use harness

## SKILL

Read and follow root `AGENTS.md`, `netscript-harness`, `netscript-tools`, `netscript-pr`, and `rtk`.
Read this run's `research.md`, `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, and
`drift.md`, plus the canonical IMPL-EVAL protocol and verdict definitions.

Act as the fresh separate mandatory formal IMPL-EVAL for issue #1338 / draft PR #1339. This is the
local `claude-openrouter` print transport with requested model
`deepseek/deepseek-v4-flash-0731`, effort `max`, bypass permissions. Do not edit repository files.

First verify exact local HEAD, authoritative remote branch head, and PR head are identical and the
worktree is clean; record the full SHA and `deno.lock` HEAD/worktree blob. Evaluate the complete PR
diff against `canary/0.0.5-canary.14`. The owner intentionally kept this a small prerequisite:

- pending/future formal IMPL-EVAL primary is DeepSeek V4 Flash 0731 max;
- formal PLAN-EVAL primary remains Minimax M3 high;
- PLAN-EVAL is conditional for complex/decision-heavy work; small/mechanical work records N/A;
- IMPL-EVAL remains mandatory unless the owner explicitly waives it;
- OpenHands is paused until its trigger path is fixed; local evaluation is used;
- explicit OpenRouter-limit fallback is a fresh AGY/Google `gemini-3.6-flash-high` high session;
- completed Qwen evidence remains immutable and retired Qwen formal routes fail closed;
- canonical typed policy, tests, harness docs, skills, generated Claude mirrors, and run evidence
  converge; no package/plugin/release/publication/`deno.lock` scope.

Independently inspect the implementation and existing gate/canary evidence. Run only read-only or
explicitly lockless focused validation needed to substantiate the verdict. Verify the exact live
DeepSeek canary PASS is recorded and the AGY fallback is machine-bound but not selected while
OpenRouter is healthy. Check PR close-gate readiness without merging or changing GitHub state.

Emit the complete evaluator-authored `evaluate.md` body to stdout with requested/observed model,
effort, bypass, fresh session id, exact target, gate table, concrete findings, lock evidence, and
exactly one terminal verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`. Do not implement
fixes, commit, push, comment, label, merge, publish, or launch another session.
