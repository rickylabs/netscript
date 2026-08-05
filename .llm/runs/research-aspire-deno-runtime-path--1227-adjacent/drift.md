# Drift Log: Aspire Deno runtime / NuGet dependency research

Drift is append-only.

## 2026-08-05 — Owner route, D6 evaluation composition, and branch override

- **What:** The run uses OpenAI GPT-5.6 Sol at xhigh, does not launch a local formal PLAN-EVAL, and
  uses the owner-specified `research/` branch prefix.
- **Source:** Owner brief; `.llm/harness/workflow/milestone-run.md`; `netscript-pr` branch rules.
- **Expected:** Canonical extraction/default branch rules and normal per-run PLAN-EVAL.
- **Actual:** The owner explicitly supplied the route, D6 waiver, and exact branch.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`, `plan.md` D6–D7, `plan-eval.md`.

## 2026-08-05 — Inherited lock-file change excluded

- **What:** `deno.lock` was already modified when the run activated.
- **Source:** Raw `git status --short --branch` at bootstrap.
- **Expected:** Clean baseline at `origin/main`.
- **Actual:** HEAD equals `origin/main`, with an unrelated modified lock file.
- **Severity:** minor
- **Action:** accept and preserve
- **Evidence:** `worklog.md` bootstrap entry; raw status before commit.
