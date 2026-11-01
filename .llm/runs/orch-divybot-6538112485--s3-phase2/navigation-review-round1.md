FAIL_FIX

**Blocker: NavigationMenu swallows every Escape key press, even when none of its disclosures is open.**

- **Where:** `packages/fresh-ui/registry/components/ui/navigation-menu.tsx:58-64`. The `<nav>` `onKeyDown` calls `event.preventDefault()` on any Escape that hasn't already been handled, and only then calls `close(true)`. `close` does nothing when no `details[open]` exists, but the key press has already been cancelled.
- **Why it's a blocker:**
  - In Chromium, cancelling the Escape `keydown` stops the browser's close request. A native `<dialog>` then gets no `cancel`, and an auto popover isn't dismissed.
  - Any outer layer that respects `defaultPrevented` will also ignore the key.
  - A NavigationMenu placed inside the package's own native Sheet/Drawer or Dialog (a common mobile-navigation pattern) would therefore stop Escape from closing that container whenever focus is on one of its links or summaries. That breaks the focus and dismissal boundary of the surrounding component.
  - The browser spec never presses Escape while all disclosures are closed, so it doesn't show up.
- **Required fix:**
  - Only handle Escape when a disclosure is actually open, i.e. `root.current?.querySelector('details[open]')` exists (or `opened !== null`). In that case, call `preventDefault()` and close it with focus restored to its summary.
  - Otherwise leave the event alone.
  - Add a browser case:
    - Put the `NavigationMenu` inside the fixture's native `Dialog` (or a plain `<dialog>` opened with `showModal()`).
    - Focus a top-level link with every disclosure closed, press Escape, and assert the dialog closes.
    - Keep the existing open-disclosure Escape case, which closes the disclosure and keeps focus on its summary.
  - Rerun the navigation projects.

Everything else holds up:

- **LocationMarker:** decorative only (`aria-hidden`, no tab stop). The parent link carries `aria-current="page"`.
- **Stepper:**
  - It's an ordered list. `aria-current="step"` sits on the single current step, and more than one current step throws.
  - The status is also given as screen-reader text.
  - Only steps with an `href` become native links.
- **NavigationMenu, apart from the blocker:** native links, exclusive `details name=…` disclosures that work before hydration, and closing when focus leaves via a native `focusout`.
- **Menubar:**
  - `role=menubar` with roving `menuitem` triggers. Left/right (swapped in right-to-left layouts) and Home/End move between triggers. Down/Up open the menu at its first or last item.
  - While a menu is open, left/right switch to the neighbouring menu. Escape returns focus to the trigger, and Tab leaves through the trigger.
  - It closes when focus leaves the menubar.
  - Native auto-popover light dismiss goes back through `onToggle`.
- **Menu items:**
  - Checkbox and radio entries use `menuitemcheckbox`/`menuitemradio` with `aria-checked`, and choosing one leaves the menu open.
  - Actions close the whole menu tree and return focus.
  - Submenus handle their own Escape and back-arrow, return focus to their trigger, choose a placement for right-to-left, and stop key presses from reaching the parent menu.
- **Runtime:**
  - `closeOnSelect` defaults to `true`, so existing ActionMenu users keep their behaviour.
  - Arrow keys, Home/End and typeahead only cover items of the current menu, not nested ones.
  - The first/last `initialFocus` uses a layout effect plus native `autofocus`, so the first key press after opening already lands on an item.
  - `preventDefault` on the trigger only applies to `type=button`, so submit and reset buttons keep their form behaviour.
  - Focus now goes back to the trigger only on Escape or an explicit close, so clicking outside no longer steals focus.
  - No new document listeners or popover engine.
- **Registry:**
  - `menu-items` is a `registry:lib` with `floating-styles`.
  - `menubar` depends on `menu-items` and `floating-styles`, and `navigation-menu` depends on `location-marker`, so everything is reachable.
  - The frozen v1 snapshot plus the reviewed additions list guard is intact.
- **Axe:** the strict axe pass ran with a menubar menu open and passed.

Non-blocking:

1. `NavigationMenuLink` has no `current` flag, so a current page reached through a disclosure is only marked visually on the summary and not announced. Consider adding `aria-current="page"` support to panel links.
2. `ActionMenuContent` sets `autofocus` on items and never removes it when the menu closes. That's harmless as things stand, but clearing it on close keeps stray attributes out of the DOM.
3. The `deno doc --lint` count of 123 is identical to the pre-slice commit, so I'm not counting it against this slice.
