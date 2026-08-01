# Drift Log: Prisma saga correlation selector

## 2026-08-01 — owner-authorized fix-train evaluator route

- **What:** Owner instruction routes 0.0.3 fix-train PLAN-EVAL/IMPL-EVAL to the Opus 5 supervisor.
- **Source:** Owner authorization in the 2026-08-01 supervisor thread.
- **Expected:** The initial run record assumed the heavyweight open-model formal-evaluation route.
- **Actual:** The owner-authorized opposite-family ladder applies: Codex/GPT implements and a
  separate Opus 5 session evaluates. The supplied PLAN-EVAL artifact is authoritative and restored.
- **Severity:** significant
- **Action:** accept owner route override; PLAN-EVAL PASS with mandatory C1-C3; proceed.
- **Evidence:** `plan-eval.md` and owner authorization; PR #1032 Plan-Gate update.
