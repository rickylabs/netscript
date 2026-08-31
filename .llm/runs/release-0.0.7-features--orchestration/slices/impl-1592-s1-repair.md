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
