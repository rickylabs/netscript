**FAIL_FIX.** The badge-template fix isn't in this worktree yet. Everything else you listed checks out.

## Remaining blocker

**The CLI scaffold templates still use the removed badge modifiers.** The files on disk haven't changed since my last review:
- `packages/cli/src/kernel/assets/app/routes/(_components)/health-view.tsx.template:9` still has `<span class='ns-badge ns-badge--success w-fit'>healthy</span>`.
- `packages/cli/src/kernel/assets/app/routes/examples/telemetry/(_components)/telemetry-view.tsx.template:74` still has `<span class='ns-badge ns-badge--secondary w-fit'>Telemetry</span>`.
- `packages/cli/src/kernel/assets/embedded.generated.ts` (lines 41 and 83) still embeds both old class strings.

If you've made these edits somewhere else, they haven't reached this worktree. To close it, change those two spans to `class='ns-badge w-fit' data-variant='success'` and `data-variant='secondary'`. Then regenerate `embedded.generated.ts` with its existing generator. Once that's done, searching the worktree for `ns-badge--` should find nothing outside docs and `axe-baseline.json`.

## Verified

- **Spinner part:** the loading spinner is now always `data-part='root' data-scope='spinner'` (`button.tsx:90-91`). It no longer copies the caller's `data-part`.
- **`render-ui.tsx`:** the category modifiers are now `data-variant`, and the table header row is now `data-type='header'`. The old `ns-stack--sm` became `data-gap='sm'`, and `layouts.css:39-41` styles `data-gap='sm'` with the same rule as the old class, so nothing renders differently.
- **No other leftover modifiers:** outside the three CLI files above, there are no remaining block or element modifiers in non-docs source.
- **DataGrid split:** `data-grid.tsx` re-exports all 8 types and `DATA_GRID_CELL_VARIANTS` from `data-grid-contract.ts`. `mod.ts:25-36` still exports everything it did before, so the public surface is unchanged.

I didn't read the expanded 185-case parity replay. As you said, the final gate evidence (the parity recheck and the axe-baseline re-key) still needs to be recorded before sign-off. I made no edits and didn't run any tests.
