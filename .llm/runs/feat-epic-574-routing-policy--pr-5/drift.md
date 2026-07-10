# Drift — canonical routing policy migration (#581)

## 2026-07-10 — Antigravity reconciliation

- Severity: significant, owner-directed reconciliation.
- Issue #581 text names “Gemini 3.5 Flash” for massive external research/extraction.
- Epic #574's 2026-07-10 reconciliation and merged #578 runtime establish Antigravity CLI (`agy`)
  as the canonical Google research/evidence surface.
- Decision: encode Antigravity (`agy`), do not invent a separate Gemini model lane.
- Open question: if the owner intends a distinct Gemini 3.5 Flash model lane in addition to `agy`,
  it requires explicit clarification/follow-up and is not guessed in #581.

## 2026-07-10 — pre-flight fetch configuration

- Severity: operational, non-scope.
- Plain `git fetch origin` attempted an absent `feat/fresh-ui-pixel-polish` ref and failed.
- Explicit refspec fetches refreshed the integration and feature refs successfully. No remote config
  was mutated because that repair is outside #581.

