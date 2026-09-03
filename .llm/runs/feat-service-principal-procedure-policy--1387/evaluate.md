# IMPL-EVAL — #1387 Slice 2 (typed service context surface)

**Evaluator:** Anthropic Claude / Fable 5, separate session, opposite family to the Codex author.
**Certified head:** content `f9b32b4f7a029d9226584b9c170eb44357e10fdb` (evidence head
`be22d4b6a91623b35273db4ce9a0ab28c5b748b6` verified product-neutral).
**Verdict:** **ACCEPTED_WITH_FINDINGS** at `f9b32b4f7a029d9226584b9c170eb44357e10fdb`.

## What was verified (independently re-run at the evidence head, product-identical to content)

| Claim | Method | Result |
| --- | --- | --- |
| Evidence head is product-neutral | `git diff --stat f9b32b4f7..be22d4b6a -- packages plugins docs templates` | empty — PASS |
| Ceiling (10 authorized files + 2 permitted carriers) | `git diff --stat 5ae8270ce..f9b32b4f7` | exactly 12 paths: the ten ceiling files, `supervisor.md`, `export-surface-corpus.generated.ts` — no breach |
| Signature/generic-only | full diff read | `buildRpcContext` body unchanged (only local annotation + return type `Record<string,unknown>`→`object`); `wireRpc`/`registerRpcPath` changed only the `buildContext` parameter type; no behaviour added anywhere |
| Ruled scope met | diff + type tests | class and stored factory parameterized on `TCustom extends object = Record<never, never>`; every fluent return is `ServiceBuilder<TRouter, TCustom>`; `withContext<TNext>()` returns `ServiceBuilder<TRouter, TNext>`; `createPluginService<TRouter, TCustom>` threads `PluginServiceConfig<TCustom>` |
| Scoped check | `run-deno-check.ts --root packages/service --root packages/plugin` (cold, this worktree) | 198 files, 0 diagnostics — PASS |
| Tests | `deno task test packages/service/tests packages/plugin/tests` | 159 passed / 0 failed — PASS |
| LD-3 by gate | `deno task arch:check` exit 0; plus the new identity-assignability tests (Principal/ServiceHandlerContext through `@netscript/plugin` root and `src/service/mod.ts`) compile and pass | PASS — service owns, plugin re-exports (`export type { Principal, ServiceHandlerContext } from '@netscript/service'`) |
| `docs:exports-drift` (non-receipted) | run directly | PASS |
| `check:mcp-export-corpus` (non-receipted) | run directly | PASS, sha256 `510632b1…`, 7 628 symbols — byte-matches Tier-A's claim, which also proves the committed corpus equals fresh generator output (no hand edits) |
| `quality:scan` | run directly (not contracted for Slice 2, run anyway per harness rule for `packages/**` slices) | ok:true, zero new findings, allowCount 7 unchanged — the slice's two new `as` casts do not trip the scanner |
| Receipts | each JSON inspected by `argv` + `durationMs` + `gitHead==actualGitHead`, not exitCode | all 7 Slice 2 receipts at `f9b32b4f7`, argv match their gates, durations plausible; the 532 ms `check` receipt's own stdout shows `filesSelected:198, failedBatches:0` and I reproduced the identical selection cold |
| Slice 1 receipts | `receipts/slice-1-2ddd6048/` | intact, all at `2ddd6048`, exit 0; Slice 2 `evidence-set.json` computes SUFFICIENT over the Slice 2 named set only (`1387-s2-*`, immutableHead `f9b32b4f7`) |
| `deno.lock` | name-only diff | untouched |
| F-1 line count | `wc -l` at head vs base | 530 → 542, confirming pre-existing WARN widened by 12 |

## Ruling on the supervisor's findings

- **F-1 (500-line WARN, 530→542):** correctly classified non-blocking. The breach pre-exists on
  `main`; splitting the file inside a signature-only ceiling would itself be a scope breach.
- **F-2 (entrypoints-only service docs page):** confirmed by my own `docs:exports-drift` run output
  (`Coverage [service]: mode=entrypoints-only`). Correctly non-blocking; prose coverage for
  `ServiceHandlerContext`/`Principal` is a real, separate obligation the drift gate will never
  enforce — it should be scheduled, not forgotten.
- **Tooling gap (no gate-catalog entry for `docs:exports-drift` / `check:mcp-export-corpus`):**
  confirmed — no receipt exists for either. Correctly non-blocking *for this slice* because both were
  independently reproduced green here, but the plan contracts `mcp-export-corpus` at every slice, so
  the catalog entry should land before Slice 3's Tier-A, or every remaining slice repeats this
  non-durable-evidence shape (the D-3 lesson).

## Evaluator findings (all non-blocking)

- **E-1 (process).** `quality:gate` was not cut at the Slice 2 head; the top-level
  `receipts/quality-gate.json` is a Slice 1 leftover at `2ddd6048`. The harness skill requires
  `quality:scan` in the Tier-A review of any `packages/**` slice even when the plan's stop set omits
  it. Substantively mooted — I ran it at head and it is green with no new allowances — but the
  Tier-A record should not have relied on a stale receipt sitting beside the Slice 2 set.
- **E-2 (observation, type design).** `TCustom` is a *phantom* parameter on the `ServiceBuilder`
  interface: it appears only in the recursive fluent return types, so
  `ServiceBuilder<TRouter, X>` and `ServiceBuilder<TRouter, Y>` are mutually assignable and the
  type-level tests pass by inference rather than enforcement (this is also what lets
  `withContext`'s `return this` and `createService(...)`'s default-builder assignment compile).
  Acceptable for a contract-only slice — inference through `ContextFactory<TCustom>` is real — but
  Slice 3 should give `TCustom` a non-phantom consumer position (e.g. handler context exposure) or
  the widening guarantee stays advisory. Related: `withContext` stores
  `factory as ContextFactory<TCustom & TNext>` and the default factory is `() => ({}) as TCustom`
  — two deliberate, scanner-clean type assertions whose soundness Slice 3's composition must make
  true.
- **E-3 (observation).** `buildRpcContext`'s internal annotation types `traceHeaders` as
  `Readonly<Record<string, string | undefined>>` while the published `ServiceHandlerContext` says
  `Readonly<Record<string, string>>`. Reconcile in Slice 3 when composition becomes real.
- **E-4 (stated gap, not a finding against content).** The provenance claim — supervisor committed
  the author's bytes unchanged except one run-artifact routing label — is **not independently
  verifiable**: the author's uncommitted worktree no longer exists as a reference. What is
  verifiable, and was: every product edit is inside the ceiling, signature/generic-only, and green
  under the full gate set plus `quality:scan`. The `supervisor.md` delta (a lane-table row plus
  route-selection prose) is a run-artifact edit consistent with the claim's stated scope.

## Not run

`e2e:cli`, Aspire, Docker, browser gates — prohibited for this lane; no runtime lease held.
