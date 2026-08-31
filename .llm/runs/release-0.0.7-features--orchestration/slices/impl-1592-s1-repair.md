use harness

# SLICE — #1814 / #1592 Slice 1 repair: `ExecutionRecord` declaration consistency

You are the implementer. Bounded repair, authorized by the milestone coordinator. **Do not widen it.**

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1592` |
| Branch | `feat/workers-execution-progress` |
| Base | the worktree's current HEAD — do not rebase, do not merge `main` |
| Run dir | `.llm/runs/feat-workers-execution-progress--1592/` |
| PR | #1814 (`Refs #1592`, **partial** — must not gain a closing keyword) |

## SKILL

`netscript-harness`, `netscript-doctrine` (Archetype 3, `packages/plugin-workers-core`),
`netscript-tools`.

## The defect — already diagnosed, do not re-derive

CI `quality` fails at the `Publish dry-run (0 slow-types across all units)` step with **3x `TS2345`**:

- `plugins/workers/services/src/routers/runs.ts:20:49` and `:79:61`
- `plugins/workers/services/src/routers/tasks.ts:86:57`

This is **caused by this slice** — `main`'s own `ci.yml` is green at `7908399af`, `584caa03f`, and
`0274c0a70`, and that same job runs `publish:dry-run` on every push. It is not environmental and not
pre-existing.

**Root cause.** `packages/plugin-workers-core` carries **three independent hand-maintained
declarations** of the execution record shape. This slice updated only two of them:

| Declaration | Progress fields? |
| --- | --- |
| `src/domain/job-definition.ts` — `ExecutionRecordSchema` (zod) **and** its TS mirror | **updated** by this slice |
| `src/state/execution-state.ts:35` — `ExecutionRecord` | **updated** by this slice |
| `src/runtime/runtime-types.ts:129` — `ExecutionRecord` | **STALE — 0 occurrences of `progressPercent`** |
| `src/registry/registry-types.ts:119` — `ExecutionRecord` | **STALE — 0 occurrences of `progressPercent`** |

`ExecutionRecordSchema` feeds the **public v1 contract** through
`src/contracts/v1/workers.contract-definition.ts:197`
(`executions: z.ZodArray<typeof ExecutionRecordSchema>`), so the v1 output now *requires*
`progressPercent` and `progressMessage` on every execution. But the workers service routers import
`ExecutionRecord` from `@netscript/plugin-workers-core/runtime` — the **stale** copy — and spread it
into the response, so their return type no longer satisfies the contract.

The comment at `execution-state.ts:33-35` states the invariant this slice broke: *"A fixed,
fully-enumerated shape keeps spreads precise so the connector handlers type-check against the
contract."* Two of the four enumerations were left behind.

## Ceiling — exactly two files

1. `packages/plugin-workers-core/src/runtime/runtime-types.ts`
2. `packages/plugin-workers-core/src/registry/registry-types.ts`

Add to each `ExecutionRecord` declaration, positioned and documented to match
`src/state/execution-state.ts` exactly (same field order relative to `workerId`/`attempt`, same
doc-comment style):

```ts
    /** Latest execution progress percentage. */
    readonly progressPercent: number | null;
    /** Latest execution progress message. */
    readonly progressMessage: string | null;
```

**Do not** touch `plugins/workers/services/**`. **Do not** make the fields optional in
`ExecutionRecordSchema` — the required-nullable contract shape is the accepted design and the state
copy already matches it; the repair is to make the two stale declarations agree, not to weaken the
contract. **Do not** merge `main`, retick PR boxes, change labels, or touch any other file.

## Definition of done

- `deno task publish:dry-run` exits **0** — this is the gate that was red; it is the primary proof.
- Scoped check/lint/fmt over `^packages/plugin-workers-core/` — PASS with **non-empty stdout** on each
  receipt (this repo has a cache-replay trap where `PASS`/exit 0 comes back with zero-byte stdout;
  read `stdout.bytes` before trusting a receipt).
- `packages/plugin-workers-core/tests` — PASS, no test deleted, skipped, or weakened.
- `deno.lock` byte-identical (`edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`).
- One commit, pushed, with a PR comment stating the slice, the commit hash, and the gate evidence.
- Update `worklog.md` and `context-pack.md` in the run dir as part of the same commit.

If `publish:dry-run` still fails after the two declarations agree, **stop and report** the exact
remaining diagnostic rather than widening the ceiling — a fourth stale copy or a genuine contract
design problem is a rescope, not something to absorb.

---

# AMENDMENT — cycle 2, ceiling widened from 2 files to 4

Cycle 1 did exactly the right thing: it applied the two declaration fixes, found the ceiling
insufficient, and **stopped and reported instead of absorbing a rescope**. Keep its uncommitted edits
to `runtime/runtime-types.ts` and `registry/registry-types.ts` — they are correct and they removed the
original `runs.ts:20` and `tasks.ts:86` diagnostics.

Two sites remain, and they are the last two. The record shape is hand-maintained in **six** places;
this repair brings the final two into line:

1. `packages/plugin-workers-core/src/testing/job-fixtures.ts` — `createExecutionRecordFixture`
   returns `ExecutionRecord` but can yield `progressPercent` as `number | null | undefined`
   (`TS2322` at `:97`). Give both fields a concrete default of `null` in the frozen literal, and make
   the fixture options accept `progressPercent?: number | null` / `progressMessage?: string | null`
   coalesced to `null` — never `undefined`.
2. `plugins/workers/services/src/routers/runs.ts` — `batchQueryExecutions` (`TS2345` at `:79`) builds
   its own `matchingExecutions: Array<{…}>` local type by hand-enumerating fields rather than
   spreading. Add `progressPercent` and `progressMessage` to that local type and populate them from
   the source record.

**Ceiling is now exactly four files** (the two from cycle 1 plus these two). Nothing else.

**Design decision — do not reverse it.** Keep the fields **required-nullable** on
`ExecutionRecordSchema`. Making them `.optional()` would be smaller, but it silently weakens a v1
contract shape that Tier-A and IMPL-EVAL already accepted, and it would leave the uniform
"every execution reports progress, `null` when absent" guarantee unimplemented. If you conclude the
required-nullable shape genuinely cannot work, **stop and report** — do not switch designs.

Definition of done is unchanged, and `deno task publish:dry-run` exiting **0** remains the primary
proof. Commit once, push by explicit refspec, comment on PR #1814, and update `worklog.md` +
`context-pack.md` in the same commit.
