use harness

# PLAN SLICE — #1592 Slice 2 + #1451, clustered: workers runtime plumbing

**Plan only. Write no product code.** Both issues need the same missing capability, and this lane
recorded early that they should be planned together rather than dispatched separately.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-workers` |
| Branch | `feat/workers-runtime-plan` (off current `main`) |
| Run dir | create `.llm/runs/feat-workers-runtime--1592-1451/` |
| Issues | **#1592 Slice 2** and **#1451** |

## SKILL

`netscript-harness`, `netscript-doctrine` (Archetype 3, `packages/plugin-workers-core`),
`netscript-cli`, `netscript-tools`.

## What already shipped — do not re-plan it

**#1592 Slice 1 merged** (PR #1814). `KvExecutionState.progress()` persists and publishes through the
existing `#transition → #save` path and its mutation hook, and the durable-stream schema/producer
carry `progressPercent`/`progressMessage`. The record shape is declared in **six** places; a prior
repair aligned them all — treat that as a constraint, not an invitation to add a seventh.

## The two gaps to plan

### #1592 Slice 2 — `ctx.reportProgress()` → `KvExecutionState.progress()`

Prior research found the honest blocker: `WorkerOutboundMessage` / `JobProgressMessage`
(`packages/plugin-workers-core/src/runtime/messages.ts`) model a `'progress'` message, but **neither
`job-dispatcher.ts` nor `in-process-job-runner.ts` contains any code reading or acting on any
outbound message** — the protocol type exists with no found consumer. Verify that independently, then
design the wiring: who owns the channel, how a job's `ctx` reaches it, and what happens for the
in-process runner versus a worker thread.

The issue also demands **ordering, coalescing, and replay** semantics be documented. Decide them; do
not defer them again.

### #1451 — generated registry cannot consume project job policy

`JobConfig` (`packages/plugin-workers-core/src/config/job-config.ts`) already types description,
timeout, maxRetries, permissions, tags, retention. But the generator
(`plugins/workers/src/cli/runtime-registry-generator.ts`, `appendJobDefinitions`) emits a **fully
generic** `createJobDefinition()` with hardcoded `timeout: 300000, maxRetries: 3, priority: 50`, and
receives only `{ manifestPath, profile, projectRoot }` — it has **no access to loaded project config**
and scans the filesystem instead.

Closing this needs: config-loading plumbing into the generator; a **matching strategy** between
discovered job files and configured entries (by id? by entrypoint path?); a **precedence rule**
between `workers.groups[].jobs[]` and the legacy flat `jobs[]`; and schema additions for
`priority`/`retryDelay`/`maxConcurrency`/`persist` — none of which exist on `JobConfig` today, though
`RegisterJobInput`'s generated literal already has all four, which is itself evidence the config
schema is what lags.

## What to produce

`research.md` and `plan.md` in the new run dir, plus `supervisor.md` and `worklog.md`.

The plan must state, as **locked decisions with rationale**: the message-channel ownership and
consumer for progress; the ordering/coalescing/replay semantics; the generator's config-loading seam;
the file↔config matching strategy; the group-vs-flat precedence rule; and the `JobConfig` schema
additions. Each locked decision needs the evidence that forced it.

Slice the work. Say plainly which slices are independently landable and which are ordered, and give
each a file ceiling and gate list. If the two issues turn out to need **separate** plans after
research, say so and explain why rather than forcing a cluster.

Record `PLAN-EVAL: REQUIRED` — this is decision-heavy work with several genuinely open design
questions, and this lane's #1349 experience shows what an unevaluated plan costs.

## Definition of done

- Zero changes under `packages/` or `plugins/`; `deno.lock` untouched.
- One commit, pushed by explicit refspec. Do **not** open a PR — the supervisor runs PLAN-EVAL first.
- No labels, no evaluator dispatch, no merge.

**Never place `close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a
negation.
