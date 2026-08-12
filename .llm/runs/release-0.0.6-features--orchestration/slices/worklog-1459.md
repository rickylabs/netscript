# Worklog — #1459 deferred refresh coordinator hydration

Implementation lane: Codex · GPT-5.6 Sol · high (`complex_implementation`).
Branch: `fix/1459-defer-island-hydration`.
Baseline: `origin/main@59e435c5d`.

## Design

- **Profile:** `@netscript/fresh` remains Archetype 4 with the frontend overlay. This slice adds a
  narrow package subpath and changes the browser behavior materialized by the existing page DSL.
- **Public surface:** add `@netscript/fresh/defer/island`, backed by
  `src/application/defer/island.ts`. The entry re-exports only `DeferComponent`, so Fresh 1.1.2 does
  not mistake the helper functions in `DeferIsland.tsx` for additional islands.
- **Scaffold contract:** generated app import maps resolve that same specifier in JSR and local
  source modes, and the Vite template passes it to `fresh({ islandSpecifiers: [...] })`.
- **Client navigation:** preserve the three already-enabled request/cache combinations and enable
  the missing fourth (`partial-miss`) by rendering `f-client-nav` unconditionally. The locked
  `decideDeferClientAction` policy remains unchanged.
- **Partial lifecycle:** move the existing coordinator vnode inside the named `<Partial>`. A
  miss-to-hit region swap therefore replaces the coordinator with current props and gives Fresh the
  registered component identity to hydrate again. The stable-key fallback is unnecessary.
- **Bundle fixture:** `packages/fresh/tests/fixtures/defer-island-client/`, driven by
  `packages/fresh/tests/defer-island-client-bundle_test.ts`, builds with the pinned
  `@fresh/plugin-vite@1.1.2` and inspects the production client manifest and island chunk.
- **Commit slice:** one implementation slice covers D1–D3 because hydration and client navigation
  are inseparable. Its gates are the four required regression tests, scoped Fresh/CLI wrappers,
  package tests, doc lint, `quality:gate`, and the explicit `packages/fresh/src` quality scan.
- **Migration:** regenerate and commit the embedded CLI template asset. Already-generated apps do
  not receive the new `fresh()` option; they must regenerate their app scaffold.
- **Deferred scope:** browser-driven navigation and exact swap-count proof remain in #1557; the
  dead `debug` prop, streaming delivery, and #1457/#1548 surfaces remain untouched.

## Implementation

- Added the published `./defer/island` export. Its runtime surface contains only
  `DeferComponent`; the component props and their policy dependencies are type-only exports so
  Fresh cannot register the helper functions in `DeferIsland.tsx` as islands.
- Added `@netscript/fresh/defer/island` to the kernel, maintainer-local, and public-JSR resolvers;
  generated app manifests now carry the literal import-map key in both source modes.
- Updated the Fresh-init fallback from its stale `@fresh/plugin-vite@^1.0.8` literal to the
  canonical `SCAFFOLD_APP_CATALOG.FRESH_PLUGIN_VITE` (`^1.1.2`).
- Regenerated `embedded.generated.ts` and `agent-docs.generated.ts`. The lock change is the
  `packages/fresh` dependency edge for `jsr:@fresh/plugin-vite@^1.1.2` plus that plugin's resolved
  Fresh/Vite/Babel graph; no cache or unrelated source dependency churn is present. The graph is
  required so root `deno ci` sees the new package dependency rather than a dirty or incomplete lock.
- The bundle fixture aliases only `@opentelemetry/api` to a no-op fixture module. This avoids an
  unrelated workspace-only telemetry-resolution failure while compiling the real defer island,
  real policy, and Fresh 1.1.2 client entry.

## Regression tests

- `vite build emits the registered defer island in the client bundle` — builds the committed Vite
  fixture, asserts exactly one `fresh-island__*` manifest entry, and verifies its emitted chunk
  contains `partial-miss`.
- `DeferComponent enables f-client-nav for every request and cache combination` — checks all four
  `isPartialRequest` × `hasCachedData` combinations, including the formerly-disabled partial miss.
- `DeferPage server tree carries the registered defer island component identity` — uses the
  precompiled JSX-tree shape and requires the exact function identity exported by the island
  subpath.
- `DeferPage keeps the coordinator inside the named partial across miss-to-hit swaps` — proves the
  named `<Partial>` is the only outer dynamic child and that both miss and hit trees contain a
  coordinator with current request/cache props.
- `published manifest declares every catalog-backed Fresh runtime dependency` now also pins the
  `./defer/island` export shape. CLI generator/resolver and embedded-template tests cover the JSR,
  local-source, Fresh-init fallback, and regenerated asset paths.

## Validation

All final commands exited 0. Verbatim terminal output or terminal excerpts follow; the full
package-test run reported `227 passed | 0 failed`, and the targeted CLI run reported
`10 passed (23 steps) | 0 failed`.

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-1459"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":188,"batches":2,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-1459","exitCode":0},"selection":{"filesSelected":188,"batches":1},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-1459","mode":"check","summary":{"filesSelected":188,"batches":1,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}

$ deno task --cwd packages/fresh test
ok | 227 passed | 0 failed (8s)

$ deno task doc:lint --root packages/fresh --pretty
"summary": {
  "totalPackages": 1,
  "totalErrors": 44,
  "totalPrivateTypeRef": 27,
  "totalMissingJSDoc": 17,
  "totalOther": 0
}
...
{
  "path": "./src/application/defer/island.ts",
  "privateTypeRef": 0,
  "missingJSDoc": 0,
  "other": 0,
  "total": 0
}

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-1459"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":861,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-1459","exitCode":0},"selection":{"filesSelected":861,"batches":5},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-1459","mode":"check","summary":{"filesSelected":861,"batches":5,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}

$ deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/fresh/src
{"ok":true,"mode":"repository","scanned":["packages/fresh/src"],"findings":[],"allowCount":1,"allowances":[{"file":"packages/fresh/src/application/builders/define-page/builder/route-support.ts","line":96,"reason":"DefinePageWithRouteContract preserves prior path/search output when either optional schema is omitted, but BoundRouteContract maps an omitted schema to EmptyRecord; TypeScript cannot equate those conditional states without presence-specific legacy builder overloads"}]}

$ deno task quality:gate
Task quality:gate deno task quality:scan && deno task arch:check
Task quality:scan deno run --allow-read .llm/tools/quality/scan-code-quality.ts
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7,"allowances":[...]}
Task arch:check deno task deps:check && deno run --allow-read .llm/tools/fitness/check-doctrine.ts ...
```

The package-quality verdict for `packages/fresh` rests on the explicit target scan above because
root `arch:check` does not include this package.

Two required gates were red during implementation and were corrected rather than bypassed:

```text
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-1459"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":188,"batches":2,"failedBatches":1},"summary":{"totalOccurrences":2,"uniqueOccurrences":2,"uniqueCodes":2,"uniquePaths":1},"groups":[{"code":"TS9036","message":"Move the expression in default export to a variable and add a type annotation to it.","count":1,"paths":[{"path":"/home/codex/repos/ns006-1459/packages/fresh/tests/fixtures/defer-island-client/vite.config.ts","count":1,"locations":[{"line":5,"column":1}]}]},{"code":"TS9037","message":"Default exports can't be inferred with --isolatedDeclarations.","count":1,"paths":[{"path":"/home/codex/repos/ns006-1459/packages/fresh/tests/fixtures/defer-island-client/vite.config.ts","count":1,"locations":[{"line":5,"column":16}]}]}]}

$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-1459","mode":"check","summary":{"filesSelected":188,"batches":1,"failedBatches":1,"findings":1,"ignoredFindings":0},"findings":[{"path":"/home/codex/repos/ns006-1459/packages/fresh/src/application/defer/island.ts","reason":"-export type {"}]}
```

The first was fixed by assigning an explicitly typed `UserConfig` before default export; the
second by formatting the type-only exports. Both green reruns are included above.

## Not verified in this lane

- No browser-driven navigation or exact one-swap assertion was run; #1557 owns that criterion.
- `scaffold-static` was not run locally; the scoped CLI wrappers, targeted generator/registry
  tests, and regenerated embedded asset are green, and CI is expected to exercise that suite.
- The PR remains draft and no IMPL-EVAL was triggered.
