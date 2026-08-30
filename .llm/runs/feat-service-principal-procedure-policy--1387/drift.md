# Drift Log: #1387 typed principal and procedure policy

Drift is append-only. Record facts that diverge from the plan, issue, doctrine, or current-state
documentation.

## 2026-08-30 — Worktree branch was behind current main

- **What:** The existing leaf branch pointed at `13878a80`, behind fetched `origin/main`.
- **Source:** `git fetch origin main feat/sdk-procedure-meta` and branch ancestry inspection.
- **Expected:** Research re-derived on current main.
- **Actual:** The branch had no local/remote commits and was safely fast-forwarded to
  `625447f1b521e7fb0208fcfcc4ad3ea86cf52e21` before research.
- **Severity:** minor
- **Action:** fix
- **Evidence:** clean Git status and baseline recorded in `supervisor.md`.

## 2026-08-30 — Mandatory metadata dependency is not merged

- **What:** #1466 has an implemented, separately evaluated branch but PR #1731 remains open.
- **Source:** GitHub #1466 / PR #1731; comparison of `origin/main` and
  `origin/feat/sdk-procedure-meta`.
- **Expected:** The binding `NetScriptProcedureMeta.access.authentication` vocabulary might already
  be on main.
- **Actual:** Main has no `NetScriptProcedureMeta`; implementation must wait.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `research.md` findings 7-9; Slice 0 hard precondition in `plan.md`.

## 2026-08-30 — Router-rename acceptance conflicts with contract-local metadata

- **What:** The issue asks for a router rename to break a contract policy at compile time.
- **Source:** #1387 acceptance list and #1466's procedure-local metadata shape.
- **Expected:** A negative compile-time test might be possible.
- **Actual:** A policy attached to the procedure moves with it. Making a rename break policy
  requires a second key/path-indexed declaration and recreates the drift defect.
- **Severity:** architectural
- **Action:** propose-update
- **Evidence:** `research.md` negative-test feasibility and LD-11 in `plan.md`; PLAN-EVAL must
  explicitly adjudicate the corrected proof.

## 2026-08-30 — RTK is unavailable on this host

- **What:** The required RTK skill was read, but the `rtk` executable is not on `PATH`.
- **Source:** `rtk ls` returned `command not found`.
- **Expected:** Read-heavy Git/search commands could use RTK compression.
- **Actual:** Focused `rg`/Git commands and repo-native structured Deno wrappers were used directly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Gate commands and results in `worklog.md`; no command semantics were substituted.

## 2026-08-30 — Candidate documentation and plugin publish gates are red at base

- **What:** Several plausible public-surface gates fail before any branch change.
- **Source:** Base runs of `run-deno-doc-lint.ts` and `audit-jsr-package.ts`.
- **Expected:** Candidate gates would be evaluated before contracting them.
- **Actual:** Contracts/plugin/SDK/MCP doc lint report 9/15/3/2 existing private-type-reference
  findings; plugin JSR audit reports four existing missing `@module` tags. Service doc lint and the
  other four JSR audits are green.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Base gate census in `research.md`; red candidates are excluded from `plan.md`.
