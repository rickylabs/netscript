# Drift Log: emitted fail-fast for declared background references

Drift is append-only.

## 2026-08-29 — requested implementation gate path is absent

- **What:** `.llm/harness/gates/implementation-gate.md` does not exist in the worktree or supplied base tree.
- **Source:** direct filesystem lookup, repository search, and `git ls-tree -r 3b32d1628584749af4dd6e97fd331c24e84f0b9e`.
- **Expected:** The brief explicitly required that file to be read.
- **Actual:** The gate directory contains `static-gates.md`, `fitness-gates.md`, `runtime-gates.md`, and related canonical gate-family documents, but no implementation gate file.
- **Severity:** minor
- **Action:** accept for this run; use `static-gates.md` plus the exact user-specified gate list. Do not create or modify harness doctrine in this bounded product correction.
- **Evidence:** `.llm/harness/gates/static-gates.md`; plan validation table.
