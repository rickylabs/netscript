# Drift Log: #1054 AI tool lifecycle

## 2026-08-02 — Owner-waived evaluator route

- **What:** Supervisor performs PLAN-EVAL and IMPL-EVAL without an evaluator artifact for Plan-Gate.
- **Source:** owner assignment dated 2026-08-01.
- **Expected:** separate open-model evaluator session and `plan-eval.md`.
- **Actual:** explicit waiver prohibits all configured evaluator transports and says not to fabricate the artifact.
- **Severity:** significant
- **Action:** accept
- **Evidence:** assignment and `supervisor.md`.

## 2026-08-02 — Sequential E2E blocked before AI chat gate

- **What:** Three `scaffold.runtime` attempts passed AI lifecycle but aborted at users service health.
- **Source:** JSON reports under `.llm/tmp/` and failed-report printer.
- **Expected:** lifecycle and AI chat gates green in the same completed report.
- **Actual:** default postgres returned unhealthy database aggregate; sqlite returned plain `Healthy`,
  which does not match the aggregate-health assertion. The later AI chat gate was never scheduled.
- **Severity:** significant
- **Action:** defer to baseline recovery; do not claim the paired gate green.
- **Evidence:** `worklog.md`; exact chat-gate script separately passes on the generated sqlite project.
