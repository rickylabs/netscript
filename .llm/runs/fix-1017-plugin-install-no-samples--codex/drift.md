# Drift Log: `plugin install --no-samples`

## 2026-08-01 — all official plugin barrels are sample-dependent

- **What:** Workers, sagas, triggers, and streams barrels all re-export starter sample files.
- **Source:** `plugins/*/src/adapter/resources/barrel/{barrel.ts,barrel.stub.ts}`.
- **Expected:** The issue explicitly highlighted the workers barrel/runtime glue hazard and asked the
  same question for other structural resources.
- **Actual:** Runtime glue is sample-independent, but every one of the four barrels needs an empty
  no-samples form to remain structural and type-checkable.
- **Severity:** minor
- **Action:** fix
- **Evidence:** research findings 6–7 and plan decisions D2–D3.

## 2026-08-01 — local formal evaluator credential unavailable

- **What:** The canonical local `claude-openrouter` PLAN-EVAL launch exited before starting because
  `OPENROUTER_API_KEY` is unavailable on this host.
- **Source:** Bound formal evaluator launch through `.llm/tools/agentic/claude/claude-print.ts`.
- **Expected:** A separate Qwen open-model session writes `plan-eval.md` before implementation.
- **Actual:** No evaluator session was created and no verdict exists. The OpenHands handoff policy
  prohibits substituting cloud OpenHands for a local-machine run.
- **Severity:** significant
- **Action:** defer pending owner credential restoration or explicit written Plan-Gate waiver
- **Evidence:** launcher exit code 4, output `OPENROUTER_API_KEY unavailable`.
