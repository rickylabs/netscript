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

## PR control plane — 2026-08-31 ~06:05Z

| PR | Issue | Head | State | Blocked on |
| --- | --- | --- | --- | --- |
| **#1814** | #1592 partial | `0dc5ef539` | exact-head CI **green**; 10 blobs identical; disjoint from #1823/#1803 (proven, clean synthetic merge) — **no rebase taken** | eval verdict → tick DoD |
| **#1762** | #1387 | `3ba369f51` | converged onto live main; `close-gate` + `quality` **green**; DoD added; ledger corrected 3→**6** integrations | **#1828** (`deno.unstable` lib parity) — nothing else |
| **#1664** | #1355/#1360 | `270c31d4d` | recovered from Aug-15 park; `scaffold-static` green; all 17 acceptance rows verified | `--client` selector slice (dispatched) |
| **#1834** | #1349 S1 | `903cd520e` | Tier-A ACCEPTED; core CI **green** | eval verdict → tick DoD |

**Shipped this session:** #1805/#1591, #1810/#1458, #1820/#1452 (partial; #1452 correctly left open).

## Live workers (all watched, none stalled)

- #1814 eval — run `33359533524`, agent step 17/32, ~55 min (long but genuinely running; do **not**
  kill without checking the agent job's step counter).
- #1834 eval — run `33361000853`, agent step 17/32.
- #1664 `--client` selector — Codex thread `01a05668-1a29-77c0-9a01-4dd740c59db9`.

## Watcher-filter trap (cost two false wakeups)

A comment filter of `^\*\*\[PHASE: IMPL-EVAL\]` or `OPENHANDS_VERDICT` matches **the dispatch
prompt** (it quotes the verdict tokens) **and this supervisor's own phase comments**. Poll the
**workflow run status** instead — that is unambiguous.

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
