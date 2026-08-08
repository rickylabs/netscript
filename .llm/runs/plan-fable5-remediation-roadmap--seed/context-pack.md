# Context Pack — plan-fable5-remediation-roadmap--seed

## What this run is

Planning-only seed run (owner charter 2026-08-08): produce a **long-range NetScript remediation
roadmap** — master plan, milestone train, deduplicated issue drafts, RFC drafts, existing-issue
amendments, Wave-7 harness proposal, implementation handoff — as **drafts only** under
`fable-5-remediation-plan/`. Zero GitHub board mutation; owner ratifies later.

## Identity & constraints (see supervisor.md for full detail)

- Supervisor: Claude Fable 5 · high (owner override from low), bypassPermissions, RC enabled.
- PLAN-EVAL + IMPL-EVAL: **owner-waived** (drift D-2). No evaluators, no OpenHands/OpenRouter.
- Claude Workflows with **Opus 5** subagents = research/synthesis contributors only (drift D-3).
- Branch `plan/fable5-remediation-roadmap`; baseline `fac9e339042c` (== origin/main at start).
- Push only `HEAD:refs/heads/plan/fable5-remediation-roadmap`. Draft PR vs `main` is the commit
  trail.

## Evidence inputs (charter)

1. Codex pre-plan package: `/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/codex-sol-last-runs-remediation-plan/` (README, ISSUE-DEDUP-MATRIX, EVIDENCE-REGISTER).
2. All prior agent-posts waves (archive + wave-3..6) under `.../agent-posts/`.
3. Live GitHub board (issues/milestones/labels/PR history) — wins over carried-in reports.
4. Deep repo + published-docs audit (Quickstart, MCP, CLI, web, services/SDK, auth, plugins,
   runtime, observability, Aspire, scaffold, doctrine, debt, skills, harness).
5. `rickylabs/eis-chat` + competing meta-frameworks + oRPC extension/middleware/context.
6. 0.0.5 milestone/orchestrator history.

## Status

- S1 bootstrap: done (run dir, waivers, draft PR — see worklog).
- Next: Stage B discovery corpus.
