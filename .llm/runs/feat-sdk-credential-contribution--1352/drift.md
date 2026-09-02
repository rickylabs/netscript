# Drift Log: typed bearer credential contribution (#1352)

Drift is append-only. No credential value, resolver output, or secret-bearing diagnostic belongs in
this file or elsewhere under the run directory.

## 2026-09-02 — lock baseline advanced with main

- **What:** Re-baselining found a different lock hash before S5 implementation.
- **Source:** `sha256sum deno.lock`; `git diff origin/main -- deno.lock`.
- **Expected:** Clustered plan historical hash `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`.
- **Actual:** Current `origin/main` and working tree both hash to
  `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d`; diff is empty.
- **Severity:** minor.
- **Action:** accept the current-main hash as the exact S5 baseline; reject any subsequent movement.
- **Evidence:** `origin/main` @ `fafffd58d3ebcb52dd217891d706cdde3a01a5e5`.

## 2026-09-02 — preferred output proxy unavailable

- **What:** The repository-preferred `rtk` binary is not installed/on PATH in this environment.
- **Source:** `rtk git status --short --branch` exited 127.
- **Expected:** Use `rtk` for read-heavy git/rg and proxy Deno task output.
- **Actual:** Focused native commands are required; durable verdicts still use structured wrappers.
- **Severity:** minor.
- **Action:** accept; use raw `git` only for ground truth and structured Deno wrappers for gates.
- **Evidence:** bootstrap command output; no gate was substituted with filtered output.
