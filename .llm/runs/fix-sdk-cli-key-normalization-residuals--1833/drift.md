# Drift Log: residual Aspire key-normalization mismatches (#1833)

Drift is append-only.

## 2026-08-31 — RTK unavailable in implementation shell

- **What:** The repo instructions advertise `rtk`, but the binary is not on this shell's `PATH`.
- **Source:** `rtk rg --files .agents/rules .llm/runs` exited 127 (`rtk: command not found`).
- **Expected:** Use RTK for token-compressed exploratory Git/search/task output.
- **Actual:** Direct `rg` and Git reads are available; structured Deno wrappers remain available for
  verdict evidence.
- **Severity:** minor
- **Action:** accept for this run; use direct `rg`/Git and mandated structured wrappers.
- **Evidence:** bootstrap command output in the implementation session.

## 2026-08-31 — Root Deno config excludes owned CLI files from lint/fmt

- **What:** Structured lint/fmt wrappers refused CLI files selected under the root/package configs.
- **Source:** Wrapper coverage reports showed `all-excluded`; root `deno.json` explicitly excludes
  `packages/cli/` from lint and fmt.
- **Expected:** Explicit `--file` selection would be sufficient for the scoped wrapper.
- **Actual:** Deno applied the root workspace exclusion before processing explicit CLI files.
- **Severity:** minor
- **Action:** accept tooling baseline and use the established run-local `workspace: []` quality
  config with the same recommended/JSR lint rules and formatting policy.
- **Evidence:** `cli-quality-deno.json`, `cli-lint.json`, and `cli-fmt.json` (both final exits 0).
