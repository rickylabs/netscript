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

## 2026-08-01 — Cause changed from upstream to NetScript-side

- Severity: significant.
- Expected: Aspire CLI automatic lookup defect requiring a documented URL workaround.
- Actual: removing NetScript's anonymous dashboard flag restored automatic discovery under a
  detached isolated start; the generated configuration suppressed the tokenized dashboard info.
- Impact: remove docs/skill/upstream-issue work from scope; fix both generator emission sites and
  prove automatic `--apphost` discovery in E2E.
- Authorization: demanded by cycle-1 PLAN-EVAL Finding 1; within the issue's explicit conditional fix shape.

## 2026-08-01 — Formal local evaluator credential unavailable

- Severity: significant (process blocker, not product-scope drift).
- Expected: run PLAN-EVAL through the canonical local `formal_evaluation` route: Claude Code +
  OpenRouter + `qwen/qwen3.7-max`.
- Actual: `deno task agentic:provider-canary --live --profile claude-openrouter ...` returned
  `status: blocked`, `credential: absent`, and `auth_required`; no evaluator session launched.
- Superseded by owner waiver: the Opus supervisor performs PLAN-EVAL/IMPL-EVAL for the 0.0.3 fix
  train. Generator is Codex/GPT family and evaluator is Claude family in a separate session, so
  evaluator independence holds. Missing OpenRouter credentials are not a blocker for this run.

## 2026-08-01 — Token-facing documentation exceeds slice boundary

- Severity: significant, deferred documentation alignment (not architecture debt).
- Audit: 53 files matched dashboard/open/`:18888` guidance across docs, README, and generated assets.
- In-scope correction: the verbatim generated config sample in `docs/site/explanation/aspire.md`.
- Out-of-scope surface: broader guidance that links directly to the dashboard without consistently
  repeating that the URL/token comes from `aspire start`.
- Disposition: report to the owner and keep PR draft; do not widen #1025 into a docs-corpus rewrite.
