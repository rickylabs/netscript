# Drift: Fresh UI private-lock gate triggers

## 2026-09-02 — Requested implementation-gate document is absent

- **Severity:** minor
- **Expected:** the brief requests `.llm/harness/gates/implementation-gate.md`.
- **Observed:** the file does not exist at the required base, and no renamed implementation-gate
  document is present. The current gate taxonomy is split across `static-gates.md`,
  `fitness-gates.md`, `runtime-gates.md`, `consumer-gates.md`, and `release-gates.md`.
- **Action:** followed the brief's explicit four-command gate set and parsed-YAML proof; no scope
  expansion or invented gate.

## 2026-09-02 — RTK unavailable on PATH

- **Severity:** minor
- **Expected:** use the requested RTK skill for read-heavy shell commands.
- **Observed:** `rtk` returned exit 127 (`command not found`).
- **Action:** used focused raw `rg` and git commands. Gate verdicts will use the required unfiltered
  commands with explicitly captured real exit codes.

## Scope Drift

None. The two-layer classifier/workflow fix, tests, and evidence remain within the authorized files.
