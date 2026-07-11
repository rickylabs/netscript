# Drift Log: `@netscript/ai/skills`

## 2026-07-11 — D1: PLAN-EVAL owner-waived

- **What:** Implementation proceeds after recording plan/design without a separate PLAN-EVAL.
- **Source:** User slice brief: “PLAN-EVAL owner-waived (carried drift D1)”.
- **Expected:** Harness normally requires separate-session PLAN-EVAL PASS.
- **Actual:** Owner explicitly waived that pass for this WSL implementation slice.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md`, and `worklog.md` retain the full checkpoint.

## 2026-07-11 — Older package path mapped to current layout

- **What:** Issue references older `ai-core` / `plugin-ai-core` paths.
- **Source:** Issue #246 and slice brief.
- **Expected:** Work under the referenced older path.
- **Actual:** Workspace metadata and `deno doc` establish `packages/ai` as `@netscript/ai`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `/home/codex/repos/ns-b8-246/deno.json`, `packages/ai/deno.json`,
  `packages/ai/mod.ts`.
