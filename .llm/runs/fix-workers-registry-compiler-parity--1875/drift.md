# Drift Log: workers registry compiler parity

Drift is append-only.

## 2026-09-01 — RTK unavailable on implementation host

- **What:** The repository-preferred `rtk` executable is not installed on PATH.
- **Source:** `rtk ls .llm/harness/archetypes` returned exit 127.
- **Expected:** The `rtk` skill describes a machine-level executable available on PATH.
- **Actual:** `/bin/bash: rtk: command not found`.
- **Severity:** minor
- **Action:** accept; use raw focused non-interactive commands and structured gate wrappers.
- **Evidence:** implementation session command output; no product impact.

## 2026-09-01 — Slice-review primary quota-blocked

- **What:** The native Fable 5 low slice-review session reached its weekly quota before inspecting
  the diff and prompted for paid usage credits.
- **Source:** Claude background session `bd792425`.
- **Expected:** `review_codex` primary route on Fable 5 low.
- **Actual:** Primary stopped; canonical token-limit fallback Opus 5 low launched as `9ab1eef0`.
- **Severity:** minor
- **Action:** accept the in-policy fallback; do not authorize paid-credit continuation.
- **Evidence:** `supervisor.md` route table and Claude session logs.
