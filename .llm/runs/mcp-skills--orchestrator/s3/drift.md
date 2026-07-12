# Drift Log: `@netscript/mcp` S3

No drift recorded. This file is append-only.

## 2026-07-12 — PLAN-EVAL route fallback

- **What:** Two configured local opposite-family Claude PLAN-EVAL processes exited without stdout or the required verdict artifact; use an independent evaluator-session fallback.
- **Expected:** Local opposite-family session writes `plan-eval.md`.
- **Actual:** Both processes completed without the artifact.
- **Severity:** significant.
- **Action:** Preserve the separate-session invariant through the supervisor-authorized S1 fallback pattern; implementation remains blocked pending verdict.
- **Evidence:** `.llm/tmp/s3-plan-eval-prompt.md` and missing artifact after both attempts.

## 2026-07-12 — stream attribute ownership

- **What:** Stream constants are not exported by `@netscript/telemetry`; they live in `packages/plugin-streams-core/src/telemetry/attributes.ts`.
- **Expected:** All domain classifiers could rely on telemetry-package constants.
- **Actual:** Depending on the plugin package would invert framework layering.
- **Severity:** minor.
- **Action:** Use one documented MCP-owned namespace-prefix classification table; continue importing telemetry constants for specific value reads. Revisit if stream constants migrate into `@netscript/telemetry`.
