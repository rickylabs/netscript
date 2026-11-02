PASS

The Escape blocker is fixed, and I found no new blockers in the correction.

- **Escape handling:** `navigation-menu.tsx:59-68` now handles Escape only when a `details[open]` actually exists, and calls `preventDefault()` only then. With every disclosure closed the key is left alone, so an enclosing native dialog or popover still gets its close request.
- **The new `navigation-menu/escape-boundary` test** puts the menu inside the real public `Dialog` and checks three cases:
  - Escape with all disclosures closed closes the dialog and focus returns to its trigger.
  - Escape with a disclosure open closes only that disclosure; the dialog stays visible and focus moves to the summary.
  - The next Escape closes the dialog and returns focus to the trigger.

  You report it failed against the old source. I couldn't see the corrected quality rerun, so its result still needs to land in the slice evidence.
- **Current-page marking:** panel links now get `aria-current="page"` when `current` is set (lines 102-106), and the escape-boundary test checks this. A current disclosure group also marks its summary with `aria-current="true"` (line 88).
- **ActionMenu cleanup:** the layout effect in `ActionMenuContent` (`ActionMenu.tsx:119-131`) now removes the `autofocus` marks it set when the menu closes. The explicit `return undefined` only satisfies `noImplicitReturns` and changes nothing at runtime.

My first-round conclusions about Menubar, the menu items helper, the runtime changes and registry reachability still hold; this correction doesn't affect them.
