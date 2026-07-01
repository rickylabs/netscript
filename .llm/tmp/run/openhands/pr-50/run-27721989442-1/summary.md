# PLAN-EVAL summary — PR #50 / `plan-agentic-system-claude-native-hardening--agentic-system`

- **Verdict:** `PASS`
- **Evaluator:** OpenHands / openrouter/minimax/minimax-m3
- **Action run:** 27721989442
- **Run dir:** `.llm/tmp/run/plan-agentic-system-claude-native-hardening--agentic-system/`
- **Plan-EVAL deliverable:** `.llm/tmp/run/plan-agentic-system-claude-native-hardening--agentic-system/plan-eval.md`
- **PR comment body:** `.llm/tmp/run/plan-agentic-system-claude-native-hardening--agentic-system/pr-comment-body.md`

## Summary

PLAN-EVAL (read-only review) for PR #50 "docs(agentic): plan Claude-native hardening for S2 release workflow" (head commit `2857f552` "docs(agentic): add Claude-native supervision surface"). The plan is decision-complete; the design checkpoint in `worklog.md` matches the implementation slice; the gate set is appropriate for the docs / infrastructure / tooling surface (no package or plugin change). All 8 plan-gate boxes PASS (one is N/A: jsr-audit does not apply to non-package waves). The plan correctly defers WSL Codex replacement and Claude plugin packaging behind explicit parity evidence; no false mobile-visible agent claims were found. The `.claude/skills` mirror is current (17/17, no drift) and `agentic:sync-claude:check` / `agentic:check-claude` PASS.

## Changes

None. This is a read-only PLAN-EVAL review per the operational contract. The only files written by this session are the plan-eval deliverable and the PR comment body, both under `.llm/tmp/run/plan-agentic-system-claude-native-hardening--agentic-system/`, plus this summary. No code, no `deno.json` / `.agents/skills` / `.claude/` files were modified.

## Plan-Gate checklist (all PASS or N/A)

| Plan-Gate item | Result | Evidence |
|---|---|---|
| Research present and current | PASS | `research.md` re-baselines against `origin/feat/package-quality@d1a5f212` and `origin/main@531f2b46` (PR #49 S2 quality-lane merge). |
| Decisions locked | PASS | 5 architecture decisions in `plan.md` with rationale. |
| Open-decision sweep | PASS | 3 deferred items, all "safe to defer", none would force rework. |
| Commit slices | PASS | 5 in `plan.md`, 3 in `worklog.md`; slice 1 (`2857f552`) is on disk. |
| Risk register | PASS | 3 risks (mirror drift, CLI version variance, hook noise) with mitigations. |
| Gate set selected | PASS | 4 gates aligned with `SCOPE-docs.md` "Additional Gates". |
| Deferred scope explicit | PASS | Live remote-control behind `--live`; WSL Codex replacement deferred. |
| jsr-audit surface scan (pkg/plugin) | N/A | No package or plugin surface change. |

## Findings (informational — do not block the plan-gate; address in the next slice)

- **F-1 (LOW, forward-looking) — Hook lockfile-churn latent hazard.** `.claude/settings.json` PreToolUse and Stop hooks run `deno run --allow-env --allow-read --allow-write .llm/tools/agentic/claude-hook-log.ts` **without `--no-lock`**. The worklog's design intent ("Agentic Deno tasks use `--no-lock` because the tools have no external imports and should not normalize `deno.lock`") is honoured by all four `agentic:*` Deno tasks but NOT by the hooks. Empirically verified: running the hook 5× does NOT mutate `deno.lock` today (the hook script has zero imports, so Deno's lock resolution is a no-op). The hazard is forward-looking: any future change that adds an import to the hook script (or to any agentic tool the hook transitively loads) will cause `deno.lock` to be rewritten on every PreToolUse invocation across every Claude session in every worktree. Fix: add `--no-lock` to the hook `deno run` invocation in `.claude/settings.json` (both `PreToolUse` and `Stop` entries); add a regression check that asserts `deno.lock` is byte-identical after running the hook N times.
- **F-2 (MEDIUM, evidence hygiene) — Smoke gate evidence does not record the actual exit code.** `worklog.md` Gate Evidence shows `deno task agentic:smoke-claude-remote` as **PASS**, but the tool has no environment-detection and exits 1 in any environment where `claude` is not on PATH (CI / Linux containers / this evaluator session: `NotFound: Failed to spawn 'claude': entity not found`, exit code 1). The generator's environment must have had `claude` installed. The worklog should say so explicitly. As written, the gate table is misleading and will propagate a false positive. Fix: record the actual exit code and environment for every smoke run in `worklog.md`/`commits.md`; consider an `--env-aware` SKIP exit code in `claude-remote-smoke.ts`.
- **F-3 (RESIDUAL, not in PR) — `deno.lock` / scratch churn in this worktree.** Uncommitted `deno.lock` churn (281 lines, mostly catalog / npm transitive deps) and scratch under `.llm/tmp/run/openhands/`. The `2857f552` commit does NOT include this churn — verified via `git show --stat 2857f552`. Should be `git restore`d before the next slice.
- **F-4 (PROCESS, not a plan defect) — Plan-gate process discipline.** Slice `2857f552` was committed (Wed Jun 17 2026) before this PLAN-EVAL session ran, which violates `run-loop.md` § 4 and `plan-gate.md` "Why this gate exists". The slice itself is sound; the order was not. Workflow-level fix, not a plan fix.

## Validation

- `deno task agentic:sync-claude:check` — PASS (`OK .claude/skills: agentic:sync-claude OK: 17 skill(s), 17 mirrored file(s)`)
- `deno task agentic:check-claude` — PASS (`OK CLAUDE.md: contains @AGENTS.md / OK .claude/settings.json: valid JSON / OK .gitignore: ignores .claude/settings.local.json`)
- `deno task agentic:smoke-claude-remote` — exit code 1 in this evaluator environment (no `claude` on PATH; this is the F-2 evidence, not a gate failure)
- `deno run … .llm/tools/agentic/claude-hook-log.ts` — 5× in a row, `deno.lock` md5 unchanged (F-1 empirical check)
- `git show --stat 2857f552` — confirmed 23 tracked files, agentic surface only, no unrelated churn

## Responses to review comments or issue comments

None. The PLAN-EVAL session did not receive any PR review-thread replies or issue comments. The pre-existing `pr-review-comments.json` contains an empty array (no review threads yet). The pre-existing `issue-comments.json` contains the trigger comment from the workflow. No reply file (`replies.json`) was written because there were no review-thread comments to reply to.

## Remaining risks

- **F-1 (forward-looking):** A future change to the agentic hook script that adds an import will silently cause `deno.lock` churn on every Claude tool call. Trivial to fix (add `--no-lock`); not a blocker today.
- **F-2 (evidence hygiene):** The smoke gate's "PASS" claim in the worklog is misleading; downstream evaluators that read the worklog as ground truth will inherit a false positive. Fix in the next slice.
- **F-3 (residual):** Uncommitted `deno.lock` / scratch churn in this worktree must be cleaned before the next slice to avoid mixing unrelated lock churn into the PR.
- **F-4 (process):** The generator committed slice 1 before PLAN-EVAL emitted `PASS`. The workflow should block implementation until PLAN-EVAL runs.
- **Plan-level residual:** The `agentic:smoke-claude-remote` gate is environment-dependent; the plan should document that explicitly and not treat it as a hard PASS in all environments.

## PR comment

The PR comment body is staged at `.llm/tmp/run/plan-agentic-system-claude-native-hardening--agentic-system/pr-comment-body.md` for the workflow to publish. The workflow owns GitHub comments per the operational contract.
