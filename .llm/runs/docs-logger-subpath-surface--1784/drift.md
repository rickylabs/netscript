# Drift Log: logger sub-path reference surface

## 2026-08-30 — shared remote-tracking ref advanced

- **What:** The shared repository's `origin/main` ref advanced while this locked-baseline slice was
  running.
- **Source:** The initial `git rev-parse origin/main` returned `38439740f`; the later clean detached
  README-baseline worktree resolved `origin/main` to `52a881c58`.
- **Expected:** The slice remains based on the owner-specified `38439740f` with no upstream.
- **Actual:** The branch stayed at `38439740f`; only the shared remote-tracking ref moved.
- **Severity:** minor
- **Action:** accept; do not rebase or expand scope.
- **Evidence:** Git branch/baseline checks and the clean baseline gate output.

## 2026-08-30 — oRPC request correlation uses shared closure state

- **What:** `LoggingPlugin.init()` creates `currentRequestId` and `requestStartTime` once, then both
  the root and procedure interceptors close over those mutable variables.
- **Source:** `packages/logger/orpc-plugin.ts`: the root interceptor writes `currentRequestId`
  before awaiting `next()`, and the procedure interceptor reads it later when it begins.
- **Expected:** The symbol reference row should describe the installed logging interceptors without
  promising reliable request correlation.
- **Actual:** The previous row said the plugin provided correlated logging, but a concurrent root
  invocation can overwrite the shared request ID before another request's procedure interceptor
  reads it.
- **Severity:** significant
- **Action:** defer the source fix to the separately filed owning lane; remove only the unearned
  documentation guarantee in this slice.
- **Evidence:** Source-order inspection around `LoggingPlugin.init()` and the bounded Augment finding
  on PR #1785.
