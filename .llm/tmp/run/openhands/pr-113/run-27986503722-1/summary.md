# Run summary — openhands-run-27986503722-1

## Summary

PLAN-EVAL gate verdict for PR-B (`chore/alpha1-jsr-shim-removal`). Multi-package alpha-1
deprecation-shim removal (ARCHETYPE-2/3/5). Evaluator role: separate-session plan gate;
planning only, no implementation, no source edits, no `deno.lock` churn.

**Verdict: `FAIL_PLAN`** (cycle 1 of 2).

## Changes

- `commits`:
  - `914ecaa9 chore(plan-eval): PLAN-EVAL cycle 1 — FAIL_PLAN for PR-B shim removal`
- Added (committed, pushed to `origin/chore/alpha1-jsr-shim-removal`):
  - `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md` — full evaluator verdict with
    tier-by-tier findings, gate-by-gate checklist, ruling on the two open PLAN-EVAL questions
    (T3 wholesale retirement + version policy), and the explicit FAIL_PLAN remediation list.
  - `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` — append-only drift log entry for cycle 1.
  - `.llm/tmp/run/chore-alpha1-jsr-shim-removal/worklog.md` — worklog entry for cycle 1.

## Verification

| Check                                        | Result   | Note                                                                  |
| -------------------------------------------- | -------- | --------------------------------------------------------------------- |
| T1 0-consumer claim                          | VERIFIED | 8 cli aliases, db `buildConnectionString`, `mssqlJsonExtension`, telemetry `context/job` |
| T2 canonical-equivalence claim               | VERIFIED | mssql `authentication.type='ntlm'` + fresh `staticFiles`/`fsRoutes` exist |
| S3a saga-side `saga-bus-legacy` 0-consumer    | VERIFIED | only consumer is `saga-supervisor.ts:130` forwarding `adapter: 'legacy'` |
| S3b workers-side canonical-equivalence claim | **FALSE** | `defineScheduledTrigger` and `defineJob().schedule` are parallel cron subsystems (separate scaffolds, CLI flags, runtime adapters) |
| Version policy (alpha-1 minor + breaking note) | VERIFIED | semver-correct for `0.0.1-alpha.0`; coordinated major bump unwarranted |
| Zero-cast                                    | VERIFIED | removal-only; no new casts introduced                                  |
| Lock hygiene                                 | PRESERVED | no `deno.lock` churn, no `deno cache --reload`, no source edits        |

## Required fixes (the FAIL_PLAN remediation list)

1. **S3b scope correction (blocking).** Pick (a) narrow to entry-point-only, (b) defer S3b from
   PR-B, or (c) rescope PR-B to a subsystem-merge PR. The current wholesale claim is not
   supportable.
2. **Run `jsr-audit` against the planned public surface** of the 6 affected packages
   (incl. `JobDefinition`, `JobBuilder`, the v1 contract schemas, `WorkerCronScheduler`).
3. **Doc/recipe updates must be in S3b's file list** if S3b proceeds:
   - `packages/plugin-workers-core/README.md:99`
   - `packages/plugin-workers-core/docs/recipes/adding-a-job.md:22`
   - `docs/site/capabilities/durable-sagas.md:191`
   - `docs/site/explanation/durability-model.md:105`
   - `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65`
   - `plugins/workers/src/cli/workers-cli-backend.ts` (`--schedule` flag)
4. **Add `deno doc --lint`** to the S3 gate set (per affected package).
5. **Convert "Codex must grep" to an explicit gate** rather than a free-form "open item handed
   to PLAN-EVAL".
6. **Re-run open-decision sweep** after the S3b fix.

## Responses to review / issue comments

No review-thread replies required; this is a planning-only PR comment. The verdict comment
body to be posted by the workflow (via `output_mode: pr-comment`) is recorded in
`replies.json` if needed; the workflow owns the GitHub comment.

## Remaining risks

- Cycle 2 budget: 1 remaining `FAIL_PLAN` cycle before escalation per `gates/plan-gate.md`.
- S3b is the single blocking issue. T1, T2, S3a are sound and can ship as PR-B once S3b is
  re-scoped.
- The two cron subsystems (workers `Scheduler` and triggers `CronTriggerSchedulerAdapter`)
  remain separate. A future subsystem-merge plan is the correct vehicle for any
  consolidation work, not PR-B.

## Output mode

- `output_mode: pr-comment` — the workflow owns posting the PR comment; this run did not
  post to GitHub.
- Run trace: `.llm/tmp/run/openhands/pr-113/run-27986503722-1/`.