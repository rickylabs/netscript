# Supervisor — feat-runtime-shutdown-orchestrator--1231

- **Issue:** rickylabs/netscript#1231
- **Branch:** `feat/runtime-shutdown-orchestrator`
- **Worktree:** `/home/codex/repos/ns005-winmat`
- **Baseline:** `c384013662169046106ee9dd193ab8972beab3b4` (`FETCH_HEAD` from `origin/main`)
- **Implementation route:** OpenAI · GPT-5.6 Sol · medium
- **Evaluator route:** local Claude/OpenRouter · `qwen/qwen3.7-max` · high
- **Host:** WSL/Linux
- **Archetype:** 3 (runtime/behavior concern within `@netscript/service`)
- **Overlays:** service and docs
- **PLAN-EVAL:** `COMPOSED_WAIVER` under owner-specified milestone ruling D6

## Constraints

- Compose existing drain callbacks; do not introduce replacement service, worker, queue, or DB
  drain logic.
- One deterministic order and one app-wide budget.
- `Closes #1231` only with complete acceptance evidence and earned boxes.
- Preserve and exclude the pre-existing unrelated `deno.lock` modification.
- Draft PR first; explicit-refspec pushes; no upstream configuration.

