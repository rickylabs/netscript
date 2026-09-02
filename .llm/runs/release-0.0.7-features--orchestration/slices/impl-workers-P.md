use harness

# SLICE P — #1592 Slice 2: outbound progress to durable execution

PLAN-EVAL returned **`PASS`**. Slice P is **independently landable** — the evaluator confirmed P ∥ C
independence is real (disjoint files, no shared types).

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-workers-p` |
| Branch | `feat/workers-progress-transport` (new, off `main` `78be0e032`) |
| Run dir | `.llm/runs/feat-workers-runtime--1592-1451/` (plan artifacts already staged here — **commit them with your slice**) |
| Issue | **#1592 Slice 2** |

## SKILL

`netscript-harness`, `netscript-doctrine` (Archetype 3, `packages/plugin-workers-core`),
`netscript-tools`.

## Read first

`plan.md` **"Slice P"** is your contract — its 10-file ceiling and gates, verbatim. Then `plan-eval.md`
(the `PASS` and its required follow-through). Do not re-derive design.

## What already shipped — do not redo or duplicate

**#1592 Slice 1 merged.** `KvExecutionState.progress()` already persists and publishes through the
existing `#transition → #save` path and its mutation hook; the durable-stream schema and producer
already carry `progressPercent`/`progressMessage`. Your job is the **transport** that reaches it.

**The execution-record shape is declared in six places** and a prior repair aligned all six. **None of
those six declaration sites may gain a seventh sibling**, and none may drift.

## Locked decisions you implement

- **`WorkerPool` owns the per-execution outbound channel and is its consumer.** The evaluator
  confirmed this is the structurally correct owner — it is the only ctx-construction point.
- **Progress is per-execution FIFO, terminally drained, not coalesced, and replayed through existing
  execution upserts.** "Not coalesced" is a deliberate decision, not an omission — implement it as
  specified and document it.
- **`messages.ts` should remain unchanged.** Using its existing `WorkerOutboundMessage` /
  `JobProgressMessage` union is the point of the slice. Changing it is a **rescope: stop and report**.
- The current runtime is **in-process**; the seam must survive a future thread boundary (outbound
  payloads cloneable).

## Ceiling

Exactly the plan's Slice P touch set (10 files max). Anything beyond — especially `packages/sdk`,
`registry-compiler.ts` (ruled follow-up, not inclusion), or a seventh record declaration — is a
**rescope: stop and report**.

## Definition of done

- Every Slice P gate in the plan, plus the follow-through the PLAN-EVAL requires: the Tier-A slice
  review must include **`deno task quality:scan`**.
- Structured scoped check/test/lint/fmt with **non-empty `stdout.bytes`** per receipt — `deno task`
  caching can return `PASS`/exit 0 with zero-byte stdout describing a run that never happened.
- Judge `publish-dry-run` on **`stderr.bytes`**; that gate writes to stderr and zero stdout is normal.
- `doc:lint` **requires `--root`**; omitting it yields a fast usage-error FAIL that looks real.
  Record doc-lint as "N baseline / 0 new" after measuring the baseline on `main`.
- `deno.lock` byte-identical.
- **Do not run any local runtime, Aspire, Docker, or browser gate.** This lane holds no runtime lease.
- One commit, pushed by **explicit refspec**. Update `worklog.md` and `context-pack.md`, and **commit
  the staged plan/plan-eval artifacts** — `.llm/runs/**` is intentional cross-agent context and must
  never be stripped, untracked, or redacted.
- Open a **draft** PR with `Refs #1592` and **no closing keyword** — Slice 2 does not complete #1592 on
  its own.

**Never place `close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a
negation — GitHub's matcher does not parse negation, and this milestone has already had two PRs
accidentally register live closing references that way. Write "merging leaves #1592 open".

No labels, no acceptance boxes, **no evaluator dispatch, and never cancel an evaluator run** —
evaluator lifecycle belongs to the supervisor. No merge.
