# Context pack — release 0.0.7

Read, in order:

1. `.llm/harness/workflow/milestone-run.md`
2. `.llm/harness/workflow/canary-cadence.md`
3. `.llm/harness/workflow/run-loop.md`
4. `.llm/harness/workflow/lane-policy.md`
5. `.agents/skills/agent-milestone-orchestrator/SKILL.md`
6. This run's `research.md`, `plan.md`, `worklog.md`, `step0-synthesis.md`, the four milestone
   control JSON artifacts, `milestone-leaf-plan.json`, and `leaf-contracts.json`.

Baseline identity is `01e0960494c95ce56eb35892c211a095eb13e6ed`. Treat GitHub live state as mutable
after the snapshot; any issue or `main` drift must be recorded before dispatch or merge.

Step 0 is approved at 64 inspected targets / 60 active issues, 43 leaves, and nine dispatch waves.
#1564 is closed-fixed; there is no implementation wave-zero barrier. PLAN-EVAL cycle 2 approved
dispatch at plan head `331f7c664`; `leaf-contracts.json` is binding input for every leaf.

Reset authority at `2026-08-15T00:00:00+02:00`: `codex-root-0.0.7` remains sole milestone
coordinator in Codex session `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd`; its canonical transcript is
`/home/codex/.codex/sessions/2026/08/13/rollout-2026-08-13T12-20-27-019ffaa3-32ae-7b02-92a5-d7ae146d8cbd.jsonl`.
Resume that exact session rather than creating a rival coordinator. Topic supervision is native
Claude Opus 5/high only. Preserve and park the four historical Codex topic threads before attaching
one Remote Control supervisor to each existing topic worktree. Claude supervisors do not implement;
WSL Codex Sol leaves use effort matched to the harness's per-slice complexity record.

Read `briefs/reset-gates/dispatch.json` after the central state. It supersedes both the pre-reset
six-Fable route and the rejected Sonnet-low matrix. The six retained holds have specific existing
issue/complexity justification; future PLAN-EVAL is conditional rather than mechanical. Formal gates
stay fresh, separate, opposite-family, and serial. Opus 5 low through high is the normal
adversarial/evaluation route. Fable 5 is reserved for a recorded genuinely architectural PLAN
question or an exceptionally complex implementation/review. No paused leaf resumes merely because
the clock reset; its exact head, hold, lease, CI, and formal gate must be re-established first.

All four historical Codex topic controllers are now durably parked: docs had no live session;
internals/fixes/features returned `TOPIC_CONTROLLER_PARKED`, are idle, and left clean worktrees. The
rejected Sonnet-low replacement canaries also exited with `TOPIC_CONTROLLER_PARKED_MODEL_FLOOR` and
dispatched no leaf or evaluator. The real replacements are now active through native Claude 2.1.233
with explicit `--model claude-opus-5`, `--effort high`, `--remote-control`, the exact initial brief,
and bypass permissions. Their exact session/PID/bridge/URL/topic-head receipts live in
`milestone-cluster-state.json` and their topic journals. The hybrid wrapper is not needed unless a
later task explicitly authorizes its alternate-worker delegation surface.
