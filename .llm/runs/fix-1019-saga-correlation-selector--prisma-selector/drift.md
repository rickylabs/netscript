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

## 2026-08-02 — test-only Prisma pins remain inline

- **What:** S3 pins the Prisma CLI, generated client runtime, and PostgreSQL adapter to exact 7.8.0
  inside the integration test instead of adding `catalog:` imports to the package member.
- **Source:** Owner binding in `review-fixes-brief.md`; `netscript-deno-toolchain` catalog law.
- **Expected:** Review requires exact lockstep without widening the published package dependency
  surface or re-litigating the proven 7.8.0 version.
- **Actual:** Static adapter import is an exact inline npm specifier; CLI/client string specifiers
  derive from `PRISMA_VERSION`. The ungated self-source test enforces all three.
- **Severity:** minor
- **Action:** accept; no dependency bump and no `deno task deps:latest` lookup is needed because
  staleness is explicitly out of scope.
- **Evidence:** `prisma-saga-store_integration_test.ts`; exact lock entries in `deno.lock`.
