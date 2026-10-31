# Slice 2 repair review

**Verdict: PASS** (slice 2 repair)

I found no blockers.

### Repairs confirmed
- **Overlapping bars:** `toc.js` no longer unhides the mobile TOC on reference pages (`docs/site/assets/docs/toc.js:31`). Those pages now show only the sticky section nav (`toc.js:32-37`), so only one bar sticks under the top bar at 960px and below. This also holds between 961px and 1240px.
- **Scroll padding:**
  - On mobile it's now `scroll-padding-top: 120px` (`docs/site/styles/docs.css:916-920`).
  - That clears the 56px top bar plus the 48px TOC bar on articles (104px).
  - It also clears the 56px top bar plus the 44px section nav on reference pages (100px).
- **Drawer height:** `.docs-drawer .docs-sidebar { max-height: none }` (`docs.css:913-915`) is more specific than the mobile `.docs-sidebar` cap (`docs.css:772`), so it wins.
- **Links nested inside sidebar toggles:** the `<summary>` now holds only the chevron and a text label, and navigation moved to a separate "Overview" link in the children (`docs/site/_includes/nav/menu-item.vto:7-12`). The branch still opens on the active path (`menu-item.vto:6`). The open branch's label is medium weight in the main text colour, and hover gets a background (`docs.css:893-911`). Leaf items keep the `aria-current` marker (`menu-item.vto:19`).
- **Sidebar heading:** it's now inside the labelled tree nav (`docs/site/_includes/layouts/base.vto:57-58`).
- **Duplicate pager:** the layout skips `comp.nextPrev` when the page already contains `<nav class="ns-nextprev"` (`base.vto:104`). That string matches the component's markup exactly (`docs/site/_components/nextPrev.vto:25`).

### Not blocking
1. Some old CSS no longer matches anything because links have left the summary: `.ns-nav-branch__summary a`, its `::before` rule, and `.ns-nav-branch[open] > summary a` (`docs.css:305-311,321-324`). It's harmless and can be removed in slice 3.
2. The pager check depends on that exact `<nav class="ns-nextprev"` string. If slice 3 changes the component's markup, update the check at the same time.
3. The search trigger still claims `aria-haspopup="dialog"` before the dialog exists (`base.vto:39`), as noted last round. Slice 4 fixes this.
4. The `/design-system/` link still depends on sibling PR #2437. The full link check has to pass on the rebased branch before merge.
