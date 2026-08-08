# Drift Log: production command composition kit RFC

Drift is append-only. Record facts that diverge from the carried proposal, plan, doctrine, or
current-state documentation.

## 2026-08-08 — Runtime identity correlation unavailable

- **What:** The desired-state runtime controller could not match this worktree to a persisted runtime identity.
- **Source:** `deno task agentic:runtime status --worktree /home/codex/repos/ns-rfc-command-kit`.
- **Expected:** A read-only session snapshot associated with the pre-staged Codex thread.
- **Actual:** Exit 3, `MISSING_IDENTITY`, zero sessions, `changed: no`.
- **Severity:** minor.
- **Action:** accept for this run; preserve the checked-in thread receipt and do not repair/restart an active daemon-attached session.
- **Evidence:** `codex-thread-ids.md`; `supervisor.md`.

## 2026-08-08 — Owner-controlled evaluator routing

- **What:** Formal review/evaluation is reserved for existing external sessions steered by the root orchestrator.
- **Source:** Owner implementation brief.
- **Expected:** Harness default would route a selected formal PLAN/IMPL evaluation via its canonical separate-session lanes.
- **Actual:** This generator must prepare inputs, stop at `status:plan-eval`, and must not trigger PLAN-EVAL/IMPL-EVAL itself; root will steer Fable cross-RFC review and a final Qwen adversarial pass.
- **Severity:** significant.
- **Action:** accept as explicit owner override; do not self-certify and do not launch a rival session.
- **Evidence:** `implement.md`; `supervisor.md`.
