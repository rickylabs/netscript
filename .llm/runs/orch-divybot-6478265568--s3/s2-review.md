**FAIL_FIX.** The inventory and shipped flags are correct. The blockers are all keyboard data: three entries claim the toolbar pattern with no keys, two shipped overlays leave out the Escape key their code handles, and four shipped components with real controls are marked "noninteractive presentation". Slice 5 will build its render tests from this data, so these mistakes would become the tested contract.

## Blockers

1. **Three Actions entries claim the toolbar pattern but list no keys.** Each has the toolbar APG URL and `keyboard: []`:
   - A3 button group (`actions/1.ts:419`) and A5 toggle group (`actions/2.ts:290`): either list the toolbar keys (arrow keys move focus, Home/End), or, if the design intent is a plain group of buttons, stop claiming the toolbar pattern and list Tab plus Enter/Space. The toggle-group behaviour shadcn's version follows uses arrow-key focus plus Space/Enter.
   - A4 toggle (`actions/2.ts:222`): a single toggle is a toggle button, not a toolbar. It should cite the APG button pattern with Enter/Space to toggle `aria-pressed`.

2. **The tooltip and popover leave out Escape, which the shipped code handles.**
   - O6 tooltip (`overlays/2.ts:343`) cites the APG tooltip pattern, which requires Escape to dismiss, but has `keyboard: []`. The runtime turns Escape on unconditionally (`src/runtime/tooltip/use-tooltip.ts:103`, `closeOnEscape: true`).
   - O5 popover (`overlays/2.ts:239`) has `keyboard: []`, but `use-popover.ts:39` closes on Escape by default.

   Both need an Escape entry ("Close and return focus").

3. **Four shipped components with real controls are marked "noninteractive presentation" with `keyboard: []`.** The schema reserves an empty keyboard map for noninteractive presentation, so these entries are false:
   - I8 prompt input (`ai/1.ts:320`): Enter submits (or Mod+Enter, depending on `submitKey`), and it has several buttons (`prompt-input.tsx:142-145, 173-239`).
   - D8 code block (`data-display/3.ts:246`): has a copy button (`code-block.tsx:35`).
   - K5 update prompt (`desktop/2.ts:120`) and K4 desktop notification (`desktop/2.ts:62`): both render action buttons.

   Change their `apg` to native buttons (or the real pattern) and list Enter/Space, plus the prompt input's submit key.

## Checks that passed

- **Counts:** 87 entries, 66 shipped and 21 design-only. The specIds and names are unique.
- **Shipped flags:** every entry's `shipped` value matches the spec's `Exists` column.
- **Design-only scope:** all 21 design-only entries sit in the six approved categories: A3–A5, F6/F9/F10/F11/F13/F14, N6–N9, O2/O7/O9 and D6/D7/D9/D13/D14. The entries outside those categories (Z1, L1–L8, the AI entries, K1–K6, X1) are all shipped. Unbuilt gaps such as I6 and L10 are left out.
- **Public API:** `componentContracts` is exported from `./contracts`, and `contracts.json` is both a subpath export and in `publish.include`. The tests check that the checked-in JSON matches the typed catalog.
- **Spec names and axes:** I spot-checked the Actions entries and they match the spec, including the planned `link` and `xs` values. I did not check every entry's axes against the spec.

## Non-blocking notes

- The N5 top bar and L5 filter form are also marked "noninteractive presentation" even though they contain interactive children. "Native links and controls" would be more accurate.
- On Button, the `type` and `iconPosition` props are `kind: 'enum'` but have no `values`.
- The icon button's `tokenRoles` lists only `surface/card` and `text/fg`. The spec says it follows Button's variant table, so it should probably list the same roles as Button.

I made no edits and didn't run the tests.
