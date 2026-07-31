# Worklog — issue #964

## Design

- Public surface: generated Aspire `apphost.mts`, `.helpers/*.mts`, and `tsconfig.apphost.json`.
- Domain vocabulary: emitted file path and relative import specifier.
- Ports: none; this is deterministic scaffold rendering.
- Constants: existing `SCAFFOLD_ASPIRE_MODULES` and `HELPERS_FILES` remain authoritative.
- Commit slice: align generated TypeScript specifiers with emitted `.mts` files and add a semantic
  resolution guard.
- Deferred scope: full `scaffold.runtime` smoke belongs to evaluator / merge-readiness.
- Contributor path: update the scaffold constants or asset templates, regenerate the embedded asset
  barrel, and run the helper generator tests.

## Findings

- The issue is correct that generated `.mts` sources referenced non-existent `.mjs` paths.
- The mismatch was not one construction site: four scaffold constants, one formatter, one direct
  asset import, and six generated helper templates independently encoded `.mjs`.
- TypeScript-source specifiers require `allowImportingTsExtensions: true` in the generated NodeNext
  AppHost configuration.

## Regression evidence

- Guard: `should emit local import specifiers that resolve to generated files` walks relative imports
  in pipeline output and verifies each local target exists in the generated file set.
- Fails-before mutation: temporarily changed `HELPERS_IMPORT_FROM_ROOT` back to
  `./.helpers/index.mjs`; the helper suite exited 1 with
  `apphost.mts imports ./.helpers/index.mjs, but /aspire/.helpers/index.mjs was not generated`.
- Restored result: helper suite exited 0 with 139 steps passed.

## Gates

| Gate | Result |
| --- | --- |
| Helper generator suite | PASS — 13 tests / 139 steps |
| Scoped CLI check wrapper | PASS — 737 files / 7 batches |
| Scoped CLI lint wrapper | PASS — 737 files / 4 batches |
| Scoped CLI format wrapper | PASS — 737 files / 4 batches |
| `deno task quality:gate` | PASS — quality scan and architecture check |
| Full `scaffold.runtime` smoke | NOT RUN — reserved for evaluator / merge-readiness |

## Reconcile

- Issue #964 remains the complete scope and PR #982 must carry `Closes #964`.
- No architecture debt was introduced.
