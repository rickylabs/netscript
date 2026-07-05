# Research

## Re-baseline

- Branch `chore/307-stale-wave2-wave4` started at `1c175990`, matching `origin/main`.
- Existing run directory `.llm/runs/beta5-impl--supervisor/` was absent in this checkout, so this
  slice bootstraps the supervisor run artifacts needed for traceability.
- Wave 4 recount: `git ls-files .llm/tmp | wc -l` returned `0`. There is no tracked `.llm/tmp/`
  purge left to perform in this worktree.
- `.gitignore` already excludes `.llm/tmp/`; `.llm/tmp/docs` has `0` tracked files.

## Findings

| ID | Finding                                                                                                                                               | Evidence                                                                                                                                                                                                                    |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 | `packages/cli/src/kernel/extension-points.ts` is not stale.                                                                                           | Doctrine and Archetype 6 require the kernel extension-point manifest; file exports all CLI registries. It is not in `packages/cli/deno.json` exports, but it is the explicit F-CLI-31 manifest.                             |
| R2 | `packages/cli/src/kernel/adapters/deploy/compile/compile.test.ts` is stale beside the active `compile_test.ts`.                                       | No repo import/reference except itself; `packages/cli` excludes `**/*.test.ts` from publish; Deno test discovery does not need `*.test.ts`; `compile_test.ts` covers the current appsettings/background processor behavior. |
| R3 | SDK candidates are active public API.                                                                                                                 | `packages/sdk/deno.json` exports `./collections`, `./discovery`, `./query`, and `./query-client`; root `mod.ts` re-exports `src/openapi/helpers.ts`; tests/docs reference the query collection and KV persister.            |
| R4 | Workers bin files are active runtime entrypoints.                                                                                                     | `plugins/workers/src/public/mod.ts`, `src/aspire/workers-contribution.ts`, tests, docs, and CLI templates reference `bin/combined.ts`, `bin/worker.ts`, and `bin/scheduler.ts`.                                             |
| R5 | Plugin service health routers are scaffold/runtime active.                                                                                            | CLI service templates import `./routers/health.ts`; plugin service tests/e2e probes reference health paths.                                                                                                                 |
| R6 | `DataGrid` is a shipped Fresh UI export, not stale.                                                                                                   | `packages/fresh-ui/mod.ts` exports `DataGrid` and types; tests import from root; CSS uses `ns-data-grid*` classes emitted by the component.                                                                                 |
| R7 | `packages/plugin/src/public/mod.ts`, `packages/plugin-workers-core/src/public/mod.ts`, and `packages/telemetry/src/public/mod.ts` are orphan barrels. | They are not in their packages' `deno.json` export maps or check tasks and have no repo importers. `plugin-workers-core` root uses `src/public/root.ts`, not `src/public/mod.ts`.                                           |
| R8 | `packages/plugin-streams-core/src/domain/errors.ts` is orphaned.                                                                                      | No importers or exports; streams-core code uses durable-stream client errors and public stream diagnostics instead.                                                                                                         |

## Open Questions

- None blocking this slice. Wave 4 is a no-op on this checkout because the tracked scratch purge
  already happened upstream or in a prior run.
