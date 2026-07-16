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

## 2026-07-16 — Repository quality scan has unrelated baseline findings

- **What:** `deno task quality:scan` exits 1 on two existing plugin files.
- **Source:** scanner JSON output.
- **Expected:** The required framework quality scan would be green.
- **Actual:** The default scanner covers `packages/cli/src` and `plugins`, not `packages/fresh-ui`,
  and reports `plugins/streams/services/src/proxy.ts:180` plus
  `plugins/triggers/streams/producer.ts:34`. A focused Fresh UI scan passes with zero findings and
  zero allowances.
- **Severity:** minor
- **Action:** accept
- **Evidence:** worklog fitness-gate table; no touched file is in the failing scanner roots.
