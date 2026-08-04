# Drift log — feat-openapi-mcp-evidence-receipts-s10--1136

## 2026-08-04 — milestone PLAN-EVAL composition waiver

- **Severity:** minor / process.
- **Expected by default run loop:** a separate local formal PLAN-EVAL before implementation.
- **Actual:** PLAN-EVAL is composed per `milestone-run.md` (orchestrator waiver); the owner brief
  explicitly cites ruling D6 and requires the plan to lock before same-run implementation.
- **Effect:** `plan-eval.md` records the composed checklist without claiming evaluator PASS.

## 2026-08-04 — pre-existing lockfile change

- **Severity:** none / unrelated workspace state.
- **Observed:** `deno.lock` contains one uncommitted added line before run artifacts or source work.
- **Handling:** preserve it, do not stage it, and verify it remains the only lockfile diff.

