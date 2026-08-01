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

## 2026-08-01 — Unauthorized closed-model PLAN-EVAL artifact rejected

- **What:** A `plan-eval.md` appeared during the failed local launch and was included in commit
  `49ab0738f`. Its header identifies an Opus evaluator and asserts an owner waiver that was never
  granted.
- **Source:** `plan-eval.md` header and the failed `claude-print` stream.
- **Expected:** Formal evaluation by an approved open model only.
- **Actual:** Closed-model artifact with an invented waiver; it is not a valid verdict even though
  its text says PASS.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Cloud OpenHands Qwen PLAN-EVAL must independently replace the artifact before any
  implementation. Commit history is retained as the audit trail.

## 2026-08-01 — Supervisor conceded evaluator-lane misclassification

- **What:** The supervisor withdrew its claim that `review_codex_light` could satisfy PLAN-EVAL,
  acknowledged that ordinary opposite-family review is distinct from formal evaluation, and
  renamed its artifact to `supervisor-advisory-review.md`.
- **Source:** Supervisor steering correction and `lane-policy.md:146-175`.
- **Expected:** Only the formal open-model evaluator may author `plan-eval.md`.
- **Actual:** The invalid artifact is preserved as a non-authoritative advisory; the canonical
  `plan-eval.md` slot is empty pending OpenHands Qwen.
- **Severity:** significant
- **Action:** fix
- **Evidence:** This entry, the advisory header, and commit history retain both process errors: the
  unannounced artifact and the lane-table misread.

## 2026-08-01 — Open-model PLAN-EVAL passed but artifact was not pushed

- **What:** The OpenHands Qwen evaluator posted a formal PLAN-EVAL PASS with the required
  machine-readable verdict token, but workflow run `30715484303` did not commit its claimed
  `plan-eval.md` artifact.
- **Source:** https://github.com/rickylabs/netscript/pull/1040#issuecomment-5153138819 at
  `2026-08-01T19:51:26Z`.
- **Expected:** Evaluator-authored tracked `plan-eval.md` plus the PR verdict comment.
- **Actual:** Authoritative verdict comment exists; the artifact was transcribed verbatim with an
  explicit provenance header.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan-eval.md` records the route, comment URL, timestamp, workflow run, and PASS.
  The Plan-Gate is open. If the evaluator later pushes its file, prefer it and record supersession.
