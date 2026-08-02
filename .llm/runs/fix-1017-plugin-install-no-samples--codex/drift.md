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

## 2026-08-01 — evaluator credential dependency waived for the 0.0.3 fix train

- **What:** The owner designated the Opus supervisor to perform PLAN-EVAL and IMPL-EVAL and waived
  the open-model evaluator lane for this fix train.
- **Source:** Owner instruction and committed PLAN-EVAL at `6fb53e6bf`.
- **Expected:** The prior drift entry deferred on restoration of `OPENROUTER_API_KEY` or a waiver.
- **Actual:** The waiver is now explicit; `OPENROUTER_API_KEY` is no longer a dependency or blocker.
- **Severity:** minor
- **Action:** accept; resolved — do not retry the credential-bound evaluator for this run
- **Evidence:** `plan-eval.md` evaluator metadata and amendment result.

## 2026-08-01 — scaffold runtime blocked after scaffold gates by Aspire host timeout

- **What:** The single required `scaffold.runtime` run passed 14 gates, including all official
  plugin installs, then failed `database.init` because Aspire AppHost did not start within 300s.
- **Source:** CLI E2E raw report for `plugin-smoke-20260801-212420`.
- **Expected:** Full runtime suite exit 0.
- **Actual:** Exit 1 at infrastructure startup with missing `certutil` and certificate trust
  warnings; no #1017 scaffold assertion failed.
- **Severity:** minor
- **Action:** accept as environmental evidence; do not rerun or widen #1017 into Aspire repair
- **Evidence:** suite summary `passed=14 failed=1`, `database.init` duration 287455ms.
