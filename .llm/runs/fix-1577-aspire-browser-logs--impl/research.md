# Research — fix-1577-aspire-browser-logs--impl

## Re-baseline

- Carried-in source: issue #1577 slice brief.
- Re-derived against `main` @ `f542f31cbea383f28dd2ea8ebc7ac99697c147a2` on 2026-08-12.
- The stated contradiction is present: browser package pin and help contract exist, but generated
  app registration omits the method and one endpoint-bearing fixture asserts omission.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `Aspire.Hosting.Browsers` remains pinned at `13.4.6-preview.1.26319.6`. | `scaffold-aspire.ts`; `generate-aspire-config_test.ts` |
| 2 | Restoring a TypeScript AppHost against that exact package generates `ExecutableResource.withBrowserLogs(options?): ExecutableResourcePromise`. | `.llm/tmp/api-probe-1577/.aspire/modules/aspire.mts:22825` |
| 3 | The implementation returns an `ExecutableResourcePromise`, whose interface extends `PromiseLike<ExecutableResource>`; `await resource.withBrowserLogs()` therefore resolves. | generated module lines 22828, 24963-24967 |
| 4 | `fixtures.MINIMAL_APP` is an endpoint-bearing app and the stale test observes `.withHttpEndpoint({ port: 8000, env: 'PORT' })`. | `generators-background-app_test.ts` test setup and preceding endpoint assertion |
| 5 | `fixtures.UNPINNED_TASK_APP` is endpoint-less and already anchors negative endpoint behavior. | `generators-test-support.ts`; focused tests |

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json`, package entrypoints, and planned diff.
- Slow-type / surface risks: none; no exported TypeScript API or dependency changes are planned.
- Publish risk: generated scaffold behavior is published surface, so package tests, scoped static
  wrappers, and repository quality gate remain required.

## Open questions

- None. Exact method availability and awaitability were resolved before implementation.

