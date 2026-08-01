# Context Pack — fix-1025-aspire-otel-discovery--otel-discovery

## Current state

- Phase: plan / awaiting PLAN-EVAL.
- Branch baseline equals `origin/main` at `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9`.
- Worktree was clean at bootstrap.

## Load-bearing evidence

- Fresh generated TS AppHost, Aspire CLI 13.4.6.
- `aspire ps --format Json` reported `https://localhost:42183` for the running AppHost.
- Automatic traces output: `Could not fetch telemetry data from the dashboard. The dashboard is not available.`; exit 12.
- Explicit dashboard URL output: `[]`; exit 0.
- Live help proves `otel`/`export` accept `--dashboard-url` and do not accept `--isolated`.

## Locked direction

- Upstream discovery defect; do not edit the AppHost template.
- Document the literal-error remedy in skill + docs.
- Match the exact isolated AppHost path in `aspire ps` JSON, pass only `--dashboard-url`, and assert
  non-empty trace JSON plus a non-empty export zip in the existing E2E harness.

## Blocker / next action

- Draft PR #1036 is open and the bootstrap commit is pushed.
- The canonical local Qwen PLAN-EVAL route is blocked by an absent OpenRouter credential.
- Await owner direction: configure the credential, authorize another policy-compliant evaluator
  transport, or explicitly waive the Plan-Gate. No implementation has begun.
