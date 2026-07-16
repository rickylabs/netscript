# Drift Log: generated Fresh Markdown clean-runner build

## 2026-07-17 — Evaluator dispatch remains supervisor-owned

- **What:** This implementation lane will not launch PLAN-EVAL or IMPL-EVAL.
- **Source:** Explicit user constraint: “Do NOT dispatch your own evals.”
- **Expected:** Harness normally blocks implementation on a separate PLAN-EVAL pass.
- **Actual:** The owner reserved evaluator triggers to the supervisor while requesting this lane to
  implement, push, open the draft PR, and obtain the real CI gate.
- **Severity:** significant
- **Action:** accept as the written owner override; do not create verdicts or self-certify.
- **Evidence:** User prompt and `supervisor.md`.

## 2026-07-17 — Warm cache masked a deterministic clean-runner defect

- **What:** The original production-build test passes with the normal native-WSL Deno cache but
  fails with an isolated cache.
- **Source:** GitHub job `87754952044` and local isolated-`DENO_DIR` focused test.
- **Expected:** A generated Fresh build should not depend on prior cache contents.
- **Actual:** Both clean environments fail to resolve Fresh core's versioned
  `npm:@preact/signals@^2.5.1` import; the warm local environment passes.
- **Severity:** significant
- **Action:** fix at the package-owned Vite resolver and preserve the clean-runner regression.
- **Evidence:** `research.md` findings 2–5 and `worklog.md` baseline gates.

