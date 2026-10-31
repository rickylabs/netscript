**PASS.** Every slice-2 blocker is fixed, and the new data matches the shipped code. I found nothing left that blocks.

**Keyboard data**
- **A3 button group and A6 action bar** (`actions/1.ts:442`, `actions/2.ts:299`): both now say "native buttons and links", with Tab/Shift+Tab and Enter/Space.
- **A4 toggle** (`actions/2.ts:123`): now cites the APG button pattern, with Enter/Space toggling `aria-pressed`.
- **A5 toggle group** (`actions/2.ts:218`): still cites the toolbar pattern, and now lists arrow keys, Home/End and Enter/Space.
- **O5 popover and O6 tooltip** (`overlays/2.ts:242`, `:351`): both now list Escape, matching `closeOnEscape` in the runtime.
- **D8 code block, K4 desktop notification and K5 update prompt**: all three now list native buttons with Tab and Enter/Space.
- **I8 prompt input** (`ai/1.ts:256-347`): it now has `submitKey` with values `none`/`enter`/`mod-enter` and default `none`. That matches the component (`prompt-input.tsx:29, 102, 130`). The Enter and Mod+Enter entries note the Shift and composition guards, which match `shouldSubmitPromptKey`.

**Other fixes**
- **Button `type`** now lists `button`/`submit`/`reset`/`link`, and **`iconPosition`** lists `left`/`right`. Both match `button.tsx:20, 47, 59`.
- **Icon button `tokenRoles`** now has Button's full variant role set (`actions/1.ts:356-372`).

**Reference docs** (`docs/site/reference/fresh-ui/index.md`)
- Both new subpaths, `./contracts` and `./contracts.json`, appear in the subpath list (lines 19–20) and the exports table (lines 552–553).
- The new "Component contracts" section lists all 10 exported symbols with their kinds, and has an example that uses `componentContracts`, `serializeComponentContracts` and the JSON import.

**Non-blocking notes**
- The popover and tooltip share one Escape description: "restore popover trigger focus or keep tooltip trigger focus". Giving each entry its own wording would read better.
- `iconPosition` doesn't record its `'left'` default, even though the code sets it (`button.tsx:93`).

I made no edits and didn't run the tests or the docs CI check.
