# Drift Log: Codex sender ownership and remote recovery

Drift is append-only.

## 2026-07-10 — stale origin fetch refspec

- **What:** Plain `git fetch origin` failed because this worktree config fetches nonexistent `feat/fresh-ui-pixel-polish`.
- **Source:** `git config --get-all remote.origin.fetch` and pre-flight exit 128.
- **Expected:** User-directed plain fetch succeeds.
- **Actual:** Explicit fetch of integration and feature branches succeeded; ancestry check then exited 0.
- **Severity:** minor
- **Action:** accept; do not rewrite shared repository config in #580.
- **Evidence:** worklog pre-flight entry.

## 2026-07-10 — interactive reconnect canaries owner-accepted

- **What:** Live mobile visibility, sleep, and network reconnect canaries are accepted as working by owner directive.
- **Source:** issue #580 implementation brief.
- **Expected:** Acceptance ordinarily seeks repeated live reconnect evidence.
- **Actual:** This worker implements honest detection and non-interactive tests only; no raw reconnect result will be fabricated.
- **Severity:** minor
- **Action:** accept for this run; keep runtime state reporting truthful.
- **Evidence:** plan L10 and deferred scope.

## 2026-07-10 — evaluator lane override

- **What:** The run supervisor artifact says the external evaluator is waived; the Claude coordinator owns Plan-Gate and Tier-A review.
- **Source:** `supervisor.md` and user directive.
- **Expected:** Default harness PLAN-EVAL/IMPL-EVAL use separate OpenHands sessions.
- **Actual:** Owner-configured coordinator review path applies; this WSL Codex worker does not self-certify.
- **Severity:** significant
- **Action:** accept as recorded lane override; stop before implementation until coordinator Plan-Gate passes.
- **Evidence:** `supervisor.md`; `context-pack.md`.
