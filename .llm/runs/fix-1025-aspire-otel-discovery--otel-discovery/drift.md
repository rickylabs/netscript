# Drift Log — fix-1025-aspire-otel-discovery--otel-discovery

Append-only. Record deviations from the issue framing, locked plan, route policy, or expected environment.

## 2026-08-01 — C# control could not complete cheaply

- Severity: minor.
- Expected: generate a minimal non-NetScript C# AppHost as an optional control.
- Actual: `aspire new aspire-empty --language csharp` remained at template resolution beyond the
  execution window and produced no project.
- Impact: partial evidence only; no acceptance claim depends on C# parity. The primary localization
  remains the observed run-state/backchannel asymmetry in Aspire CLI 13.4.6.
- Route/scope change: none.

## 2026-08-01 — Formal local evaluator credential unavailable

- Severity: significant (process blocker, not product-scope drift).
- Expected: run PLAN-EVAL through the canonical local `formal_evaluation` route: Claude Code +
  OpenRouter + `qwen/qwen3.7-max`.
- Actual: `deno task agentic:provider-canary --live --profile claude-openrouter ...` returned
  `status: blocked`, `credential: absent`, and `auth_required`; no evaluator session launched.
- Policy consequence: closed/paid models are prohibited, and the OpenHands handoff skill prohibits
  dispatching cloud OpenHands for a local-machine run. The supervisor cannot self-evaluate.
- Required unblock: owner supplies/configures an OpenRouter credential for the canonical local
  evaluator, or explicitly authorizes a different policy-compliant evaluator transport/waives the
  Plan-Gate. No implementation may begin before one of those occurs.
