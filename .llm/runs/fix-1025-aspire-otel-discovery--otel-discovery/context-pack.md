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

## Rebase proof — 2026-08-02

- Branch rebased onto `origin/main` at `8b69d78f0`; the only conflict retained
  `ASPIRE_CLI_TASK`, `TSCONFIG_ROOT`, and `TSCONFIG_APP` in the scaffold file constants.
- Scoped CLI check/lint/fmt and all CI-relevant static/unit/docs/quality gates passed.
- The required one-pass `scaffold.runtime` run exited 1 after 44 passes at the same users-service
  Prisma database health failure. `behavior.otel-task-traces` was not reached; cleanup removed all
  resources owned by this run.
- Next action is to commit this evidence, force-push the rebased branch with lease, and verify the
  local and remote object IDs match. The PR remains draft and its runtime acceptance gap remains open.

## CI task-trace repair — 2026-08-02

- Added retained scaffold-runtime JSON reporting plus a failure-only checked diagnostic printer.
- Kept the strict critical telemetry task assertion, made it generate traffic, and added ordered
  resource-candidate attempts with complete final failure details.
- Hardened generated runner command-start and duplicate-dashboard-option behavior; asset barrel is
  current.
- Scoped check/lint/fmt, 26 focused tests, asset-barrel, and quality gates pass. No local runtime
  suite was run by instruction. Cloud CI must determine which candidate wins and whether acceptance
  box 5 can close.
- Teardown is clean: `aspire ps` empty, no running Docker containers, no resources created here.

## Documented task argv repair — 2026-08-02

- CI diagnostics proved the generated runner forwarded Deno's leading task separator and built
  `aspire otel -- traces ...`; identity resolution was not the immediate failure.
- The runner now strips only a leading `--` from forwarded arguments. This repairs both otel/export
  documented and bare forms while preserving later separators and all previously landed fallback
  behavior.
- The gate retains its documented separator. Focused tests: 24 passed; scoped check/lint/fmt,
  asset-barrel, and quality gates pass. No other generated task wrapper has the same pattern.
- No runtime resources were started; teardown remains empty/unchanged. Next action is commit, push,
  and local/remote SHA verification; cloud CI is the runtime authority.
