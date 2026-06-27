# alpha.11 fix-train Slice B worklog

## Design

- Public surface:
  - CLI scaffold templates remain the public generated surface.
  - `createNetScriptVitePlugin()` remains the Fresh Vite helper and now returns the upstream Vite
    `Plugin` type.
- Domain vocabulary:
  - `ServiceStatusCounts` is a local mutable accumulator for generated summary counts.
  - `ServiceShowcaseListData` remains the generated service-list data type.
- Ports:
  - Existing SDK `QueryClientPort` only; no `getQueryState`.
- Constants:
  - Existing `SERVICE_SHOWCASE_PAGE_SIZE` and `SERVICE_SHOWCASE_INPUT`.
- Commit slices:
  - Single implementation commit for F-15a/b/c scaffold type-soundness.
- Deferred scope:
  - SDK query-client contract expansion.
  - Full runtime E2E smoke.
- Contributor path:
  - Update template files under `packages/cli/src/kernel/assets/**`, then run
    `deno task gen:assets-barrel`, scaffold a fresh project, and run generated `deno task check`.

## Implementation

- Rewrote `service-showcase.ts.template` to:
  - add a typed mutable status count accumulator;
  - build `fetchQuery` options explicitly from `queryOptions.queryKey` and `queryOptions.queryFn`;
  - use `Date.now()` for the server prefetch timestamp instead of `getQueryState`.
- Rewrote the generated island template to stop using `getQueryState`, `cancelQueries`, and
  `initialDataUpdatedAt`; display state now comes from the package-owned `useQuery()` result.
- Fixed local generated import-map paths for SDK subpaths to copied package source files under
  `packages/sdk/src/**/mod.ts`.
- Changed `NetScriptVitePlugin` to alias Vite `Plugin` and returned the plugin directly, removing
  the previous `as unknown as NetScriptVitePlugin` cast.
- Regenerated `packages/cli/src/kernel/assets/embedded.generated.ts`.

## Gates

| Gate | Result |
| --- | --- |
| Fresh scaffold `typecheck-b-after2`, generated workspace `deno task check` | PASS, exit 0 |
| Root scoped check during validation, `run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(fresh-ui)\|.*(?:^|/)\.generated/\|.*(?:^|/)node_modules/)"` | PASS |
| `run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS, 524 files, 0 errors |
| `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS, 147 files, 0 errors |
| `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS, 147 files, 0 findings |
| `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS, 147 files, 0 findings |
| `deno lint .` from `packages/cli` | PASS, 75 files |
| `rg --files packages/cli -g '*.ts' -g '*.tsx' \| xargs deno fmt --check` | PASS, 75 files |
| CLI wrapper lint/fmt for `packages/cli` | Nonzero with 0 findings; raw CLI-local TS lint/fmt evidence above is clean |
| `deno test --allow-all packages/cli/src/kernel/templates/app/generators-config_test.ts packages/cli/src/kernel/application/registries/template-registry_test.ts packages/cli/src/kernel/adapters/templates/template-asset_test.ts` | PASS, 7 tests / 15 steps |
| `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` | PASS, 5 tests |
| `git diff --check -- <touched paths>` | PASS |

## Notes

- Raw `deno fmt --check .` from `packages/cli` still reports pre-existing Markdown formatting drift
  in `packages/cli/e2e/README.md`; this slice did not touch it.
