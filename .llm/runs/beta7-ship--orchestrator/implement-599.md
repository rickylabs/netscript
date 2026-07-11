use harness

# Slice brief — #599: canonical `netscript.*` correlation/outcome floor on Flow-B product spans

## SKILL

Read these skills before any work: `.agents/skills/netscript-harness/SKILL.md`,
`.agents/skills/netscript-doctrine/SKILL.md` (telemetry + workers are framework source),
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/rtk/SKILL.md`.

## Identity + ground rules

- You are a WSL Codex implementation agent under the beta-7 shipping orchestrator (Claude session
  `df71d36c`). The orchestrator owns the PR lifecycle — you must NOT open PRs.
- **PLAN-EVAL waiver**: external evaluator dispatch is owner-waived for this run (drift D1 in
  `.llm/runs/beta7-ship--orchestrator/supervisor.md`). Write a short plan section into your worklog,
  then implement — do not block waiting for an evaluator.
- Worktree: `/home/codex/repos/ns-wt-599`, branch `fix/599-flowb-attribute-floor`. Stay in it.
- Push with an explicit refspec only:
  `git push origin HEAD:refs/heads/fix/599-flowb-attribute-floor`.
- Commit a worklog at `.llm/runs/fix-599-flowb-attribute-floor--codex/worklog.md` (plan, evidence,
  gate results, drift) and keep it updated with each slice commit.
- Lock hygiene: never delete `deno.lock`, never `deno cache --reload`.

## Task (issue #599 — read it first: all four acceptance boxes are the contract)

Product gaps found by the T8 Flow-B merge gate (PR #598, see
`.llm/runs/` worklog-409 follow-up section and `validate-flow-b-traces.ts`):

1. `job.execute` emits canonical `netscript.correlation.id` but only legacy `job.status` — add the
   canonical `netscript.*` outcome/status attribute (keep legacy `job.status`).
2. Trigger + queue spans must carry the complete canonical correlation/outcome pair per the #402
   TC-6/TC-7 floor (read `docs/architecture/` + telemetry package conventions for exact keys).
3. `executeDenoJob()` drops `correlationId` when rebuilding the in-process `JobMessage` — preserve
   it so the callback handler inherits the product span's correlation value.
4. THEN tighten the T8 gate: extend `validate-flow-b-traces.ts` `correlatedSpans`/outcome sets to
   include these spans — tighten, don't fork. The gate must assert the new floor.

Touches `packages/telemetry` and/or `plugins/workers` product source + the CLI e2e T8 validator.
Doctrine first: identify the archetype and public-surface impact before editing; no new public API
without recording it in the worklog.

## Validation (record verbatim outputs in the worklog)

- Scoped check/lint on touched roots via `.llm/tools/run-deno-check.ts` / `run-deno-lint.ts`
  (`--ext ts,tsx`).
- Package tests for `packages/telemetry` and `plugins/workers`.
- The T8 flow-b gate: run the relevant `deno task e2e:cli gates <t8-gate-id>` (find the exact gate
  id in `packages/cli/e2e`; do NOT run the full scaffold.runtime suite — the orchestrator owns
  merge-readiness runs; coordinate via worklog if you believe a full run is required).

## Done means

All four acceptance boxes implemented with evidence lines in the worklog, committed and pushed to
`fix/599-flowb-attribute-floor`, worklog committed. Report "DONE" with a summary, or "BLOCKED: <why>".
