FAIL_FIX (slice 7c1: CodeBlock and the related Tabs change, not the final IMPL-EVAL)

**Blocker: the legacy `header='tabs'` alias now crashes a phase 1 caller.**

- **Where:** `packages/fresh-ui/registry/components/ui/code-block.tsx:153-169`.
  - When `variant` is absent or one of the phase 1 aliases, `mode` falls through to `header === 'tabs' || tabs.length ? 'tabbed' : 'single'`.
  - Tabbed mode then throws `RangeError('Tabbed code requires unique nonempty file values.')` whenever `tabs` is empty.
- **Why it's a blocker:**
  - `tabs` is a new prop in this slice, so any phase 1 caller passing `header='tabs'` can only do so with no `tabs` array (for example `<CodeBlock code=… filename=… header='tabs' />`). Rendering that now throws.
  - That breaks an alias the slice promises to keep. It's still accepted by the TS type (`header?: boolean | 'none' | 'title' | 'tabs'`), the D8 contract describes it as a legacy alias (`data-display/3.ts:123-128`), and `data-header` still lists `tabs`.
  - `code-block.test.tsx:25-31` only covers `header='none'`, so this isn't tested.
- **Required fix:**
  - Throw the `RangeError` only when the caller actually asked for file tabs: explicit `variant='tabbed'`, or a non-empty `tabs` array with invalid values.
  - The legacy `header='tabs'` with no `tabs` should render a non-throwing single block with the filename header. That means `data-header='title'`, or `'tabs'` if you want the attribute kept, and the contract notes should record which.
  - In `code-block.test.tsx`, add an SSR case rendering `<CodeBlock code='x' filename='a.ts' header='tabs' />` that asserts no throw, the expected header and that copy still works.

The rest of the slice is sound:

- **Compatibility:**
  - `code`, `filename`, `lang` and `class` still work, as do native HTML props including the native `onCopy`. `message.tsx` still calls `CodeBlock` with only `code`/`filename`/`lang`.
  - The old `default`/`destructive` variants map to single, and `added`/`removed`/`highlighted` map to diff, kept as `data-variant` compatibility values.
- **Copy:**
  - It copies the exact raw source, with removed lines left out when the text is derived from rows.
  - `onCopied` and `onCopyError` are separate from native `onCopy`.
  - A request counter, bumped in a layout effect whenever the file or source changes, stops a late copy result from marking a different file as copied.
  - Results are announced in a live `role=status` region.
  - The controlled `state` changes only the visual state.
- **Tabs:**
  - File tabs use the public `Tabs`. Raw values must be unique and non-empty, and values are URL-encoded for the ARIA IDs.
  - The file tabs still render when `header` is `false`.
  - Code content is `dir=ltr`, and the single content region is a focusable labelled `region` so it can be scrolled from the keyboard.
- **Tabs runtime:**
  - In right-to-left layouts only the horizontal arrows are swapped (`tabs.utils.ts:12-14`).
  - The trigger now only intercepts arrow keys along its own orientation (`use-tabs.ts:167-170`), so keys on the other axis scroll normally.
- **Diff rows:** the header counts additions and removals, and visible +/− marks supplement the colour.
- **Registry:** `code-block` declares the current Fresh UI root dependency (`registry.json:2376-2378`), handled by the same exact historical-repair exception as `command-palette`, and the frozen fixture is unchanged. `cn` comes in through `theme-seed`.
- **Monochrome diff syntax:** making syntax inside tinted diff and highlight rows monochrome is an explicitly documented accessibility choice, backed by measured ratios in `drift.md`. Normal rows still show all seven syntax colours, and no token values or axe allowances changed. I accept it as recorded.

Non-blocking: in the D8 contract `header` changed from the phase 1 enum to `kind: 'boolean'`, with the aliases only mentioned in the description. Tooling that reads `contracts.json` for allowed values loses the `none`/`title`/`tabs` list. Consider listing them under `values`, or record the change explicitly as a compatibility note.
