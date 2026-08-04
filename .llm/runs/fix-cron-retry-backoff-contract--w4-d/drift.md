# Drift Log: cron retry/backoff contract

Drift is append-only.

## 2026-08-04 — Milestone PLAN-EVAL composition

- **What:** No local formal PLAN-EVAL is launched.
- **Source:** Owner W4-D brief; `workflow/milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Normal `run-loop.md` launches a separate formal PLAN-EVAL.
- **Actual:** Plan evaluation composes draft→ready augment plus milestone orchestrator pre-merge gate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md`, `supervisor.md`

## 2026-08-04 — Provider name mismatch in issue acceptance

- **What:** Issue acceptance says “memory and Deno KV providers.”
- **Source:** Live issue #1104 and package source inventory.
- **Expected:** Both named providers exist in `packages/cron`.
- **Actual:** The package has `MemoryCronAdapter` and native `DenoCronAdapter` using `Deno.cron`; no
  Deno KV cron provider exists.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `packages/cron/adapters/`; `packages/cron/deno.json`

## 2026-08-04 — Foreign lock state at bootstrap

- **What:** `deno.lock` contains one unstaged queue dependency addition before run work.
- **Source:** opening raw `git status` and `git diff -- deno.lock`.
- **Expected:** clean baseline.
- **Actual:** one foreign insertion for `jsr:@netscript/queue@0.0.4`.
- **Severity:** minor
- **Action:** accept and exclude
- **Evidence:** bootstrap terminal record; explicit-path staging required for every slice.
