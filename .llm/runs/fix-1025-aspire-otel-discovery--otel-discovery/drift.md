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
