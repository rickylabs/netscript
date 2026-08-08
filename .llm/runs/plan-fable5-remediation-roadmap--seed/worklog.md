# Worklog — plan-fable5-remediation-roadmap--seed

## Evaluator waivers (owner, run charter 2026-08-08)

- **PLAN-EVAL: WAIVED by owner** for this research/planning run. No evaluator session launched.
- **IMPL-EVAL: WAIVED by owner** for this run (planning-only; no implementation exists).
- Owner will personally review the plan and decide whether later adversarial passes or board
  filing are needed. Mirrored in `supervisor.md` § overrides and `drift.md` D-2.

## Design

This is a planning-only seed run; the "public surface" is the artifact tree, not code.

1. **Artifact surface** — run root: `supervisor.md`, `research.md`, `plan.md`, `worklog.md`,
   `context-pack.md`, `drift.md`, `workflows/` (committed workflow scripts). Deliverables under
   `fable-5-remediation-plan/`: `MASTER-PLAN.md`, `ISSUE-DEDUP-AND-SUPERSESSION.md`,
   `MILESTONE-TRAIN.md`, per-milestone directories with issue drafts, RFC drafts,
   `EXISTING-ISSUE-AMENDMENTS.md`, `WAVE7-AND-AGENT-ADOPTION.md`, `IMPLEMENTATION-HANDOFF.md`,
   `research/` corpus + citations.
2. **Stage slices (commit plan)** — S1 bootstrap (run dir + draft PR); S2 discovery corpus
   (pre-plan package + waves + GitHub board + repo/docs audit + external comparison); S3
   synthesis; S4 design packs (milestones + issue drafts + RFCs); S5 plan lock + deliverables +
   handoff. Each slice: commit → push (`HEAD:refs/heads/plan/fable5-remediation-roadmap`) →
   draft-PR comment.
3. **Deferred scope** — Stage F adversarial, stage G PLAN-EVAL, stage H filing (owner-waived /
   owner-reserved). No GitHub board mutation of any kind.

## Slice log

### S2 — Discovery corpus (Stage B) — in progress

- Draft PR #1347 opened (labels `type:docs`, `area:docs`, `status:research`, `ci:skip-e2e`,
  `ci:skip-scaffold`); charter read-back posted as opening phase comment.
- Supervisor read the Codex pre-plan package in full; distillation committed at
  `fable-5-remediation-plan/research/preplan-package.md`.
- Tier-C workflow scripts committed **before execution** (seed-run hard rule), commit `7f52683e1`:
  - `workflows/b1-prior-and-board-workflow.js` → run `wf_e2194004-808` (7 Opus subagents:
    waves:early, waves:wave4, waves:wave5-6-plans, waves:wave6-runs, board:open, board:history,
    board:conventions).
  - `workflows/b2-repo-and-external-workflow.js` → run `wf_03b88126-e7e` (11 Opus subagents:
    repo:docs-quickstart, repo:mcp-cli, repo:web-layer, repo:services-sdk, repo:auth,
    repo:runtime-plugins, repo:observability-aspire, repo:scaffold-doctrine, ext:eis-chat,
    ext:meta-frameworks, ext:orpc).
  - Subagent model: `opus` (resolves to Claude Opus 5, the current Opus generation — owner
    directive D-3). All agents are read-only outside their single assigned research output file;
    supervisor reviews and commits their output (no self-certification).
- Supervisor skill reads this stage: `agent-milestone-orchestrator`, `netscript-doctrine`,
  `netscript-release` (canary-first + versioning doctrine), `netscript-pr` (S1). Domain skills
  (`deno-fresh`, `fresh-ui-horizontal`, `aspire`, `jsr-audit`, `netscript-cli`,
  `netscript-tools`, `netscript-deno-toolchain`, `rtk`, `claude-manager`) are exercised by the
  domain subagents and consulted by the supervisor at Stage D where an issue draft depends on
  them.

### S1 — Bootstrap (Stage A)

- Run dir created; `supervisor.md` written first with identity, lane table, and owner overrides.
- Waivers recorded (above). Baseline verified: `HEAD == origin/main == fac9e339042c` at start.
- Skills activated: `netscript-harness` (+ `activation.md`, `run-loop.md`, `seed-run.md`,
  `lane-policy.md`, `SCOPE-docs.md`, `templates/supervisor.md`), `netscript-pr` (full read).
  Remaining charter skills are read at the stage that needs them; each read is logged here.
