use harness

# #1387 Slice 2 (continuation) — finish under the amended ceiling

You are a **fresh Codex thread**. A prior thread drafted Slice 2, hit the plan's rescope rule, and
**stopped correctly** without committing. **Its uncommitted draft is already in your worktree** —
build on it; do not start over and do not revert it.

| Field | Value |
| --- | --- |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1387` |
| Branch | `feat/service-principal-procedure-policy`, PR **#1762**, OPEN **draft** |
| Start head | verify yourself; expect `5ae8270ce` (the ceiling amendment) |
| Working tree | **dirty by design** — the Slice 2 draft in the nine originally-authorized files |
| Run dir | `.llm/runs/feat-service-principal-procedure-policy--1387/` |

## SKILL

`netscript-harness`, `netscript-doctrine` (`packages/service`, `packages/plugin`), `netscript-tools`,
`netscript-pr`, `rtk`. Read `plan.md` § Slice 2 and `drift.md` **D-4** first.

## What changed: the ceiling now has one more file

The owner ruled on D-4 and **added `packages/service/src/builder/service-builder-impl.ts`** to Slice
2's ceiling — the same already-ratified shape as PLAN-EVAL's F-3, which added `service-rpc.ts` for the
same reason. **No design change, no PLAN-EVAL cycle 3.**

**Ten files now. Signature/generic-only in implementation files.**

Why it was needed, measured by the supervisor: with the draft applied, `service-builder-impl.ts` is
the **only** failing file across `packages/service` + `packages/plugin` — **3 × `TS2339`** (`db`,
`traceHeaders`, `principal` do not exist on `Record<never, never>`). The published
`ServiceBuilder<TRouter, TCustom>` cannot be satisfied while its implementation carries the erased
signature.

*(The prior thread reported `TS2416` plus 21 × `TS2322`; those codes were **not** reproduced. Trust
your own measurement, not either report.)*

## Your task

1. **Parameterize** `ServiceBuilderImpl` and its stored factory.
2. **Preserve the generic through fluent returns** so `TCustom` survives the chain.
3. **Specialize `withContext`** so `withContext<TNext>()` returns the widened builder.
4. **Keep runtime composition in Slice 3.** This slice changes *types*. No behaviour, no enforcement,
   no context composition — if you find yourself writing runtime logic, stop: that is Slice 3.

A file outside the **ten** is still a rescope: stop, append `drift.md`, report. The seven plugin
configurations in `research.md` remain **compile-only, no-edit consumers** — they must type-check and
you must not edit them. **LD-3 holds**: `@netscript/service` owns `Principal` /
`ServiceHandlerContext`; `@netscript/plugin` re-exports. Verify with `arch:check`, not by inspection.

## Slice 2 Tier-A stop — run all of it

Scoped `check` / `lint` / `fmt`; service and plugin tests; service `deno doc --lint`; service JSR
audit; **`docs:exports-drift`**; **`mcp-export-corpus`**.

`mcp-export-corpus` is contracted at **every** slice now (row 13, amended after cycle 2 F-2′) because
the corpus records each public symbol's **signature and JSDoc**, not just the symbol list — so a
widened exported type stales it even with no new symbol. If this slice stales it, regenerate with
`gen:mcp-export-corpus` and commit that output **with this slice**; the ceiling exemption authorises
exactly that. **Do not hand-edit the corpus.**

The base-red plugin JSR/doc gates are **not** contracted — do not chase them green; cite the base
number as a delta if you cite them at all.

## Evidence

Cut receipts through `.llm/tools/gates/run-gate.ts` at your **content** head, each
`gitHead == actualGitHead`, named explicitly, never a glob. **Archive the Slice 1 set before recutting
— append-only, never overwrite.** Recompute sufficiency over the named set only. Prove `deno.lock`
byte-unchanged.

**Verify receipts by `argv` and `durationMs`, not `exitCode`** — an expected-red gate records a usage
error as `exit 1` and looks correct. The converse also holds: a short duration is not proof of a
replay, because `deno task check` caches (89 ms warm vs ~118 s cold) while `publish:dry-run` does not.
Ask whether the gate *can* cache and whether the receipt's own output shows the work.

**A caution this lane paid for twice:** do **not** conclude "no carrier moved" from `git status`. That
is non-probative if the gate never ran — it is how Slice 1's corpus staleness went unnoticed (D-3).
Run the gate.

## Process

Commit, push by **explicit refspec**, post the structured per-slice PR comment per `netscript-pr`, and
keep `context-pack.md` current at your final head — **state results as history and requirements as
rules**; a carrier cannot name its own head.

PR body keeps **`Refs #1387` — partial**; live `closingIssuesReferences` must stay **empty**. The body
reads "incorrectly mark #1387 complete" because GitHub once parsed a softer phrase as a closing
keyword — **preserve that wording**.

## Hard boundaries

No rebase, revert or force-push. No merge, ready-flip, relabel, milestone change, issue close or
acceptance-box ticking. **No `e2e:cli`, Aspire, Docker or browser gates — no runtime lease is held and
none may be acquired**; the sole host lease is currently held by another lane, and a reachable DinD
sandbox is not authorization. Do not touch `deno.lock` or run `deno cache --reload`. Do not write
thread ids or daemon handles into committed artifacts.

Stop at Slice 2's Tier-A stop. **Do not start Slice 3.** Report your content and evidence heads.
