# RESUME CHECKPOINT — features orchestrator (written for context rotation)

**Ownership is retained across rotation: `#1762`/`#1387` and `#1805`/`#1591` remain this lane's.**

## Exact state

| Thing | Value |
| --- | --- |
| `main` | `584caa03f474de36b2d6e62e7162ab410c6ccb59` (Docs #1798 merged) |
| Topic branch | `orchestrator/release-0.0.7-features`, worktree `/home/agent/projects/netscript/worktrees/007-features` |
| Route | Opus 5 · xhigh · supervise-only |
| Eval routes (post-#1792) | IMPL `z-ai/glm-5.3-flash` · max; PLAN `qwen/qwen3.8-flash` · max. **DeepSeek is now LEGACY — do not use.** |

## PR control plane — all six are this lane's

| PR | Issue | Head | State | Next gate |
| --- | --- | --- | --- | --- |
| **#1762** | #1387 | content `7e76f68e4`, evidence `686eedb62` | non-draft, `status:ready-merge`, `Fixes #1387` live, **13/13 boxes checked** | terminal exact-head CI + GLM re-eval at `686eedb62`, then hand merge candidate. **Do not merge.** |
| **#1805** | #1591 | `e76e02271` | non-draft, `status:ready-merge`, `Fixes #1591` live | `check-test` was **pending**, `close-gate` **fail** — recheck both; #1591 has **zero** acceptance boxes so its close-gate acceptance is vacuous |
| #1810 | #1458 | `b818be147` | draft, Tier-A ACCEPTED, integrated | IMPL-EVAL (GLM) |
| #1814 | #1592 partial | `a4c6c3595` | draft, Tier-A ACCEPTED, integrated | IMPL-EVAL. **Merging must NOT close #1592** |
| #1820 | #1452 partial | `03392e186` | draft, Tier-A ACCEPTED, integrated | IMPL-EVAL. **Merging must NOT close #1452** |
| #1664 | #1355/#1360 | `a257807d8` | CONFLICTING, historically parked | **Owner boundary — do not revive unilaterally.** #1781 has merged; ask whether residual scope remains |

## Active shells / evaluators

None running that matter. All prior evaluator tasks have completed; their verdicts are committed.
The `#1349` PLAN-EVAL was **stopped** under the serial correction (0 lines, nothing lost) and must be
re-dispatched when that leaf resumes.

## THE ONE REAL BLOCKER — read before trusting any green

`#1762`'s CI `check-test` is **red**, and it is **not** pre-existing (I asserted that earlier and was
wrong; the final evaluator repeated the error). Measured:

- clean `main` repo-wide `deno task check` → **exit 0**
- `main` + 4 inert files at the leaf's exact file count → **exit 0**
- the leaf → **exit 1**, one `TS2551` on `packages/service/src/primitives/health.ts:184`, deterministic
- that file, root `deno.json`, and `packages/service/deno.json` are all **byte-identical to main**
- `deno check --unstable-kv health.ts` **alone** → clean; the scoped 5-package check → clean

`--unstable-kv` is passed to every batch (`run-deno-check.ts:369`); files are `localeCompare`-sorted
and chunked at 120. The leaf's added `packages/service/src/auth/` files shift which batch `health.ts`
lands in, and in that grouping the unstable-KV lib stops applying. **Leaf code is innocent; the CI red
is real and will not self-clear.** Fix belongs in `.llm/tools/run-deno-check.ts` (raise `--batch-size`
above the workspace file count, or keep workspace members batched together) or in scoping CI's `check`
gate with `--include` as every Tier-A already does. **Both are outside every slice ceiling —
coordinator decision.**

## Traps this lane paid for — do not relearn

1. **Evaluator allowlist is read per-worktree**, not from `main`. A leaf must integrate post-#1792
   `main` or GLM is denied at the proxy.
2. **D-1:** `run-gate.ts` `check`/`lint`/`fmt-check` can return `PASS`/exit 0 with **zero-byte
   stdout** and `(cached, inputs unchanged)`. Always check `stdout.bytes`; re-run the wrapper directly
   to bypass.
3. **`doc-lint` needs `--root`** — the catalog argv omits it, yielding a ~450 ms usage-error `FAIL`
   that looks like a real failure.
4. **Acceptance boxes match by exact text or `box-index`** — truncated `box:` values silently fail to
   map. Use `box-index`.
5. **`check:assets-barrel` is `gen && git diff --exit-code`** — it must fail while regenerated carriers
   are uncommitted. Never read its exit through a pipe (`| tail` masks it).
6. Never hand-merge generated carriers; take `main`'s and regenerate the cascade.

## Next commands

```bash
# 1) #1762 terminal: re-dispatch GLM at the final evidence head
cd /home/agent/projects/netscript/worktrees/ns1387-eval-final && git checkout --detach 686eedb62
deno task agentic:claude-openrouter --model z-ai/glm-5.3-flash --effort max \
  --prompt .../slices/impl-eval-1387-s9.md      # update its two head lines first

# 2) #1805: recheck, then report if exact-green
gh pr checks 1805 --repo rickylabs/netscript

# 3) Remaining evals, ONE at a time (serial correction stands)
#    #1810 -> #1814 -> #1820, each in its own detached worktree at its evidence head
```

`.llm/runs/release-0.0.7-features--orchestration/converge-1762.sh` holds the prepared, already-executed
convergence procedure — reusable verbatim if `main` advances again.

## Remaining unimplemented, clustered

- **#1349/#1352/#1353/#1467** — the #1348 sdk-client epic over one surface. #1349 is researched and
  planned (`007-leaf-1349`, head `4b520ea44`) with **two contradictions in its own issue body** found
  and resolved; its PLAN-EVAL needs re-dispatch. It strictly precedes the other three.
- **#1592 S2 + #1451** — both workers-runtime plumbing; cluster behind one plan.
- **#1452 S2** — blocked on the `@netscript/plugin` → `@netscript/kv` dependency decision.
- **#1590** — needs browser verification this lane cannot perform.
