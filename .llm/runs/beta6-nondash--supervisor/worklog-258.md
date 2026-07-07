# Slice FB5 / Issue #258 Worklog

## Design

Public surface:

- `@netscript/fresh-ui/ai/render-ui` subpath exporting `renderUiPayload`, `RenderUiSurface`,
  `RENDER_UI_MAX_DEPTH`, the curated block vocabulary types, and the consumed
  `RenderUiToolInput` type from `@netscript/ai/tools`.
- Root `mod.ts` remains unchanged to avoid expanding the existing root export count.

Domain vocabulary:

- Input contract is `RenderUiToolInput` from `@netscript/ai/tools`: `{ component, props?, title? }`.
- Recursive payload nodes are read from `props.children` / `props.items` / `props.content` and must
  carry `type` or `component`.
- Exactly three categories are whitelisted: `layout`, `viz`, and `data`.
- Whitelisted block types are `stack`, `grid`, `section`, `chart`, `metric`, `table`, `list`, and
  `card`.

Ports:

- None. The renderer is deterministic Preact DOM projection and has no adapter or IO dependency.

Constants:

- `RENDER_UI_MAX_DEPTH = 6`.
- `RENDER_UI_BLOCK_CATEGORIES` is the only accepted vocabulary table.

Commit slices:

- FB5: safe renderer + registry entry + guard tests + harness evidence.

Deferred scope:

- Provider-specific tool-call wiring stays out of scope.
- Full `scaffold.runtime` E2E coverage is deferred to follow-up issue #564 because it requires a
  generated-project scenario beyond this unit renderer slice.

Contributor path:

- Add a new curated block by editing `RENDER_UI_BLOCK_CATEGORIES`, adding one renderer branch in
  `src/ai/render-ui.tsx`, and extending `tests/ai/render-ui.test.tsx`.

## Implementation Notes

- Added `packages/fresh-ui/src/ai/render-ui.tsx`.
- Added `packages/fresh-ui/tests/ai/render-ui.test.tsx`.
- Added `./ai/render-ui` to `packages/fresh-ui/deno.json`.
- Added `render-ui` registry item and appended it to the existing `ai` collection.
- Regenerated `packages/fresh-ui/registry.generated.ts`.

Security guard regressions:

- Depth guard: payloads beyond `RENDER_UI_MAX_DEPTH` render
  `data-render-ui-fallback="max-depth"`.
- Whitelist guard: unknown block types render `data-render-ui-fallback="unknown-type"` and the
  fallback carries no raw payload markup.
- Raw HTML path: tests assert no `dangerouslySetInnerHTML` or `__html` appears in the renderer
  source.

## Gate Evidence

| Gate | Command | Raw result |
| --- | --- | --- |
| E4 surface read | `deno doc --filter RenderUiToolInput packages/ai/tools.ts` | exit 0; `RenderUiToolInput` has `component`, `props?`, `title?` |
| E4 tool read | `deno doc --filter renderUiTool packages/ai/tools.ts` | exit 0; tool is client-deferred `render_ui` |
| Focused check | `deno check --unstable-kv packages/fresh-ui/src/ai/render-ui.tsx packages/fresh-ui/tests/ai/render-ui.test.tsx` | exit 0 |
| Guard tests | `deno test --allow-read --unstable-kv packages/fresh-ui/tests/ai/render-ui.test.tsx` | exit 0; 3 passed / 0 failed |
| Wrapper check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh-ui --ext ts,tsx` | exit 0; filesSelected=128; failedBatches=0; totalOccurrences=0 |
| Wrapper lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh-ui --ext ts,tsx` | exit 0; filesSelected=128; totalOccurrences=0 |
| Wrapper fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh-ui --ext ts,tsx --ignore-line-endings` | exit 0; filesSelected=128; failedBatches=0 |
| Fresh UI tests | `deno test --allow-all packages/fresh-ui/tests/` | exit 0; 132 passed / 0 failed |
| F-3 | `rtk proxy deno task arch:check` | exit 0; warnings only, no FAIL rows |
| Touched doc-lint | `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/fresh-ui --entrypoints ./src/ai/render-ui.tsx --pretty` | exit 0; totalErrors=0 |
| Full fresh-ui doc-lint | `deno task doc:lint --root packages/fresh-ui --pretty` | exit 0 wrapper; existing `interactive.ts` debt remains 123 total; new renderer entrypoint total=0 |
| Publish dry-run | `deno publish --dry-run --allow-dirty` from `packages/fresh-ui` | exit 0; no `--allow-slow-types`; dry run complete |
| Registry smoke | `deno run -A packages/cli/bin/netscript-dev.ts ui:add ai --project-root .llm/tmp/fresh-ui-render-ui-smoke --registry-root packages/fresh-ui --force` | exit 0; installed 25 items; copied 47 files; renderer copied to `lib/ai/render-ui.tsx` |
| Copied renderer check | `deno check --unstable-kv lib/ai/render-ui.tsx` from scratch smoke root | exit 1; blocked by unpublished `@netscript/ai@^0.0.1-beta.5` on JSR, not by copy rewrite |

## Reconcile

- Issue #258 should be closed by this PR once Tier-A review, adversarial review, and IMPL-EVAL pass.
- Epic #238 is referenced only as `Part of #238`; no closing keyword.
- `gate:e2e` remains deferred to #564 and must not be checked on #258 in this slice.
