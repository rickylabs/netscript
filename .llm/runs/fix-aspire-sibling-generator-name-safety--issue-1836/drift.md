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

