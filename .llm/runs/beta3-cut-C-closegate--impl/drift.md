# Drift Log: close-gate verified acceptance

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-05 — Docs overlay path

- **What:** Harness activation says to read `.llm/harness/SCOPE-docs.md`.
- **Source:** `.llm/harness/workflow/activation.md`.
- **Expected:** The referenced docs overlay exists at that path.
- **Actual:** The checked-in file is `.llm/harness/archetypes/SCOPE-docs.md`.
- **Severity:** minor.
- **Action:** accept for this slice; use the actual overlay path and do not expand scope to fix
  harness docs.
- **Evidence:** `find .llm/harness -maxdepth 3 -type f \( -name '*docs*' -o -name 'SCOPE-*' \)`.
