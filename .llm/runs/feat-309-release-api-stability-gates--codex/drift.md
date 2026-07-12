# Drift Log: #309 release engineering and API-stability gates

Drift is append-only.

## 2026-07-12 — D1 PLAN-EVAL owner waiver

- **What:** PLAN-EVAL is waived before implementation.
- **Source:** Slice brief: “PLAN-EVAL owner-waived (carried drift D1)”.
- **Expected:** Harness normally requires separate-session `PASS`.
- **Actual:** Owner explicitly authorized plan-in-worklog then implementation.
- **Severity:** significant
- **Action:** accept; preserve complete plan/Design artifacts and require separate IMPL-EVAL.
- **Evidence:** `plan.md`, `worklog.md`, `plan-eval.md`.

## 2026-07-12 — D2 versioning doctrine filename differs

- **What:** The expected `docs/architecture/doctrine/10-versioning-*` surface does not exist.
- **Source:** Doctrine file/search inventory.
- **Expected:** Slice brief suggested file 10.
- **Actual:** Stability/semver policy lives in `02-public-surface.md`; file 10 is the codebase verdict.
- **Severity:** minor
- **Action:** accept placement in doctrine file 02 and record source alignment.
- **Evidence:** `docs/architecture/doctrine/02-public-surface.md`, `05-folder-structure.md`.

## 2026-07-12 — D3 daemon/thread identity is unobservable

- **What:** The agentic runtime could not associate this worktree with a daemon session/thread.
- **Source:** `deno task agentic:runtime status --worktree /home/codex/repos/ns-b9-309`.
- **Expected:** Tier-D mobile-visible proof includes a concrete thread ID and managed daemon state.
- **Actual:** Runtime reported `blocked`, zero sessions, and `MISSING_IDENTITY`; the brief supplies
  only orchestrator ID `09e5ae68`.
- **Severity:** significant
- **Action:** accept owner-launched implementation context, do not claim attachment, and retain the
  missing proof for evaluator review.
- **Evidence:** command output and `supervisor.md`.

## 2026-07-12 — D4 no PR surface by owner direction

- **What:** Harness per-slice PR comments cannot be created.
- **Source:** Slice brief: “Do NOT open PRs.”
- **Expected:** Draft-PR commit list plus per-slice comments form the commit trail.
- **Actual:** Only local commits, explicit refspec pushes, and worklog evidence are authorized.
- **Severity:** minor
- **Action:** accept; preserve per-slice commit/push evidence in the worklog.
- **Evidence:** `supervisor.md`, future commit hashes and push results.
