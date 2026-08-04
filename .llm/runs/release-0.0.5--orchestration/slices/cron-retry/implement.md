use harness

# Slice W4-D: cron retry/backoff — honor or remove the published contract — #1104 (p2)

You are the implementation supervisor for the PR resolving #1104. Read the live issue body first —
it is measured and precise: `ScheduleOptions.backoff`/`maxRetries` and
`CronExecutionContext.attempt` are published and documented, but neither adapter nor
`packages/cron/adapters/_shared.ts` reads them; every execution reports `attempt: 0`. A caller can
configure a recovery policy, get no error, and still get a single attempt.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/cron archetype — identify before changing)
- `.agents/skills/netscript-deno-toolchain`

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: no
local formal PLAN-EVAL — evaluation composes draft→ready augment + the orchestrator pre-merge
gate. Mark your PLAN-EVAL gate row "composed per milestone-run.md (orchestrator waiver)", lock
your plan, and implement in the same run.

## Decision frame (binding)

The issue's first acceptance box is a genuine decision: **implement** the published behavior, or
**deprecate/remove** the dead options and correct the manual. Make the decision from the contract's
consumers (who reads `attempt`? what do the docs promise? what would silent behavior change break?)
and record it with rationale in your plan before implementing. Do not implement a third shape.
Whichever way you decide, the dishonest state (options accepted + ignored) must end.

## Deliverable = the gates

1. The issue's six acceptance boxes, honestly — RED-first where behavior changes (a failing test
   that shows today's single-attempt execution against a configured retry policy).
2. If retained: retries on BOTH providers (memory + Deno KV) with fixed/exponential/linear
   policies, `attempt` incremented per retry, abort/shutdown preserved during backoff waits,
   `maxRetries` semantics locked in docs and tests.
3. Deterministic fake-clock tests: success-after-retry, exhausted retries, backoff capping,
   cancellation. No wall-clock sleeps.
4. Archetype full column: `quality:gate`, scoped check/lint/fmt wrappers (`--unstable-kv` for KV
   paths), doc-lint + publish dry-run if the export surface moves, no new lint ignores, no
   `deno.lock` churn.
5. PR per netscript-pr: branch `fix/cron-retry-backoff-contract`, body carries `Closes #1104`,
   labels `type:fix` + `area:database` + `priority:p2` + exactly one `status:`, milestone 0.0.5.
   Draft while implementing; ready when gates are green. Explicit-refspec pushes only.

## Constraints

- Queue/task-runtime retry policies are out of scope (separate contracts).
- Docs corrections live with the code change (`docs/site/data-persistence/kv-queues-cron.md`).
- End your final message with DONE when the PR is ready, or BLOCKED: <reason>.
