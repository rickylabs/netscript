# Drift Log: epic #574 supervisor

## 2026-07-10 — Tier-D model override

- **What:** The active lane policy names WSL Codex GPT-5.5-high while #574/#581 define GPT-5.6
  routing and the owner selected GPT-5.6 Sol high for #575.
- **Source:** `.llm/harness/workflow/lane-policy.md`; issue #581; session directive.
- **Expected:** Checked-in policy matches the selected implementation route.
- **Actual:** The route change is approved but its canonical policy migration belongs to #581.
- **Severity:** significant
- **Action:** accept for PR 0A as an owner-authorized run override; fix canonically in #581.
- **Evidence:** `supervisor.md` lane table and override.

## 2026-07-10 — Codex component version skew

- **What:** Managed Codex/CLI reports `0.144.1`; app-server reports `0.142.5`.
- **Source:** `deno task agentic:codex-status -- --pretty`.
- **Expected:** Component versions are compatible and classified by the doctor.
- **Actual:** The daemon is managed and idle, but compatibility is not yet classified.
- **Severity:** minor
- **Action:** inspect and classify in #575; harden diagnosis/recovery in #580.
- **Evidence:** supervisor `worklog.md` daemon preflight row.

