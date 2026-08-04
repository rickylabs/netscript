# Drift — OMB S6

## 2026-08-04 — registry baseline differs from staged brief

- **Severity:** significant
- **Expected:** 17 live tool names, producing 20 after this slice.
- **Observed:** remote `origin/main` at `f7558aa1c` has 14 names in `TOOL_NAMES`; issue 1132 also
  specifies 14→17. S4 added the projection subpath, not three registry tools.
- **Disposition:** implement exactly the three issue tools and record the truthful 14→17 delta.
  Do not invent unrelated placeholder tools.

## 2026-08-04 — milestone evaluator composition

- **Severity:** procedural
- **Authority:** owner staged brief, milestone-run.md § Evaluator protocol, orchestrator ruling D6.
- **Disposition:** no local formal PLAN-EVAL/IMPL-EVAL. Record composed waiver rows; use
  draft→ready augment + OpenHands + orchestrator pre-merge gate, retaining opposite-family code
  review.
