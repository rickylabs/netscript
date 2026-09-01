# Drift Log: #1836 sibling register-generator source safety

Drift is append-only.

## 2026-08-31 — Reference fix is not yet on main

- **What:** The prompt describes `generate-register-background.ts` as fixed by #1747, while the
  live `main` copy still uses `safeIdentifier` and raw single-quoted interpolation.
- **Source:** `origin/main` at `71d5fb8e0`; draft PR #1747 head `2032d4ed7`.
- **Expected:** The fixed background generator would be available as an in-tree sibling pattern.
- **Actual:** #1747 remains open; its branch diff contains the required ordinal/JSON treatment.
- **Severity:** minor
- **Action:** accept
- **Evidence:** GitHub PR #1747 and `git diff origin/main..2032d4ed7 -- generate-register-background.ts`.

## 2026-08-31 — RTK unavailable

- **What:** The repository asks read-heavy shell commands to use `rtk`, but the binary is absent.
- **Source:** `rtk ls .llm/harness/archetypes`.
- **Expected:** RTK v0.38.0 on `PATH`.
- **Actual:** `/bin/bash: rtk: command not found`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Focused `rg` and raw Git/Deno commands are used instead.

## 2026-08-31 — Focused gate set produced a false-green handoff

- **What:** The initial implementation gate selected six generator test files but omitted
  `generators-pipeline_test.ts` and `service-environment_test.ts`, both of which assert on the
  generated outputs changed by the hardening slice.
- **Source:** Owner D-183 report and exact full-directory reproduction at head `94a2ef1a0`.
- **Expected:** All existing consumers of the four generated outputs are included before claiming
  the implementation green.
- **Actual:** The selected six-file wrapper passed 156/156 while the full directory exited 1 with
  28 passed / 2 failed files and 5 failed steps.
- **Severity:** significant
- **Action:** repair
- **Evidence:** Updated both stale consumers after semantic inspection; exact directory command now
  exits 0 with 30 passed / 218 steps / 0 failed, and the structured directory wrapper reports
  248/248 results. The validation plan now makes the full directory a required consumer gate.
