# Tier-A — #1387 Slice 2 (typed context surface)

**Content head:** `f9b32b4f7a029d9226584b9c170eb44357e10fdb`
**Base:** `5ae8270ce` (the D-4 ceiling amendment)
**Verdict:** see § Verdict. Receipts live in `receipts/`; Slice 1's set is frozen under
`receipts/slice-1-2ddd6048/`, verified byte-identical by sha256 before any recut.

## Provenance — read this before trusting the authorship line

The Slice 2 Codex thread (`complex_implementation` route) authored the whole diff, then **terminated
without `task_complete`** while polling a reviewer it had dispatched **outside its brief**. Its last
five messages are all "the reviewer is still working"; the rollout stops mid-wait. The work was
complete and uncommitted in the worktree. The supervisor committed it unchanged to preserve it, and
performed Tier-A — which is the supervisor's role in any case. **No supervisor authorship of
framework code**: `git diff 5ae8270ce..f9b32b4f7` is the author's bytes, minus one correction to a
run-artifact routing label (`light_implementation` → `complex_implementation`, which did not match
the route actually dispatched).

## Ceiling

Ten files touched, exactly the amended ceiling: nine originals plus
`packages/service/src/builder/service-builder-impl.ts` (added by owner ruling, D-4). Plus two
permitted carriers — `supervisor.md` (run artifact) and the regenerated
`export-surface-corpus.generated.ts` (ceiling exemption). **No breach.**

## Substance

`ServiceBuilder` and `ServiceBuilderImpl` are parameterized on `TCustom extends object =
Record<never, never>`; every fluent method returns `ServiceBuilder<TRouter, TCustom>`, so the
generic survives the chain; `withContext<TNext>()` returns `ServiceBuilder<TRouter, TNext>` and
widens. `ServiceHandlerContext<TCustom>` is added and exported from `@netscript/service`, and
re-exported with `Principal` from `@netscript/plugin` — the LD-3 shape, confirmed by `arch:check`
rather than by inspection. `createPluginService` threads `TCustom` through `PluginServiceConfig`.

**Runtime composition is genuinely deferred.** `buildRpcContext`'s body is unchanged; only its local
and return types moved (`Record<string, unknown>` → `object` / the typed intersection). Same for
`wireRpc`/`registerRpcPath`. Nothing in this slice changes behaviour, which is what Slice 3 is for.

## Gate results at the content head

Every receipt below satisfies `gitHead == actualGitHead` at `f9b32b4f7…`.

| Gate | Receipt | Outcome | Duration |
| --- | --- | --- | --- |
| `check` (service+plugin) | `check.json` | PASS | 532 ms |
| `lint` (service+plugin) | `lint.json` | PASS | 647 ms |
| `fmt:check` (service+plugin) | `fmt-check.json` | PASS | 456 ms |
| `test` (service+plugin) | `test-service-plugin.json` | PASS, **159 passed / 0 failed** | 4 568 ms |
| `arch:check` | `arch-check.json` | PASS, **FAIL=0** repo-wide | 5 444 ms |
| `doc:lint --root packages/service` | `doc-lint-service.json` | PASS, 0 errors / 0 privateTypeRef / 0 missingJSDoc | 439 ms |
| `docs:exports-drift` | not catalog-backed; run directly | **PASS** | — |
| `check:mcp-export-corpus` | not catalog-backed; run directly | **PASS**, sha256 `510632b1…`, 7 628 symbols | — |
| `publish:dry-run` (JSR publish surface) | `publish-dry-run.json` | PASS | 28 210 ms |

**On the 532 ms `check`.** A short duration is not by itself proof of a replay: `deno task check`
caches. This receipt's own stdout shows the work — `filesSelected: 198, batches: 2, failedBatches: 0`
— and the identical selection had already been run cold through `run-deno-check.ts` at this content
before the commit, 0 diagnostics across 198 files. `publish:dry-run`, which does **not** cache, is
cut separately.

**Two gates have no catalog entry**, so `run-gate.ts` cannot receipt them: `docs:exports-drift` and
`check:mcp-export-corpus`. They were run directly and their output is recorded above. This is a
tooling gap worth closing — the plan contracts `mcp-export-corpus` at every slice (row 13), and a
contracted gate that cannot produce a durable receipt is exactly the shape of D-3.

## Findings

- **F-1 (observation, not blocking).** `service-builder-impl.ts` trips the doctrine file-size WARN at
  542 lines. This is **pre-existing**: it was already 530 lines at the base and on `main`, over the
  500 cap. The slice widened an existing breach by 12 lines. Splitting the file is far outside a
  signature-only ceiling; it belongs in a follow-up.
- **F-2 (observation).** The `service` docs page is `entrypoints-only` coverage mode, so
  `docs:exports-drift` passing does **not** mean `ServiceHandlerContext` is documented in the
  reference prose — only that entrypoint coverage holds. If the plan intends prose coverage for the
  new public types, that is a separate obligation the drift gate will not enforce.

## Verdict

**ACCEPTED_WITH_FINDINGS.** Contracted gate set is green at `f9b32b4f7…`; ceiling respected; the
slice is signature/generic-only as ruled. F-1 and F-2 are observations that do not block Slice 3.
