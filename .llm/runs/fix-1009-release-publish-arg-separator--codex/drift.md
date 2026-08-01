# Drift Log: release task argument-separator tolerance

Drift is append-only. Record facts that diverge from the plan, issue, doctrine, or current-state
documentation.

## 2026-08-01 — Re-baseline matches reported cause

- **What:** Independent parser/task-wiring survey found no material divergence from issue #1009.
- **Source:** Focused `rg`, source reads, and the exact baseline task probe.
- **Expected:** Only `github-release.ts` among documented publish peers lacks tolerance, with
  task-wired `release:preflight` as the additional AC4 fix.
- **Actual:** Exact match.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md` findings 1–5 and `worklog.md` before-probe row.

## 2026-08-01 — Supervisor route fallback

- **What:** The current user-opened Codex session acts as supervisor instead of creating a Fable
  orchestrator session.
- **Source:** Active workspace session and `workflow/lane-policy.md` fallback route.
- **Expected:** Fable 5 low is the primary planning route.
- **Actual:** Canonical Codex fallback is active; formal open-model evaluation remains separate.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` routes and override.

## 2026-08-01 — Local formal evaluator transport unavailable

- **What:** The local `claude-print` Qwen launch first resolved against the native Claude endpoint
  and returned `model_not_found`; the canonical OpenRouter profile cannot be applied because this
  host has no OpenRouter credential.
- **Source:** Separate-session launch output and credential-presence check (names/status only).
- **Expected:** Local Claude Code + OpenRouter Qwen PLAN-EVAL.
- **Actual:** `OPENROUTER_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, and `ANTHROPIC_API_KEY` are unset.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Fall back to the canonical cloud OpenHands open-model evaluator; no closed model and
  no self-certification.
