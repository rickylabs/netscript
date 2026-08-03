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

## 2026-08-03 — Ordinary review primary route unavailable

- **What:** The installed Claude CLI rejected the policy-configured Fable model id before the
  slice-1 ordinary review began.
- **Source:** `review_codex` launch exit 1, API 404 `model_not_found`.
- **Expected:** Claude Fable low ordinary review.
- **Actual:** No review turn and no file changes; policy-declared Claude Opus low fallback available.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Use the `review_codex` `token_limit_fallback` entry from
  `workflow/lane-policy.md` / `runtime/routing-policy.ts`; opposite-family invariant remains intact.

## 2026-08-03 — IMPL-EVAL transport retries were guard-clean

- **What:** The first IMPL-EVAL launch omitted the runtime profile's OpenRouter source-to-Claude
  credential mapping and received 401 before a turn. The next guarded Qwen attempt tried to spawn a
  closed-model lookup child, which the evaluator model guard terminated before a verdict.
- **Source:** local Claude Code evaluator launch transcripts; evaluator policy audit guard.
- **Expected:** One complete open-model Qwen parent evaluation turn.
- **Actual:** Neither failed attempt produced a verdict or source change. A tightened no-delegation
  parent-only Qwen retry completed and wrote `evaluate.md` with `PASS`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Final evaluator session records model `qwen/qwen3.7-max`, guard enabled, full gate
  execution, and exact `PASS`; no closed-model evaluator work was admitted.
