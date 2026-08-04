# Drift Log: OMB S9 activation surfaces and migration fixture

## 2026-08-04 — Current registry supersedes issue lineage count

- **What:** The carried-in issue/design describes the prior server as 14 tools; current main has 21.
- **Source:** `packages/mcp/tests/registry_test.ts`, `packages/mcp/tests/stdio_test.ts`, live source.
- **Expected:** Historical 14-tool state from #1135 lineage.
- **Actual:** 21 tools after S6, S7, and #1218.
- **Severity:** minor
- **Action:** accept
- **Evidence:** current `TOOL_NAMES`; instructions and fixtures will not assert the stale count.

## 2026-08-04 — Milestone PLAN-EVAL waiver

- **What:** No local formal PLAN-EVAL is launched for this per-PR milestone slice.
- **Source:** owner prompt citing `milestone-run.md` evaluator protocol and ruling D6.
- **Expected:** standard run-loop separate PLAN-EVAL.
- **Actual:** Plan-Gate rows composed and locked under orchestrator waiver; same-run implementation.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `supervisor.md`.
