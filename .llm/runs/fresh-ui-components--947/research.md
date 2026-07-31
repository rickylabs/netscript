# Research — fresh-ui-components (#947, #948, #949)

## Re-baseline

Verified on `feat/fresh-ui-component-pass` at `eca067313` and remote PR #989 head with no later
remote commit. The carried plan's shared-cause hypothesis is substantially correct: presentation
does not compose the existing interactive runtime. One inventory claim was wrong: the current
`useDismissableLayer` dismisses on outside pointer/focus and Escape but does not restore trigger
focus. That missing behavior remains in scope and is recorded in `drift.md`.

## Findings

1. `src/presentation/data-grid.tsx` is a 323-line live public component exported from `mod.ts` with
   generic `DataGridColumn<T>` and plain/button/href `DataGridRow<T>` variants. #947 is additive
   contract work; G7 is mandatory.
2. `collection-navigation.ts` implements vertical ArrowUp/ArrowDown/Home/End traversal.
   `use-popover.ts` already composes `useDismissableLayer`, controllable open state, platform popover
   positioning, trigger/content refs, and event-handler composition. New menu-global listeners would
   duplicate the precise seam this issue exists to reuse.
3. `useDismissableLayer` registers the package's established document listeners while enabled but
   does not focus the trigger after dismissal. ActionMenu must add focus restoration without adding
   another global listener set.
4. `registry/components/ui/prompt-input.tsx` renders attach/screenshot/voice buttons without
   callbacks. `registry.manifest.ts` maps it into app-owned target files and
   `registry.generated.ts` embeds the source, confirming copy/vendoring compatibility.
5. Registry generated content is produced by `.llm/tools/generate-cli-assets-barrel.ts` through
   `deno task gen:assets-barrel`; it must not be edited manually.
6. PR #989 is draft, targets `main`, has `type:feat`, `area:fresh-ui`, exactly one `status:impl`, the
   beta.12 milestone, and closing keywords for all three issues.
7. Issue corrections were posted and artifact-verified on #947, #948, and #949.

## JSR/public-surface scan

- Package metadata is complete (`@netscript/fresh-ui`, description, version, six export entries).
- ActionMenu extends `./interactive`; DataGrid extends root `.`; PromptInput remains copied registry
  source and is not a new package export.
- New exported ActionMenu symbols need explicit public annotations and JSDoc to avoid slow/private
  types.
- Baseline `deno task doc:lint --root packages/fresh-ui --pretty` reports 123 existing findings, all
  on `interactive.ts` (96 private-type references, 27 missing JSDoc). This slice must add zero; broad
  cleanup is deferred and not claimed.
- Publish include/exclude rules include runtime/registry source and exclude tests. Final dry-run must
  verify the file list and slow types.

## Open questions resolved by implementation research

- All existing compound runtime triggers (`Popover`, `Dialog`, `Sheet`, `Drawer`, `Tooltip`) render
  native buttons. ActionMenu follows that convention. DataGrid prevents invalid nesting by changing
  only opted-in action rows to a non-interactive row wrapper with isolated inner navigation.
- `DataGridRow<T>` already requires `id: string`; selection uses that identity and does not add a
  second identity callback.
