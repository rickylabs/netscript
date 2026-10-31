PASS (slice 7c1 corrective round, not the final IMPL-EVAL)

The `header='tabs'` blocker is fixed, and I found no regressions.

- **Mode choice (`code-block.tsx:153-161`):**
  - `header` no longer selects file-tabs mode on its own. Tabbed mode now comes only from an explicit `variant='tabbed'` or a non-empty `tabs` array.
  - A legacy `header='tabs'` without files renders a single block. `chrome` is on, so it shows the filename header, the copy button and `data-header="title"`.
- **Validation:**
  - The `RangeError` (lines 163-169) still fires when `variant='tabbed'` comes with no files.
  - It also fires for a real file list with duplicate or blank values, so valid tabbed use is still strict.
- **Tests:** `code-block.test.tsx:25-38` renders all three legacy aliases (`none`/`title`/`tabs`) without files.
  - Each must render `data-variant="single"`, with `data-header` of `none` for `none` and `title` otherwise.
  - The `title` and `tabs` aliases must also render the filename and the exact `data-clipboard` source.

  You also report that the browser fixture's single block now uses `header='tabs'` and the clipboard test activates and reads it back. I couldn't see the run, so that rests on your report.
- **Contract:** D8 `header` keeps `kind: 'boolean'` and lists `values: ['none', 'title', 'tabs']` again for tooling. The description records that `tabs` without files falls back to the title header.
- Everything else from round one is unchanged and still holds: the copy race guard and result callbacks, the Tabs right-to-left and key-axis behavior, the registry dependency repair, and the documented monochrome syntax inside diff rows.
