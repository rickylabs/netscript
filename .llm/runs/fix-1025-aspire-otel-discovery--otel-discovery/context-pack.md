# Context Pack — fix-1025-aspire-otel-discovery--otel-discovery

## Current state

- Phase: cycle-2 cause verification stopped on divergent evidence.
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

## Cycle-2 direction and stop

- Cycle-1 anonymous-dashboard removal remains rejected and has been restored to `origin/main`.
- Supervisor-authored `plan-eval-cycle2.md` approved the emitted-task direction with partial-
  acceptance limitations; the generator did not run an evaluator.
- Fresh persistent-shell A/B did not reproduce the anonymous-mode failure: authenticated and
  anonymous modes both returned automatic traces `[]`, exit 0.
- Per the owner brief, no emitted-task/docs/runtime-gate implementation began after that divergence.

## Next action

- Commit and push the cycle-2 restore/evidence slice, update draft PR #1036, and report the divergent
  A/B. Owner/supervisor must decide whether to require another controlled reproduction or reframe
  the cause before product implementation resumes.
