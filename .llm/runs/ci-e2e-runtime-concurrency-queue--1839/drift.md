# Drift Log: e2e-cli runtime concurrency queue

Drift is append-only.

## 2026-08-31 — Owner-controlled evaluation handoff

- **What:** This implementation session will not run IMPL-EVAL or transition the draft PR to ready.
- **Source:** Owner directive in the slice brief.
- **Expected:** Harness normally requires a separate-session IMPL-EVAL before close.
- **Actual:** The owner explicitly retained IMPL-EVAL, label-after-opening, and ready-transition ownership.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md`; slice brief.

## 2026-08-31 — RTK unavailable on implementation host

- **What:** The repository's preferred `rtk` command is not installed/on `PATH` in this session.
- **Source:** `rtk ls .llm/harness/templates` returned `command not found`.
- **Expected:** `.agents/skills/rtk/SKILL.md` states a machine-level binary is present.
- **Actual:** Raw focused shell reads are required; authoritative exits will still be captured directly.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output; no product/runtime behavior affected.
