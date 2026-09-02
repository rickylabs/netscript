# Drift log — #1867 F-3 generator clean-tree guard

## 2026-09-02 — RTK executable unavailable

- **What:** The requested `rtk` tool is absent from this host's PATH.
- **Source:** `command -v rtk` returned exit 1 on run bootstrap.
- **Expected:** The loaded RTK skill describes a machine-level v0.38.0 installation.
- **Actual:** No executable was found.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Use narrow direct commands and direct Deno-spawned Git ground-truth checks; never
  treat filtered exploratory output as durable gate evidence.

## 2026-09-02 — Main advanced after the assigned base

- **What:** `origin/main` advanced one commit after this leaf was dispatched.
- **Source:** `git fetch origin main`; `git log 3066a0cc5..origin/main`.
- **Expected:** The brief pins base `3066a0cc5` and says not to rebase without telling the owner.
- **Actual:** Current main is `c099ad982`, adding milestone coordinator report legibility in #1933;
  it does not overlap this leaf's generator/test/task files.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Preserve the assigned base and make no rebase/merge. Draft PR #1937 reports
  mergeable against current `main`; the topic supervisor may request convergence after evaluation.
