# RESUME CHECKPOINT — features orchestrator (rewritten 2026-08-31 ~04:10Z)

**Ownership retained across rotation.** This lane owns #1762/#1387, #1805/#1591, #1810/#1458,
#1814/#1592, #1820/#1452, plus the unstarted #1348 epic cluster.

## Exact state

| Thing | Value |
| --- | --- |
| `main` | `0274c0a707e36ded3b4470a3911315f963e642d4` (#1800) — moves fast, always re-fetch |
| Topic branch | `orchestrator/release-0.0.7-features`, worktree `/home/agent/projects/netscript/worktrees/007-features` |
| Route | Opus 5 · xhigh · supervise-only · never merge |
| Eval routes | IMPL `z-ai/glm-5.3-flash` · max; PLAN `qwen/qwen3.8-flash` · max. DeepSeek is LEGACY. |

## PR control plane

| PR | Issue | Head | State | Exact next gate |
| --- | --- | --- | --- | --- |
| **#1805** | #1591 | `e76e02271` | **EXACT-GREEN MERGE CANDIDATE** — non-draft, CLEAN, one `status:ready-merge`, `Fixes #1591` live, IMPL-EVAL **PASS**, all CI green, 0 review threads | **none — handed to coordinator** |
| **#1762** | #1387 | `686eedb62` | non-draft, `status:ready-merge`, `Fixes #1387` live, IMPL-EVAL **PASS** at `d7cf2419c`, `close-gate` **PASS** | **HELD** until P0 #1827 merges; then ONE integration of complete `main`, carry the PASS across, recut gates |
| #1810 | #1458 | `96f9cea99` | non-draft, integrated, gates recut, IMPL-EVAL dispatched | await verdict → tick DoD → `status:ready-merge` → rerun close-gate |
| #1814 | #1592 **partial** | `d2c290c0c` | non-draft, integrated, gates recut | IMPL-EVAL — next in the serial chain |
| #1820 | #1452 **partial** | `3130fb52b` | non-draft, integrated, gates recut | IMPL-EVAL — third in the serial chain |
| #1664 | #1355/#1360 | `a257807d8` | CONFLICTING, parked | **owner boundary — do not revive unilaterally** |

## Corrections to the previous checkpoint — both were wrong, both cost time

1. **#1762 `close-gate` is not failing.** It passes. The CI red was a race against the acceptance
   mirror mid-apply (gate read the `03:22:22Z` issue snapshot). Live re-evaluation at the exact head
   returns `close-gate PASS`.
2. **The `check-test` "batch-composition" diagnosis was wrong** (mine, twice). Root cause, since
   confirmed by the coordinator and independently reproduced here: `packages/cli/e2e/deno.json` sets
   `compilerOptions.lib = ["deno.ns","dom"]`, omitting `deno.unstable`, while both root `deno.json`
   and `packages/cli/deno.json` include it. Deno 2.9.5 honors the explicit omission, so **the
   `--unstable-kv` CLI flag has no effect** — reproduced with and without the flag, byte-identical
   `TS2551`. #1762's new `packages/plugin/mod.ts:48` type-only re-export pulls `@netscript/service`'s
   root into that stable-lib graph, reaching `health.ts:184`'s `Deno.openKv`. **Owned by P0 #1827
   (`fix/cli-e2e-unstable-parity`); no product change belongs in #1762.**

## Traps — do not relearn

1. **Draft PRs get no real CI.** `ci.yml` gates `check-test`/`quality`/`code-quality`/`close-gate` on
   `pull_request.draft == false`. A draft shows `build` + `classify` green and everything else
   `skipping` — it looks green and proves nothing. Promote non-draft, and apply `impl-eval:skip`
   first if an IMPL-EVAL is already running, or `ready_for_review` auto-dispatches a duplicate.
2. **Evaluator allowlist is read per-worktree.** Dispatch from a worktree carrying post-#1792
   `models.ts`, or the model is refused. The control worktree `007-features` is **stale** — dispatch
   from a leaf.
3. `dispatch-openhands --prompt-file` content **must begin with `use harness`**; the tool prepends
   the base/head metadata itself.
4. `gh pr edit` / `gh pr ready` fail on this token (org scopes). Use `gh api -X PATCH .../pulls/N`
   with a JSON body file, and GraphQL `markPullRequestReadyForReview` for draft→ready.
5. **D-1:** `run-gate.ts` can return `PASS`/exit 0 with **zero-byte stdout** `(cached, inputs
   unchanged)`. Always read `stdout.bytes`. Exception: `assets-barrel` is `gen && git diff
   --exit-code`, so zero bytes is legitimately clean — prove it by checking the worktree is clean.
6. `exports-drift` / `mcp-export-corpus` are **not** in the shared gate catalog — only #1762's leaf
   added them. Elsewhere run `deno task docs:exports-drift` / `check:mcp-export-corpus` directly.
7. Acceptance boxes map by exact text or `box-index` — use `box-index`.
8. Never hand-merge generated carriers; take `main`'s and regenerate.

## Audit finding — #1354/#1355 both have real residual scope after #1781

Measured on `main` `0274c0a70`, answering the parked question:

- **#1355 is NOT resolved.** The symbol-collision half was fixed (the template is now
  `routes/examples/service/(_lib)/service-query.ts.template` with `{{serviceName}}` placeholders), but
  the **dead invalidation is still live**: the template still calls
  `createQueryFactories({ service: {...} }).service`, and `createQueryFactories` uses the **object
  key** as the resource (`query-factory.ts:222`), so real keys are `['service', action, …]` while the
  generated `…ListInvalidation = bridgeInvalidation(routerName, 'list')` produces `[routerName,
  'list']`. They never match — the showcase's invalidation and optimistic `onSettled` are still
  silent no-ops in generated user code. Still no verb for a second service.
- **#1354 is essentially untouched.** Exactly one generated app asset references
  `withResource`/`withRouteContract` (the frozen `examples/service/index.tsx.template`), and
  `generate-group.ts` still registers only three commands. No resource-slice verb exists.

## Remaining unimplemented, clustered

- **#1349** PLAN-EVAL running (`qwen/qwen3.8-flash · max`, detached in `ns1349-planeval` at
  `4b520ea44`, log `/home/agent/observability/planeval-1349-b.log`). A first attempt died with
  SIGTERM/143; relaunch detached with `setsid nohup`. #1349 strictly precedes #1352/#1353/#1467.
- **#1592 S2 + #1451** — both workers-runtime plumbing; cluster behind one plan.
- **#1452 S2** — blocked on the `@netscript/plugin` → `@netscript/kv` dependency decision.
- **#1590** — needs browser verification this lane cannot perform.
