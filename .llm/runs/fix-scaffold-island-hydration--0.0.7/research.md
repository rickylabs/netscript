# Research — fix-scaffold-island-hydration--0.0.7

## Re-baseline

- Carried-in source: issue #1845 leaf brief and hosted `scaffold.runtime` run `33410348563` on PR
  #1664 head `377811da8`.
- Re-derived against `main` / branch base `6c195acaf3f7e650c4235fc3fbc51232e210e7a4` on 2026-08-31.
- Scope of this phase: registration/build measurement and planning artifacts only. No scaffold,
  browser, Aspire, Docker, or E2E command was run.
- Carried-in facts intentionally not re-derived: the four eliminated cache/probe/helper hypotheses
  in the leaf brief.

## Conclusion

The route-local registration lead is **killed**.

Fresh 2.3.3 discovers files below any `routes/**/(_islands)/` directory as islands. The locked Fresh
Vite plugin 1.1.2 consumes that discovery result in both client and server snapshots and adds one
production Rollup entry per island. A read-only invocation of that exact plugin against a retained
generated NetScript service app emitted:

```json
{
  "fresh-island::ServiceShowcaseLab": "fresh-client-island::ServiceShowcaseLab"
}
```

and its generated client snapshot contained an import of the generated file at
`routes/examples/users/(_islands)/ServiceShowcaseLab.tsx`.

Therefore the missing DOM island marker is not explained by route-local `(_islands)` being absent
from Fresh discovery or build inputs. This S1 does not replace that disproved lead with a new
confident diagnosis.

## S2 reproduction measurement — 2026-09-01

Supervisor direction authorized the package reproduction before PLAN-EVAL. The new
`route-binding-browser` case mirrors the generated composition:

```text
routes/examples/(_islands)/ServiceShowcaseLab.tsx
  -> server lab-panel layer
  -> definePage callable `lab` slot
  -> layout component reading `serviceShowcasePage.hooks.useSlots()`
```

The island also exercises the generated query-provider sequence: `QueryIsland`,
`getIslandQueryClient()`, `hydrateFromDehydrated()`, `useQueryClient()`, and `useQuery()` with
server initial data and its timestamp. A direct-render route supplies a registration/render control
for the same island module.

A package-local Vite invocation and raw fetch produced:

```json
{"path":"/examples/service-direct","status":200,"freshIslandMarker":true,
 "clientBootImport":true,"layoutReached":false,"layerReached":false,
 "initialRowReached":true,"hydratedCacheOnServer":true,"length":1264}
{"path":"/examples/service","status":200,"freshIslandMarker":true,
 "clientBootImport":true,"layoutReached":true,"layerReached":true,
 "initialRowReached":true,"hydratedCacheOnServer":true,"length":1338}
```

The marker in Fresh 2.3.3 development HTML is a comment boundary,
`<!--frsh:island:ServiceShowcaseLab:...-->`, not a `<fresh-island>` element. Both responses also
contain the inline boot mapping that imports `fresh-island::ServiceShowcaseLab`.

Observed disposition of the three requested branches:

1. **Served marker loss / `define-page` materialization: ruled out in the package reproduction.**
   The generated-style route serves the same Fresh boundary as the direct control.
2. **Client bundle/hydration/provider failure: not yet measured.** The local test host has neither
   `playwright-cli` nor the system libraries required by its cached Chromium. The attempted focused
   browser test stopped before navigation with `NotFound: Failed to spawn 'playwright-cli'`; direct
   Chromium stopped at loader startup with missing `libnspr4.so`. Neither result says anything about
   application hydration.
3. **Layer/slot reachability or identity loss: ruled out in the package reproduction.** The served
   route contains the layout, lab layer, initial row, island boundary, and client boot import.

This leaves the client/provider branch live but **does not diagnose it**. Product source remains
unauthorized until the same focused test runs with the managed browser runtime and reports module
load, island render attempts, hydration state, query-client reachability, click behavior, and page
errors.

Exact focused command for a managed browser host:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all --filter "definePage hook layout preserves" packages/fresh/tests/form-navigation_browser.ts
```

The hosted receipt is deliberately staged from `about:blank`, so no island code runs before its
listeners and init script are installed. One assertion includes the complete raw receipt on failure
and discriminates:

- Fresh client-entry and `ServiceShowcaseLab` request, response status, and request failure;
- island module evaluation and outer island render attempt;
- provider-child entry, singleton-client construction, and dehydrated-cache completion;
- `useQueryClient()` attempt/result, equality with the singleton, and cache data at that point;
- canonical `useQuery()` attempt/result (which delegates through `useIslandQuery()`);
- hydration effect, interactive cache update, and browser console/page errors.

These fields let a hosted red distinguish an absent bundle, a failure before the provider child, a
missing provider at `useQueryClient()`, and a failure inside the query hook without inferring from
unchanged SSR attributes.

## Measurement chain

### 1. The scaffold emits a route-local island

At the base commit, `write-app-files.ts` derives `serviceExampleIslandsDir` as
`routes/examples/<serviceName>/(_islands)`. `write-example-service-app-files.ts` writes
`ServiceShowcaseLab.tsx` into that directory. The adjacent lab panel imports the island from
`../(_islands)/ServiceShowcaseLab.tsx` and renders it as a component.

Verification:

```text
packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:107-116
packages/cli/src/kernel/application/scaffold/writers/write-example-service-app-files.ts:112-116
packages/cli/src/kernel/templates/app/route-templates_test.ts:498-505
```

This establishes the generated filesystem path and import reachability in scaffold source. It does
not by itself prove Fresh registration.

### 2. Fresh core classifies the route-local path as an island

`deno.lock` at the base pins `@fresh/plugin-vite` 1.1.2; that plugin resolves `@fresh/core` 2.3.3.
In the exact locked core implementation, `crawlRouteDir()` matches route path segments with
`GROUP_REG`. When the matched helper group is `_islands`, it calls `onIslandSpecifier(entry.path)`
and then excludes the file from route collection. `crawlFsItem()` combines those route-local island
paths with top-level `islands/` paths.

Primary source inspected from the locked Deno graph:

- `https://jsr.io/@fresh/core/2.3.3/src/dev/fs_crawl.ts`
  - `GROUP_REG` and the `_islands` branch in `crawlRouteDir()`
  - `crawlFsItem()` combining top-level and route-local islands

This is registration/build code, not documentation or framework intent.

### 3. Fresh's client and server builds consume the same discovery result

The exact locked plugin implementation does the following:

- `client_snapshot.ts` calls `crawlFsItem()`, adds every returned island to the island set, and in
  production adds `fresh-island::<name> -> fresh-client-island::<name>` to Rollup input.
- `server_snapshot.ts` independently calls `crawlFsItem()`, adds every returned island to its server
  island map, and in production associates `fresh-island__*` Vite manifest chunks with the server
  module path.

Primary sources inspected from the locked Deno graph:

- `https://jsr.io/@fresh/plugin-vite/1.1.2/src/plugins/client_snapshot.ts`
- `https://jsr.io/@fresh/plugin-vite/1.1.2/src/plugins/server_snapshot.ts`
- `https://jsr.io/@fresh/plugin-vite/1.1.2/src/mod.ts`

The generated app's `vite.config.ts` uses this plugin and does not override `routeDir` or
`islandsDir`; its only explicit package island is `@netscript/fresh/defer/island`. Route-local
application islands are nevertheless supplied by the core crawl.

### 4. Generated-project measurement

No scaffold or build was allowed in S1. The read-only generated-project measurement used a retained
service scaffold at:

```text
/home/agent/projects/netscript/worktrees/007-leaf-1462/.llm/tmp/cli-e2e/
plugin-smoke-20260831-011632/apps/plugin-smoke-20260831-011632-web
```

Its source worktree was at `94620577db9532cb281160c0734cfe8fe33e1115`. The generated app contains
the expected route-local island and the same Fresh Vite configuration as the base scaffold assets. A
read-only call to the locked `fresh:client-snapshot` config/load hooks over that app returned:

```text
fresh-island::ServiceShowcaseLab -> fresh-client-island::ServiceShowcaseLab
export const mod_5 = await import(".../routes/examples/users/(_islands)/ServiceShowcaseLab.tsx");
```

This is the generated project's own Fresh client build-input/snapshot output. No `_fresh` build
directory was written. The retained app's `.generated/manifest.ts` omits `(_islands)` because that
file is NetScript's typed **route** manifest; it is not Fresh's island manifest. Conflating the two
would produce the wrong ownership conclusion.

Reproduction command (read-only; set `root` to the retained app path above):

```ts
import { fresh } from 'jsr:@fresh/plugin-vite@1.1.2';

const root = '<retained-generated-app>';
const plugin = fresh({ islandSpecifiers: ['@netscript/fresh/defer/island'] })
  .find((candidate) => candidate.name === 'fresh:client-snapshot');
if (!plugin || typeof plugin.config !== 'function') throw new Error('missing config hook');

const result = await plugin.config.call(
  {},
  { root },
  { command: 'build', mode: 'production' },
);
console.log(JSON.stringify(result?.environments?.client?.build?.rollupOptions?.input, null, 2));

const load = plugin.load;
if (!load || typeof load !== 'object' || typeof load.handler !== 'function') {
  throw new Error('missing load hook');
}
console.log(await load.handler.call({}, '\0fresh:client-snapshot'));
```

### 5. Ownership result

There is neither a Fresh initial-crawl gap nor a scaffold registration gap for this path shape. The
scaffold emits the recognized directory, and Fresh registers it in both build environments.
Consequently, no registration fix belongs in `packages/cli`.

The evidence now points to the later boundary: whether the already-registered `ServiceShowcaseLab`
component is reached and retains its island identity during the `definePage()` layer/layout
server-render path. Only after that is proven should query-provider hydration be inspected. This
narrows the next investigation to `packages/fresh`, but it does not yet select a faulty function.

The package query code contains a separate SSR-safety concern: `getIslandQueryClient()` creates a
module singleton even though its documentation says island internals do not SSR. Fresh islands do
server-render. That concern is not evidence for the missing island element and is not diagnosed as
the cause in this S1.

## Findings

| # | Finding                                                                                                                    | How to verify                                                                              |
| - | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 | Base scaffold writes the showcase to `routes/examples/<service>/(_islands)` and imports it from the lab layer.             | Writer and template-test locations above.                                                  |
| 2 | Fresh core 2.3.3 explicitly sends route-local `(_islands)` files to the island callback.                                   | Locked `fs_crawl.ts`.                                                                      |
| 3 | Fresh Vite 1.1.2 adds every discovered island to production client Rollup inputs and the server snapshot.                  | Locked client/server snapshot sources.                                                     |
| 4 | An actual generated service app produces a `fresh-island::ServiceShowcaseLab` entry and client snapshot import.            | Read-only plugin-hook measurement above.                                                   |
| 5 | NetScript's generated typed route manifest excludes helper directories, but that manifest does not register Fresh islands. | `packages/fresh/src/application/route/manifest.ts` and generated `.generated/manifest.ts`. |
| 6 | The hosted failure still occurs before mutation and has no Fresh island DOM element.                                       | Carried-in run `33410348563`: 71 passed / 1 failed.                                        |

## Evidence direction after the killed lead

The next measurement must distinguish these cases without presupposing one:

1. The registered showcase component is absent from the server-rendered layer/layout tree.
2. It is present as a component but Fresh does not recognize the rendered function identity as the
   registered island module.
3. A Fresh island marker is emitted server-side but lost before the browser probe observes it.

The package-level browser fixture should exercise the same route-local island through the
`definePage()` layer/layout path and assert both server marker emission and client hydration. A
registration-only unit assertion is necessary but not sufficient.

## JSR audit surface scan

- Planned public surface: unchanged. No export, subpath, dependency, or signature change is
  authorized by the S1 plan.
- Slow-type/surface risk: a minimal internal render/hydration correction must not add exports. If
  implementation later requires a public API change, the plan must be re-evaluated before editing.
- Base full-export `deno doc --lint` result: exit 1 with exactly 45 diagnostics. This is a
  pre-existing red and becomes an exact non-increase contract (`<= 45`, with no new diagnostic in a
  touched file), not a promised green.

## Open questions

- Which `packages/fresh` render boundary first drops or fails to recognize the registered island?
  **Must resolve before product implementation.**
- Can the existing `route-binding-browser` fixture reproduce the missing marker and hydration
  without any CLI scaffold asset? **Must resolve before product implementation.**
- Does the hosted server response already lack the marker, or is it removed between response and
  probe? **Safe to defer to the supervisor-dispatched hosted proof after a package-level fix.**

## Generated-app HTML discriminator — 2026-09-01

The S2 continuation generated a local-source, no-Aspire SQLite workspace from branch head
`f48d0b86c`, initialized and seeded its SQLite database, and started only the generated `users`
service and Fresh Vite process. A fetch of the real generated route
`http://127.0.0.1:52501/examples/users` returned:

```json
{
  "status": 200,
  "length": 135504,
  "frshIsland": true,
  "typedQueryLab": true,
  "initialRows": ["Seed User"],
  "markers": [
    "<!--frsh:island:ThemeToggle:0:-->",
    "<!--frsh:island:ServiceShowcaseLab:1:-->",
    "<!--frsh:island:DeferComponent:2:-->"
  ],
  "clientBootMapping": true
}
```

This selects the brief's first branch by direct observation: `ServiceShowcaseLab` is registered,
reached through the loader/layer/layout tree, recognized with the registered module identity,
SSR-rendered with its initial row, and included in the served client boot mapping. The real
generated failure is therefore after served HTML on the client path. This measurement does not yet
distinguish a missing/failed client entry request from an exception during provider/query hydration;
the already-landed managed-browser instrumentation is the next discriminator.
