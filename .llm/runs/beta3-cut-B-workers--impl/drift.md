# Drift Log: workers health entrypoint #376

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state documentation.

## 2026-07-05 — Implementation lane launched without separate PLAN-EVAL

- **What:** The WSL Codex session was launched directly as an implementation agent with instructions to implement #376 and justify the selected fix in-plan before source edits.
- **Source:** User/coordinator prompt in this session.
- **Expected:** Harness run-loop normally requires separate-session PLAN-EVAL PASS before implementation.
- **Actual:** No run directory or PLAN-EVAL artifact existed on branch; implementation authorization was explicit in the prompt.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, `research.md`, `plan.md`, and `worklog.md` created before source edits; IMPL-EVAL remains required before merge-readiness.

## 2026-07-05 — Health job sourceUrl file was published but not exported

- **What:** IMPL-EVAL found the package `sourceUrl` target was included in the publish file list but missing from the `deno.json` exports map, so `jsr:@netscript/plugin-workers/jobs/health-check.ts` would not resolve in prod/JSR mode.
- **Source:** Binding evaluator finding on PR #469.
- **Expected:** A package subpath used in `sourceUrl` must have an identical explicit JSR export-map key.
- **Actual:** `plugins/workers/deno.json` had `jobs/**/*.ts` in `publish.include` but no `./jobs/health-check.ts` export.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Added `./jobs/health-check.ts` export, export-map regression test in `plugins/workers/services/src/init_test.ts`, and clean raw `deno doc --lint plugins/workers/jobs/health-check.ts`.

## 2026-07-05 — Self-referential jsr sourceUrl bypassed local-source scaffolds

- **What:** Merge-readiness E2E found the health-check job still failed to complete in a local-source scaffold because the stored `jsr:@netscript/plugin-workers/jobs/health-check.ts` specifier bypassed the generated app import map and resolved to the latest published registry version.
- **Source:** Binding supervisor E2E failure report for PR #469.
- **Expected:** Maintainer/local mode resolves built-in plugin jobs from the workspace without network or previous-publish dependence.
- **Actual:** The `jsr:` sourceUrl went to the registry and hit `0.0.1-beta.2`, which cannot export the new job subpath.
- **Severity:** critical
- **Action:** fix
- **Evidence:** Keep the stored URL-shaped `jsr:@netscript/plugin-workers/jobs/health-check.ts` sourceUrl, add exact scaffold import-map entries for local and JSR modes, and run full `scaffold.runtime` once after the fix.
