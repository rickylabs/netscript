# Drift Log: Slice F activation (#1354)

## 2026-09-02 — RTK unavailable

- **What:** The preferred output-compression proxy is not installed.
- **Source:** `rtk ls ...` returned `/bin/bash: rtk: command not found`.
- **Expected:** Repository tooling guidance says `rtk` is on `PATH`.
- **Actual:** Scoped raw `git`, `rg`, and `find` reads are required.
- **Severity:** minor
- **Action:** accept for this run; structured wrappers remain authoritative gate sources.
- **Evidence:** bootstrap terminal output.

## 2026-09-02 — stacked base advanced

- **What:** `origin/feat/app-service-client-wiring` advanced after the integration branch was assembled.
- **Source:** `git rev-parse origin/feat/app-service-client-wiring`.
- **Expected:** Owner described integrated #1664 head `9295eabaa`.
- **Actual:** remote base is `e8983cca5`; this branch remains at the explicitly supplied integration commit `be3e3dded` and the PR will target the current branch name.
- **Severity:** minor
- **Action:** accept; do not merge or rebase onto `main`, and state the stacked-base relationship in the PR.
- **Evidence:** raw git rev-parse/log output.
