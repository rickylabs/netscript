# Drift Log — plan-deploy-plugin--seed

Append-only. Severity: `note` | `significant` | `architectural`.

| ID | Date | Severity | Drift | Disposition |
| --- | --- | --- | --- | --- |
| D-1 | 2026-07-18 | note | `workflow/seed-run.md` stage A requires a draft PR as commit trail; kickoff stop-line forbids creating any PR. | Kickoff wins (owner-authored, verbatim, in force). Commit trail = branch `plan/deploy-plugin` pushed with explicit refspec. |
| D-2 | 2026-07-18 | note | Seed-run stages F (adversarial) and G (PLAN-EVAL) are replaced by a kickoff-defined pipeline: supervisor-dispatched Sol-xhigh constructive adversarial + Kimi-K3 doc-story, then generator resume. Formal PLAN-EVAL timing is a supervisor decision downstream. | Recorded; this session generates and stops at `STAGE-COMPLETE: generator`. |
| D-3 | 2026-07-19 | significant | Sol adversarial pass (SF-1…SF-16) overturned five r1 design seams: verb lifecycle (7-op `plan`-subsumes-emit → eight-op with pure `plan`), capability vocabulary (flat closed union → structural namespaced refs with scoped verdicts), host extensions (union-widening + deploy flag → data-driven contributions + tooling protocol variant), W1 shape (verbatim move → refactor-then-extract), and registry claims (closed-on-key "preserved" → duplicate rejection is NEW). | All integrated as corpus r2 (`adversarial-sol-triage.md`); board recut to 29 `DPB-n` children. The adversarial stage worked as designed — no escalation. |
| D-4 | 2026-07-19 | note | Kickoff names "Kimi K3" for stage 3; `.llm/tools/agentic/config/models.ts` only binds `visionEval: openrouter/moonshotai/kimi-k2.6`. Stage-3 dispatch passes the K3 OpenRouter slug explicitly to the OpenCode launcher (owner-directed model; config update left to a framework slice — this run cannot edit repo code). | Slug verified against the public OpenRouter model list before dispatch; recorded below in worklog. |
