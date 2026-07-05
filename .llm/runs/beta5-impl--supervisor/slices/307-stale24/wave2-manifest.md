# Wave 2 Stale-Code Manifest

Issue #307, Waves 2 and 4 only. Baseline `1c175990`.

## Summary

| Candidate                                                         | Verdict | Evidence                                                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/cli/src/kernel/extension-points.ts`                     | KEEP    | Archetype 6 doctrine requires `kernel/extension-points.ts` as the registry extension manifest (F-CLI-31). File exports CLI registry axes; not a published subpath, but intentionally internal doctrine surface. |
| `packages/cli/src/kernel/adapters/deploy/compile/compile.test.ts` | DELETE  | No importers/references outside itself; not in `deno.json` exports or check task; publish excludes `**/*.test.ts`; active sibling `compile_test.ts` covers current behavior.                                    |
| `packages/sdk/src/collections/*`                                  | KEEP    | `packages/sdk/deno.json` exports `./collections`; package check includes `src/collections/mod.ts`; tests/type fixtures import `create-query-collection.ts`; docs reference `@netscript/sdk/collections`.        |
| `packages/sdk/src/openapi/helpers.ts`                             | KEEP    | Root `packages/sdk/mod.ts` re-exports `./src/openapi/helpers.ts`, making it public API.                                                                                                                         |
| `packages/sdk/src/discovery/service-discovery.ts`                 | KEEP    | `packages/sdk/src/client/http-client-link.ts` imports it for `getServiceUrl`; discovery subpath remains public through `src/discovery/mod.ts`.                                                                  |
| `packages/sdk/src/query/composite-query.ts`                       | KEEP    | `packages/sdk/src/query/mod.ts` exports `createCompositeQuery`; docs list `createCompositeQuery` in SDK reference.                                                                                              |
| `packages/sdk/src/query-client/kv-cache-persister.ts`             | KEEP    | `packages/sdk/src/query-client/mod.ts` exports `createKvCachePersister`; tests import it directly; docs list it as SDK reference API.                                                                           |
| `plugins/workers/bin/combined.ts`                                 | KEEP    | Workers plugin manifest declares `./bin/combined.ts`; Aspire contribution code and tests reference `plugins/workers/bin/combined.ts`; docs and CLI templates reference it as a background processor.            |
| `plugins/workers/bin/scheduler.ts`                                | KEEP    | Workers Aspire contribution code and tests reference `plugins/workers/bin/scheduler.ts`; plugin manifest declares `./bin/scheduler.ts`.                                                                         |
| `plugins/workers/bin/worker.ts`                                   | KEEP    | Workers Aspire contribution code and tests reference `plugins/workers/bin/worker.ts`; plugin manifest declares `./bin/worker.ts`.                                                                               |
| `plugins/workers/services/src/routers/health.ts`                  | KEEP    | Service health route is part of plugin service/e2e health flow; CLI service scaffolder writes `routers/health.ts`; templates import `./routers/health.ts`.                                                      |
| `plugins/sagas/services/src/routers/health.ts`                    | KEEP    | Sagas service check/e2e flow includes service health probe; service router pattern imports `./routers/health.ts`; plugin service entrypoint is exported.                                                        |
| `packages/plugin-streams-core/src/domain/errors.ts`               | DELETE  | No importers or exports; not in export map or check task; stream code uses durable-stream client errors and public diagnostics instead.                                                                         |
| `packages/plugin/src/public/mod.ts`                               | DELETE  | No importers; not in `packages/plugin/deno.json` exports or check task; root `mod.ts` curates public API directly from role folders.                                                                            |
| `packages/plugin-workers-core/src/public/mod.ts`                  | DELETE  | No importers; not in export map or check task; root `mod.ts` imports from active `src/public/root.ts`, not this barrel.                                                                                         |
| `packages/telemetry/src/public/mod.ts`                            | DELETE  | No importers; not in `packages/telemetry/deno.json` exports or check task; prior roadmap evidence also marks it orphaned.                                                                                       |
| `packages/fresh-ui/src/presentation/data-grid.tsx` `DataGrid`     | KEEP    | Root `packages/fresh-ui/mod.ts` exports `DataGrid` and all public types; tests import from root; README/reference docs document it; `data-grid.css` class-couples to emitted `ns-data-grid*` classes.           |

## Wave 4

| Check                           | Verdict | Evidence                                                                                |
| ------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `git ls-files .llm/tmp          | wc -l`  | NOOP                                                                                    |
| `.llm/tmp/docs` reference guard | NOOP    | `git ls-files .llm/tmp/docs                                                             |
| `.gitignore` exclusion          | KEEP    | `.gitignore` excludes `.llm/tmp/`, preserving scratch usability without tracking files. |
