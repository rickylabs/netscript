# Slice #561 + #564 Worklog

Branch: `test/561-564-cli-e2e-ui-add-ai`

Baseline: `origin/feat/258-fresh-ui-genui-renderer` at `4b1179ba`.

## Design

- Public surface: four `scaffold.runtime` gate IDs covering AI collection install, local-source
  dependency mapping, copied-file type-check, and generated-project render behavior.
- Domain vocabulary: the existing `GATE` constants and `GateDefinition` contract; no new product
  types or ports.
- Ports: existing command executor through `commandGate`; the generated project is the consumer
  boundary.
- Constants: all new finite gate IDs live in `packages/cli/e2e/src/domain/cli-surface.ts`.
- Commit slices:
  1. Add the `ui:add ai` install/type-check/render gates and suite selection; prove with focused E2E
     tests and package wrappers.
  2. Run the canonical one-pass `scaffold.runtime` acceptance gate and record final evidence.
- Deferred scope: published-JSR validation remains outside this local-source stacked slice because
  `@netscript/ai@^0.0.1-beta.5` is not published. The E2E verifies that `ui:add` emits that declared
  dependency, then maps it to the copied `packages/ai` workspace member.
- Contributor path: add generated-project acceptance behavior in
  `src/application/gates/scaffold/`, register its ID in `cli-surface.ts`, and select it in the
  relevant capability suite.

## Slice 1 — generated-project AI collection coverage

- Added `ui:add ai` to `scaffold.runtime` using the stacked Fresh UI registry.
- Asserted the copied `McpUiWidget` island, widget CSS, `render-ui` module, and all `theme-seed`
  artifacts exist at their registry targets.
- Verified `ui:add` merges the expected unpublished JSR dependency before replacing that one import
  with `./packages/ai/mod.ts` for local-source testing.
- Added focused type-check coverage for both copied TSX files.
- Added server-render assertions for nested layout/viz/data blocks, escaped text, unknown-block
  fallback, depth-overflow fallback, and absence of raw HTML.

Evidence:

| Gate | Result |
| --- | --- |
| `deno test --allow-all packages/cli/e2e/tests` | PASS — 35 passed |
| scoped check wrapper, `--root packages/cli --ext ts,tsx` | PASS — 593 files, 0 diagnostics |

Reconcile: #561 and #564 are fully represented by the selected runtime gates. The supervisor owns
the resolving PR and its `Closes #561` / `Closes #564` body keywords.

## Drift

- The requested `.llm/runs/beta6-ship--orchestrator/` directory was absent at slice start. This
  lane created only the requested completion worklog rather than inventing supervisor plan or
  evaluator artifacts. The carried implementation brief and supervisor identity remain the locked
  slice contract.
- Published-JSR availability is intentionally not treated as green. The generated fixture first
  asserts the exact JSR dependency was emitted, then explicitly records and applies the local-source
  mapping used by other maintainer scaffold paths.
