# Drift Log: Aspire and CLI lifecycle (#1011, #1012)

Drift is append-only.

## 2026-08-03 — Referenced service overlay is absent

- **What:** Harness activation documentation names `SCOPE-service.md`, but no `SCOPE-*` file exists
  under `.llm/harness/` in this checkout.
- **Source:** direct `rg --files .llm/harness` search at baseline `ab0fa13fe`.
- **Expected:** Load the service overlay for Aspire service work.
- **Actual:** Archetype 6 and runtime gates are available; the overlay is not.
- **Severity:** minor
- **Action:** accept for this run; do not invent replacement rules.
- **Evidence:** `plan.md` metadata and validation plan.

## 2026-08-03 — Runtime-provided supervisor route

- **What:** The user initiated this Codex session as primary harness agent, so it acts as supervisor
  rather than launching the lane-policy Fable primary.
- **Source:** current API session and user request.
- **Expected:** `planning_decisions` defaults to Fable 5 low.
- **Actual:** Codex primary supervises; separate open-model formal evaluation and opposite-family
  slice review remain mandatory.
- **Severity:** minor
- **Action:** accept and record in `supervisor.md`.
- **Evidence:** `supervisor.md` route table.

