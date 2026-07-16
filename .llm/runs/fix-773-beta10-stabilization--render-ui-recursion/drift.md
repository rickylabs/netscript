# Drift Log: fix #773 — render_ui recursion hole

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-16 — Evaluator dispatch delegated to supervisor

- **What:** This Tier-D implementation session will not dispatch PLAN-EVAL or IMPL-EVAL.
- **Source:** Explicit owner instruction in the slice prompt.
- **Expected:** The generic harness run-loop dispatches PLAN-EVAL before implementation.
- **Actual:** The owner-directed supervisor triggers all evaluations; this lane produces normal
  `plan.md` and `worklog.md` only.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and recorded override.

## 2026-07-16 — Frontend guide absent

- **What:** The frontend overlay's additional-read file `.claude/05-frontend.md` is not present.
- **Source:** `.llm/harness/archetypes/SCOPE-frontend.md` and focused filesystem search.
- **Expected:** The overlay names the file as additional guidance.
- **Actual:** No matching file exists in the checkout.
- **Severity:** minor
- **Action:** defer
- **Evidence:** filesystem search returned no paths; Fresh 2.x skill and package-local guidance were
  used instead.
