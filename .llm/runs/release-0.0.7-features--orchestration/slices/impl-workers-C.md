use harness

# SLICE C — #1451: `JobConfig` policy completion

PLAN-EVAL returned **`PASS`**. Slice C is **independently landable** and independent of Slice P — the
evaluator confirmed disjoint files and no shared types. Slice G (config-aware generation) comes
**after** you, because zod would strip policy fields this slice has not yet modelled.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-workers-c` |
| Branch | `feat/workers-job-config-schema` (new, off `main` `78be0e032`) |
| Run dir | `.llm/runs/feat-workers-runtime--1592-1451/` (plan artifacts already staged — **commit them with your slice**) |
| Issue | **#1451** (contract half) |

## SKILL

`netscript-harness`, `netscript-doctrine` (Archetype 3, `packages/plugin-workers-core`),
`netscript-tools`.

## Read first

`plan.md` **"Slice C"** is your contract, then `plan-eval.md`. Do not re-derive design.

## What to build

`JobConfig` gains **exactly four** fields — `priority`, `retryDelay`, `maxConcurrency`, `persist` —
using the **canonical constraints and defaults**.

**Derive those defaults from what the generator already emits**, not from invention:
`RegisterJobInput`'s generated literal already carries all four, which is itself the evidence that the
config schema is what lags. Match it.

## File ceiling: exactly 2

1. `packages/plugin-workers-core/src/config/job-config.ts`
2. `packages/plugin-workers-core/tests/config/workers-config_test.ts` (new focused schema test)

Anything else is a **rescope: stop and report**. In particular, do **not** touch the generator
(`runtime-registry-generator.ts`) — that is Slice G.

## Required tests

Defaults for all four fields; explicit values; and rejection of out-of-range, fractional,
negative-concurrency, and negative-delay inputs. Also confirm, rather than assume:

- **zero concurrency remains valid** per the canonical job-definition schema;
- group topic normalization remains intact;
- the derived `JobConfigInput` authoring shape remains valid.

## Definition of done

Every Slice C gate: focused core config check/test/lint/fmt; `deno doc` for `JobConfig`; config-subpath
doc-lint with **zero new** diagnostics; core publish dry-run; `deno task arch:check`; unchanged lock
blob. Plus the PLAN-EVAL's follow-through: the Tier-A slice review must include
**`deno task quality:scan`**.

Repo traps that have cost this milestone real time:

- Check **`stdout.bytes` is non-empty** on check/lint/fmt/test receipts — `deno task` caching can
  return `PASS`/exit 0 with zero-byte stdout describing a run that never happened.
- Judge **`publish-dry-run` on `stderr.bytes`**; that gate writes to stderr.
- `doc:lint` **requires `--root`**; omitting it yields a fast usage-error FAIL that looks real.

**Do not run any local runtime, Aspire, Docker, or browser gate.** This lane holds no runtime lease.

One commit, pushed by **explicit refspec**. Update `worklog.md` and `context-pack.md`, and **commit the
staged plan/plan-eval artifacts** — `.llm/runs/**` is intentional cross-agent context and must never be
stripped, untracked, or redacted. Open a **draft** PR with `Refs #1451` and **no closing keyword** —
Slice C is the contract half only; Slice G completes the issue.

**Never place `close`/`closes`/`fixes`/`resolves` immediately before an issue number**, including in a
negation. Write "merging leaves #1451 open".

No labels, no acceptance boxes, **no evaluator dispatch, and never cancel an evaluator run**. No merge.
