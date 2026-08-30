# Drift Log: S13 stale surface cleanup

## 2026-08-30 — Phase-1 parity is not in the S10 sibling stack

- **What:** `.llm/tools/validation/check-aspire-version-parity.ts` and its task wiring exist on the
  S1 remote branch but not at S13's required S10′ base.
- **Source:** `git log --all -- .llm/tools/validation/check-aspire-version-parity.ts` and tree probe.
- **Expected:** S13 evolves the S1 gate while remaining a sibling branch stacked on S10.
- **Actual:** The dependency has not landed on main or this stack.
- **Severity:** significant
- **Action:** accept the prescribed base; implement the phase-2 evolution with phase 1 default and
  defer CI flip/convergence until S1 is on main.
- **Evidence:** `research.md`, final dependency check in `worklog.md`.

## 2026-08-30 — RTK binary unavailable

- **What:** The repository skill recommends RTK for read-heavy commands, but `rtk` is not on PATH.
- **Source:** `rtk grep ...` → `/bin/bash: rtk: command not found`.
- **Expected:** RTK 0.38.0 available at the machine level.
- **Actual:** unavailable in this container.
- **Severity:** minor
- **Action:** use focused raw `rg`/`git`; durable verdicts still use structured wrappers/receipts.
- **Evidence:** bootstrap command output.
