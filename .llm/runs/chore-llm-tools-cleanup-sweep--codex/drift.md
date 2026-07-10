# Drift Log: non-agentic `.llm/tools/` cleanup sweep

## 2026-07-11 — stale remote-tracking main

- **What:** Initial `git rev-parse origin/main` reported the pre-merge parent while `FETCH_HEAD` and
  `ls-remote` showed current main.
- **Expected:** remote-tracking `origin/main` matched GitHub main.
- **Actual:** the fetch command updated only `FETCH_HEAD`; an explicit refspec synchronized
  `origin/main` to `b13ca0fa`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `git ls-remote origin refs/heads/main`;
  `git fetch origin refs/heads/main:refs/remotes/origin/main`.

## 2026-07-11 — baseline test lock churn

- **What:** The baseline `deno test --no-lock` invocation added wildcard `@std/fs` and `@std/path`
  resolution rows.
- **Expected:** Baseline validation left `deno.lock` unchanged.
- **Actual:** Two redundant resolution rows appeared despite `--no-lock`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** The two-line delta was removed immediately; `git diff -- deno.lock` returned empty.

## 2026-07-11 — coordinator Plan-Gate substitution

- **What:** external PLAN-EVAL unavailable/owner-waived; coordinator Plan-Gate substituted.
- **Source:** PR #595 Actions runs `29128831065` and `29128897115`; owner directive in the Codex
  thread.
- **Expected:** OpenHands Claude-family PLAN-EVAL writes a verdict artifact.
- **Actual:** Both launches skipped before agent execution with `VERDICT: NONE`; an Opus 4.8 Claude
  coordinator in a separate session performed the substantive gate and approved with one correction.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `plan-eval.md`; coordinator correction keeps the independent e2e script and approves
  only the five-file `search/` deletion.
