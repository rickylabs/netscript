# Drift Log: release-blocking harness hardening

## 2026-08-03 — owner-assigned supervisor route

- **What:** This Codex API session is both supervisor and implementation lane instead of the
  canonical Fable orchestrator entry.
- **Source:** User assignment and current runtime identity.
- **Expected:** `planning_decisions` defaults to Fable 5 low.
- **Actual:** The owner addressed the existing Codex session with a concrete branch/worktree slice.
- **Severity:** significant
- **Action:** accept for this run; retain separate open-model PLAN/IMPL evaluation and
  opposite-family substantive slice review.
- **Evidence:** `supervisor.md` route table.

## 2026-08-03 — bootstrap evaluator child surface must be disabled

- **What:** The canonical local Qwen evaluator cannot safely receive the default Claude child/session
  delegation tools before #1087 is implemented.
- **Source:** issue #1087 and the current `claude-print.ts` argument list.
- **Expected:** PLAN-EVAL uses the normal bound local Qwen preset.
- **Actual:** The route/model remain canonical, but bootstrap PLAN-EVAL used a session-scoped Claude
  configuration exposing only `Bash`, `Read`, and `Write` for the Plan-Gate.
- **Severity:** significant
- **Action:** temporary safety restriction; remove the bootstrap-only configuration after #1087's
  guarded child request surface lands.
- **Evidence:** `research.md` findings 1-3; `worklog.md` decision log.

## 2026-08-03 — #1087 review route reclassification

- **What:** The planned `review_codex_light` Opus 4.8 launch failed before review because that
  model identifier was unavailable on the local Anthropic client.
- **Source:** Failed session `d8a96f45-3af5-416c-a2a8-e0b6e50979ee`; no verdict artifact was
  created and the session was stopped.
- **Expected:** `review_codex_light` uses Opus 4.8 high.
- **Actual:** Treat the release-blocking cost-safety boundary as complex implementation and use the
  canonical `review_codex_complex` Fable 5 medium route.
- **Severity:** significant
- **Action:** Increase scrutiny without changing provider family or using an out-of-policy
  fallback; record the successful reviewer session and verdict.
- **Evidence:** reviewer session and `review-1087.md` once complete.
