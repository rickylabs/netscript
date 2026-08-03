# Drift Log: OMB S8 existing-machinery correctness fixes

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-03 — Receipt wrapper location clarified

- **What:** The user brief names `mcp-server.ts` `withReceipt` near lines 96–112; current baseline
  defines `withReceipt` in `packages/mcp/cli.ts`, while `mcp-server.ts` owns output validation at
  the cited lifecycle point.
- **Source:** `packages/mcp/cli.ts:175-211`; `packages/mcp/src/application/runner/mcp-server.ts:96-116`.
- **Expected:** Receipt-ordering change centered on `mcp-server.ts`.
- **Actual:** Correctness requires a narrow wrapper/runner integration across both existing files.
- **Severity:** minor
- **Action:** fix
- **Evidence:** RFC S-15 already calls this a `withReceipt`/runner integration and anticipates both
  locations; scope remains ordering only.

## 2026-08-03 — First local PLAN-EVAL transport timed out

- **What:** The canonical guarded local evaluator launched on Claude Code + OpenRouter Qwen but hit
  the suite child-process timeout before writing `plan-eval.md`.
- **Source:** local evaluator outcome for command `plan-eval-1134`.
- **Expected:** A tracked `PASS` or `FAIL_PLAN` artifact.
- **Actual:** Transport exit 1 with diagnostic `timeout`; no verdict artifact and no tree changes.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Retry the same route with a concise prompt and a longer bounded process timeout;
  this is not counted as a `FAIL_PLAN` cycle because no evaluator verdict was emitted.
