# Drift Log: OMB wave-0 proofs

Drift is append-only.

## 2026-08-03 — User-addressed Codex supervisor

- **What:** The current Codex root session supervises planning instead of launching the default
  Fable `planning_decisions` route.
- **Source:** User directive: “You are the implementation supervisor”.
- **Expected:** Lane policy defaults orchestration to Fable with Codex as fallback.
- **Actual:** The existing user-addressed Codex session remains supervisor; separate canonical
  implementation, review, and formal evaluator sessions are still required.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table.

## 2026-08-03 — Service overlay read paths absent

- **What:** `SCOPE-service.md` points to `.claude/04-services.md` and
  `.claude/06-infrastructure.md`, which are absent on the current branch.
- **Source:** Direct filesystem lookup after reading the overlay.
- **Expected:** Both additional-read files exist.
- **Actual:** Neither path resolves; focused package/service/Aspire source and official Aspire docs
  are used instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `rg --files` produced no matching paths.
