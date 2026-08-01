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
- Patched automatic export gathered all data classes, saved a 12,857-byte zip, and exited 0.
- Token blast-radius audit matched 53 docs/README/generated-asset files; only the owned verbatim
  generated-config sample is in scope, and the wider alignment surface must be reported.
- Live help proves `otel`/`export` accept `--dashboard-url` and do not accept `--isolated`.

## Locked direction

- NetScript-side anonymous dashboard configuration defect.
- Remove both anonymous-mode emission sites and regenerate embedded assets.
- Keep automatic `--apphost` discovery and assert non-empty trace JSON plus a non-empty export zip.

## Blocker / next action

- Draft PR #1036 is open and the bootstrap commit is pushed.
- Supervisor adjudication in `plan-eval.md` records conditional PASS and authorizes implementation.
- Findings A/B, the token blast-radius audit, and Finding C's package gate-table amendment are complete.
- Proceed with slices 2 and 3; leave PR draft for human security-posture review.
