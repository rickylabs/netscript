# Drift Log: PR 0A canonical WSL agentic foundation

## 2026-07-10 — Owner-authorized Tier-D route override

- **What:** PR 0A uses GPT-5.6 Sol high instead of the checked-in GPT-5.5-high Tier-D binding.
- **Source:** Owner directive; `.llm/harness/workflow/lane-policy.md`.
- **Expected:** Checked policy and selected route match.
- **Actual:** Canonical GPT-5.6 migration is deferred to #581.
- **Severity:** significant
- **Action:** accept as an explicit run override; require thread-start model/effort proof.
- **Evidence:** `supervisor.md`, issue #581.

## 2026-07-10 — Codex CLI/app-server version skew

- **What:** Managed Codex and CLI are `0.144.1`; app-server reports `0.142.5`.
- **Source:** `codex app-server daemon version`.
- **Expected:** The doctor classifies component compatibility.
- **Actual:** Existing status output exposes but does not classify the skew.
- **Severity:** minor
- **Action:** report in PR 0A doctor; durable repair remains #580.
- **Evidence:** `research.md`.

