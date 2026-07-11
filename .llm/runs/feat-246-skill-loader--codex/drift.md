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

## 2026-07-11 — F-16 moved the skills entrypoint below package root

- **What:** Root `skills.ts` moved to `src/skills/mod.ts`.
- **Source:** The doctrine checker initially reported 13 package-root children.
- **Expected:** Mirror existing root subpath entry files.
- **Actual:** Direct `./skills` mapping to the role folder preserves the API and yields zero
  findings.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `packages/ai/deno.json`; final `FAIL=0 WARN=0 INFO=0`.

## 2026-07-11 — Semantic injection uses a structural provider view

- **What:** Options accept `SkillEmbeddingProvider`, satisfied structurally by
  `EmbeddingProviderPort`.
- **Source:** Raw doc-lint exposed unrelated transitive usage types from the full provider
  interface.
- **Expected:** Re-export the full embedding port from the skills subpath.
- **Actual:** A focused single-method view keeps the surface below the export ceiling and doc-clean.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `src/skills/domain/types.ts`; raw doc-lint exit 0.
