# Drift Log: issue #569 Hono OTel instrumentation

## 2026-07-08 — Existing draft PR is plan-eval only

- **What:** PR #570 exists, but its head branch is `openhands/569-1`, not
  `feat/569-telemetry-hono-otel`.
- **Source:** `gh pr view 570 --json headRefName,isDraft,body,labels,milestone`.
- **Expected:** Implementation PR should be opened from `feat/569-telemetry-hono-otel`.
- **Actual:** The existing PR is a PLAN-EVAL automation artifact with no labels or milestone.
- **Severity:** minor
- **Action:** accept and open/update a proper implementation PR after the first feature-branch commit.
- **Evidence:** PR #570 metadata.

## 2026-07-08 — oRPC child-span wording is ahead of current main

- **What:** Current `origin/main` oRPC telemetry is enrich-only and does not import `@orpc/otel`.
- **Source:** `packages/telemetry/src/orpc/tracing-plugin.ts` and issue #569 PLAN-EVAL notes.
- **Expected:** Acceptance prose references an existing oRPC child span.
- **Actual:** Current code enriches the active span; the Hono slice can only guarantee downstream
  active context so future or external child spans parent under the Hono span.
- **Severity:** minor
- **Action:** preserve oRPC behavior and test downstream active-span parenting without changing oRPC.
- **Evidence:** `TracingPlugin` uses `trace.getActiveSpan()` and never starts spans.
