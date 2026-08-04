# Drift Log: fresh/sdk cache-tier convergence

Drift is append-only.

## 2026-08-04 — Pre-existing lockfile change is outside slice ownership

- **What:** The dispatched worktree contained a modified `deno.lock` before task work.
- **Source:** Raw `git status` and `git diff -- deno.lock` at bootstrap.
- **Expected:** Clean dispatched worktree.
- **Actual:** One added `jsr:@netscript/queue@0.0.4` dependency row.
- **Severity:** minor
- **Action:** accept as user-owned state; never stage, revert, or attribute it to this PR.
- **Evidence:** `research.md` re-baseline and raw bootstrap output.

## 2026-08-04 — Branch re-baselined by fast-forward

- **What:** The supplied branch pointed three commits behind current `origin/main` and had no local commits.
- **Source:** `git rev-list --left-right --count origin/main...HEAD` returned `3 0`.
- **Expected:** Implementation branch based on current main.
- **Actual:** Baseline was `3a267aef1`; current main was `9bcfd18f2`.
- **Severity:** minor
- **Action:** fix via `git merge --ff-only origin/main` before plan lock; preserve the dirty lockfile.
- **Evidence:** `supervisor.md` baseline; raw merge/status output.

## 2026-08-04 — Milestone evaluator composition overrides local formal PLAN-EVAL

- **What:** Standard run-loop calls a separate local PLAN-EVAL; owner brief forbids it for this milestone PR.
- **Source:** Owner brief, `workflow/milestone-run.md`, orchestrator ruling D6.
- **Expected:** Separate-session local PLAN-EVAL before implementation.
- **Actual:** PLAN-EVAL is composed per milestone workflow; plan inputs remain locked before source work.
- **Severity:** minor
- **Action:** accept authorized override; retain draft→ready augment, OpenHands, and orchestrator pre-merge evaluation composition.
- **Evidence:** `supervisor.md`; `plan-eval.md`.

## 2026-08-04 — Current package audit baseline is not clean

- **What:** Current main has existing doc-lint/JSR findings in both affected packages.
- **Source:** Structured doc-lint and `audit-jsr-package.ts` runs before source edits.
- **Expected:** Historical doctrine notes suggested Fresh doc lint had once been clean.
- **Actual:** Fresh reports 44 structured diagnostics and audit findings; SDK reports one transitive diagnostic plus warnings.
- **Severity:** minor
- **Action:** accept as no-deepening baseline; do not expand #1252 into unrelated remediation.
- **Evidence:** `research.md` JSR scan; `worklog.md` baseline gate rows.

## 2026-08-04 — Main advanced during draft creation

- **What:** Two unrelated service/MCP fixes landed after S0 pushed and before source work began.
- **Source:** PR base SHA `26fe0da9b`; `git rev-list origin/main...HEAD` after draft creation.
- **Expected:** Locked baseline `9bcfd18f2` remained current through bootstrap.
- **Actual:** Current main advanced to `26fe0da9b` without touching Fresh/SDK.
- **Severity:** minor
- **Action:** rebase the single S0 commit with autostash, restore the user lock edit, and force-update
  only with an explicit remote-SHA lease and explicit refspec.
- **Evidence:** rebased S0 `e39c9c4d7`; remote prior SHA `45a402198`; explicit lease push output.
