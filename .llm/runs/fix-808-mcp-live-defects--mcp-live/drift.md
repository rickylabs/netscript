# Drift Log: fix #808 MCP live-validation blockers

Drift is append-only.

## 2026-07-17 — Owner waived formal evaluator dispatch

- **What:** PLAN-EVAL and IMPL-EVAL will not be launched for this run.
- **Source:** User directive: “Do NOT dispatch evals; do not merge.”
- **Expected:** Harness normally requires separate-session PLAN-EVAL before implementation and
  IMPL-EVAL after gates.
- **Actual:** `workflow/run-loop.md` permits an explicit written owner waiver at the Plan-Gate; the
  PR must remain draft at `status:impl-eval` without any claimed evaluator verdict.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `supervisor.md`, user brief, and final draft PR state.

## 2026-07-17 — Existing CLI subpath JSR diagnostics

- **What:** The MCP `./cli` export references five types that it imports but does not re-export.
- **Source:** `deno doc --lint packages/mcp/cli.ts`.
- **Expected:** The prior run context and wrapper combined summary described the full export map as
  clean.
- **Actual:** Raw Deno doc lint reports five `private-type-ref` errors; the structured wrapper's
  per-entry data sees them but its combined summary incorrectly returns zero.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` JSR scan; planned S3 entrypoint correction with no new API concept.

## 2026-07-17 — Main advanced during bootstrap

- **What:** `origin/main` advanced from `6e8528a0` to `7bc256a1` after the first bootstrap push.
- **Source:** GitHub PR base SHA and `git fetch origin main`.
- **Expected:** Initial local `origin/main` was current when the branch was created.
- **Actual:** PR #807 merged an MCP README-only change; the branch was rebased before source work.
- **Severity:** minor
- **Action:** accept
- **Evidence:** baseline fields in `supervisor.md`/`research.md`; PR #809 base SHA.
