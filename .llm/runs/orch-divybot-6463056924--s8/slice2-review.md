# Slice 2 review — initial

**Verdict: FAIL_FIX** (one blocker)

### B1. On reference pages at 960px and below, the mobile TOC bar covers the section nav
- `toc.js` shows the mobile "On this page" bar on every page with at least two headings, including reference pages (`docs/site/assets/docs/toc.js:31`). On reference pages it also shows the section nav (`toc.js:32-37`).
- At 960px and below, both stick to the same spot under the top bar:
  - the mobile TOC bar: `position: sticky; top: var(--docs-topbar-height); z-index: 20` (`docs/site/styles/docs.css:827-831`);
  - the section nav: `position: sticky; top: var(--docs-topbar-height); z-index: 10` (`docs.css:567-570`). The mobile media block only resets its `margin-top` (`docs.css:862-864`).
- Both sit inside `.docs-main` (`docs/site/_includes/layouts/base.vto:82,93`). Once the page scrolls, the 48px TOC bar fully covers the 44px section nav, which then can't be seen or tapped. A keyboard user can tab to section links that stay completely hidden, which fails WCAG 2.4.11 (focus not obscured). axe won't catch this, and your 390px smoke run doesn't seem to have covered a reference page in a scrolled state.
- **Required fix (pick one):**
  - don't show the mobile TOC on `reference` pages, since the section nav already does that job there; or
  - stack the two bars, with the section nav at `top: calc(var(--docs-topbar-height) + 48px)`, and raise `scroll-padding-top` to match.

  Then add one 390px browser check on `/cli-reference/`: scroll down, focus a section link, and assert it isn't covered.

### Checked
- **Six-lane top bar:** lanes come from `navLanes`, with Design system added (`docs/site/_data.ts:59-124`). Only the active lane gets `aria-current`, and none does on the home page (`base.vto:34-38`). The lane is chosen from the page URL before base-path rewriting (`_data.ts:127-132`, `docs/site/_config.ts:15,93`).
- **Sidebar shows only the active lane:** it renders just that lane's tree, reusing the existing `menu-item.vto` recursion (`base.vto:57-78`). Branches on the current path open automatically, and the marker follows `aria-current` (`docs.css:271-287`).
- **Layouts:**
  - Home has no sidebar and no TOC (`docs.css:669-692`).
  - Articles get a 544px text measure, a 720px wide column and a 240px TOC rail that sticks 112px from the top (`docs.css:376-387,512-517`).
  - Reference pages are 960px wide with a sticky 44px section nav and no rail (`docs.css:567-578,693-701`).
  - Below 1240px the TOC turns into the disclosure; at 960px and below the drawer button appears.
- **Drawer:** it's a native `<dialog>` opened with `showModal()`, so focus trapping, Escape and focus return are handled by the browser. The trigger's `aria-expanded` resets on any close, and clicking the backdrop closes it. The nav is moved into the drawer at 960px and below and back again on resize, closing the drawer if it's open (`shell.js:30-54`). Without JavaScript the sidebar stays inline as an open `<details>` (`docs.css:768-786`).
- **Scheme:** the saved `ns-theme` choice wins. Without one, the page follows the system setting live, and storage errors are caught (`base.vto:14-23`, `shell.js:1-28`).
- **Tokens and selectors:** every `--ns-*` variable used in `docs.css` and `components.css` is defined in `tokens.css`. No `[data-theme="light|dark"]` selectors remain anywhere in the owned site files. The only hit is in `_plan/samples`, which Lume ignores because the folder starts with `_`.
- **Component APIs:**
  - The component templates and their arguments are unchanged.
  - Tabs still show every panel without JavaScript and hide the tab list (`components.css:2-10`).
  - Arrow, Home and End keys work.
  - The `ns-runtime` key and runtime group syncing are kept (`tabs.js:3-91`).
  - The comparison picker and copy buttons work as before.
- **The `/design-system/` link failure:** I agree it's an external dependency on sibling PR #2437, not missing shell work. It does block merge: the full link check has to pass once #2437 is on `main` and this branch is rebased, with no exemption.

### Not blocking
1. Inside the drawer, the nav is still capped at `max-height: 60vh` by the mobile rule (`docs.css:772`), so it scrolls inside a full-height drawer. Add `max-height: none` to the `.docs-drawer .docs-sidebar` rule.
2. On mobile article pages, the top bar (56px) plus the TOC bar (48px) is 104px. That's more than `scroll-padding-top: 100px` (`docs.css:20`), so headings you jump to land 4px under the bar.
3. The breadcrumb works out its lane separately, so on `/cli-reference/` it says Start while the top bar and eyebrow say Reference (`docs/site/_components/breadcrumb.vto:9-20` vs `_data.ts:128`). Have it call `getDocsLane` in slice 3.
4. The search trigger is a link to the fallback search section but says `aria-haspopup="dialog"` (`base.vto:39`). That's only true once slice 4 adds the search dialog.
