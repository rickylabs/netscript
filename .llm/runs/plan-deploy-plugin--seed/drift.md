# Drift Log — plan-deploy-plugin--seed

Append-only. Severity: `note` | `significant` | `architectural`.

| ID | Date | Severity | Drift | Disposition |
| --- | --- | --- | --- | --- |
| D-1 | 2026-07-18 | note | `workflow/seed-run.md` stage A requires a draft PR as commit trail; kickoff stop-line forbids creating any PR. | Kickoff wins (owner-authored, verbatim, in force). Commit trail = branch `plan/deploy-plugin` pushed with explicit refspec. |
| D-2 | 2026-07-18 | note | Seed-run stages F (adversarial) and G (PLAN-EVAL) are replaced by a kickoff-defined pipeline: supervisor-dispatched Sol-xhigh constructive adversarial + Kimi-K3 doc-story, then generator resume. Formal PLAN-EVAL timing is a supervisor decision downstream. | Recorded; this session generates and stops at `STAGE-COMPLETE: generator`. |
