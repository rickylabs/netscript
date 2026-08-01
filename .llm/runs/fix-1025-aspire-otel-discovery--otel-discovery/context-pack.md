# Context Pack — fix-1025-aspire-otel-discovery--otel-discovery

## Current state

- Phase: plan / awaiting PLAN-EVAL.
- Branch baseline equals `origin/main` at `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9`.
- Worktree was clean at bootstrap.

## Load-bearing evidence

- Fresh generated TS AppHost, Aspire CLI 13.4.6.
- Before control, `aspire ps --format Json` reported an anonymous URL for the running AppHost.
- Automatic traces output: `Could not fetch telemetry data from the dashboard. The dashboard is not available.`; exit 12.
- Removing only `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` produced a tokenized login URL and
  automatic `--apphost` traces output `[]`, exit 0, under an isolated detached start.
- Live help proves `otel`/`export` accept `--dashboard-url` and do not accept `--isolated`.

## Locked direction

- NetScript-side anonymous dashboard configuration defect.
- Remove both anonymous-mode emission sites and regenerate embedded assets.
- Keep automatic `--apphost` discovery and assert non-empty trace JSON plus a non-empty export zip.

## Blocker / next action

- Draft PR #1036 is open and the bootstrap commit is pushed.
- Cycle-1 owner-supervisor PLAN-EVAL returned FAIL_PLAN and is committed in `plan-eval.md`.
- The requested discriminator and acceptance correction are complete; request cycle-2 PLAN-EVAL.
- No implementation has begun.
