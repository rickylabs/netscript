# Drift Log: fix #782 — Preact Windows dedupe

Drift is append-only.

## 2026-07-16 — Supervisor-owned evaluator and attachment state

- **What:** The implementation session was directly supplied by the owner and must not dispatch
  PLAN-EVAL or IMPL-EVAL. The current Codex thread id is available, while the agentic runtime reports
  zero daemon-managed sessions.
- **Source:** Owner constraint; `CODEX_THREAD_ID`; `deno task agentic:runtime status`.
- **Expected:** Default Tier-D harness launches normally record a daemon-managed remote-control
  attachment and perform evaluator handoffs through the supervisor workflow.
- **Actual:** Thread `019f6ca5-1cd3-78f0-bee0-f682e74c49a1` is active in the owner-provided worktree,
  but no daemon attachment is observable and both evaluator passes are explicitly supervisor-owned.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; runtime status `sessions: 0`.

## 2026-07-16 — Native-Windows sensitivity of production fixture

- **What:** The controlled Vite production fixture used exact `C:\\...` and `C:/...` hooks IDs,
  but Linux Vite normalized the backslash form before the fixture loader even on pre-fix code.
- **Source:** Red test run before editing `vite.ts`; the direct resolver/config assertions failed
  while the modeled hooks patch count was already `[1,1]` on Linux.
- **Expected:** The controlled production graph would retain two IDs on every host before the fix.
- **Actual:** The real issue remains Windows-specific. Cross-platform red evidence comes from the
  direct plugin-hook simulation; the production fixture remains the exact native-Windows build
  shape and also proves config merging everywhere.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` red/green results and `vite.test.ts`.

## 2026-07-16 — Unrelated baseline gate findings

- **What:** The exact repository `quality:scan` command fails on two untouched plugin files, and
  structured Fresh doc-lint reports 25 diagnostics in the untouched route contract type file.
- **Source:** `deno task quality:scan`; `deno task doc:lint --root packages/fresh --pretty`.
- **Expected:** The planned gates were expected to be clean repository/package verdicts.
- **Actual:** Scoped quality over `packages/fresh/src/application/vite` passes with zero findings;
  the two repository quality files are unchanged from baseline. The changed `./vite` doc-lint
  entrypoint has zero findings; all 25 package diagnostics are existing route-contract debt already
  tracked by doctrine file 10. Publish dry-run passes.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `git diff --quiet 0daa575b -- <finding files>` exit 0; scoped quality JSON; doc-lint
  entrypoint attribution in `worklog.md`.
