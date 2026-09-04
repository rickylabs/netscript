# Drift Log: GitHub Copilot cloud lane for the NetScript harness

## 2026-09-04 — S3/S4 compile-atomic consolidation

- Severity: minor; coordinator approved combining S3 and S4 because `RouteIdentity.profileId`
  references the finite `ProviderProfileId` and `PROVIDER_PROFILES` is exhaustive. Resolver mapping
  cannot compile independently of the credential-free Copilot profile.
- Both proving gate sets are retained. Profile credential keys become nullable for connector-owned
  OAuth, with no bindings for Copilot; the exhaustive child-policy test is updated accordingly.
- RTK and rg were unavailable on this task shell PATH; focused plain reads and grep are used as
  the documented fallback. Runtimes remain through `mise exec`.

Drift is append-only. No drift recorded at activation.

## 2026-09-04T19:07Z — Gemini transport correction

- Superseded: the intermediate interpretation that every non-OpenAI/non-Anthropic Copilot catalog
  model should route through Copilot, including Gemini.
- Authoritative rule: Gemini always uses the native Google subscription through `agy`; this also
  preserves the restricted deep-research route (`agy` Gemini 3.8 Flash, native Codex Luna fallback).
- Copilot-first routing is limited to other supported matrix families, currently Kimi K3 and Grok
  4.6, before OpenCode Go, Ollama, and OpenRouter.

## 2026-09-04T19:17Z — Gemini Copilot fallback clarification

- Native Google `agy` remains the mandatory first route for Gemini.
- A catalog-attested GitHub Copilot Gemini is permitted as a same-model fallback after native `agy`
  is unavailable.
- Deep research ordering is `agy` Gemini 3.8 Flash, Copilot Gemini 3.8 Flash, then native Codex
  Luna. Generic OpenCode Go, Ollama, OpenRouter, and Claude remain excluded.

## 2026-09-04 — Plan generation route and evidence head

- Severity: minor. The plan brief named research head `552ca9433`; the checkout head at plan time
  was `4ffc491c6` (two coordinator commits: Copilot connector catalog attestation and Gemini
  Copilot-fallback wording). The plan treats the later head as authoritative because both commits
  restate owner rulings already reflected in `supervisor.md`; no rejected claim was restored.
- Severity: minor. Plan was generated on `github-copilot/claude-fable-5.1` (same-model fallback
  authorised in `supervisor.md`) rather than the native Claude transport. Model and effort are
  unchanged (Fable 5.1, low); transport only.
- Severity: minor. Symbol-level shapes of `contract.ts`, `provider-profiles.ts`,
  `subscription-expense.ts`, `opencode-run.ts`, and the `openhands/` and `github/` helpers were not
  read during planning (survey stopped by the coordinator); paths are verified to exist and the plan
  instructs implementation to confirm exported names before editing (plan.md §4 note).

## 2026-09-04 — PLAN-EVAL transport fallback

- Requested logical evaluator: feature-tier GLM 5.3 at provider-default effort, separate Zhipu
  family from the Fable generator.
- OpenCode Go expense preflight failed closed before spawn with `provider_rate_limited`.
- The same logical model completed through OpenRouter in session `ses_f9213f890ffelYPJ3h8zaNa8O4`;
  exact plan head `c12796b85` received `PASS`.
