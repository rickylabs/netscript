PASS

Both symbols that failed `docs:exports-drift` are now documented, and the ActionMenu behavior paragraph is accurate against the source.

- **Inventory coverage:** `ACTION_MENU_ITEM_ROLES` and `ActionMenuItemRole` are exported from `interactive.ts` (lines 24 and 28) and now appear in two places in `docs/site/reference/fresh-ui/index.md`:
  - the behavior paragraph (lines 284-285);
  - the Action menu inventory row (line 299), alongside every other exported ActionMenu symbol.
- **Each claim in the paragraph matches the source:**
  - **Roles:** `menuitem`, `menuitemcheckbox` and `menuitemradio` are exactly `ACTION_MENU_ITEM_ROLES` in `action-menu.types.ts:14`.
  - **Checked state:** "Caller-owned `aria-checked`" holds because `ActionMenuItem` passes caller props straight through and the role doc says choice state stays with the caller (`action-menu.types.ts:75-76`).
  - **`closeOnSelect={false}` keeps the menu open:** it's documented to default to `true` (`action-menu.types.ts:77-78`), and `ActionMenuItem` only closes when it's set.
  - **`initialFocus`:** first or last entry for ArrowDown/ArrowUp matches `ActionMenuContentProps.initialFocus` (`action-menu.types.ts:60-61`).
  - **Focus on close:** "Escape and explicit close restore trigger focus; outside dismissal preserves the destination focus" matches `usePopover`. It only restores focus for the `escape-key` and `close-button` reasons, and item activation closes with `close-button`.

The paragraph adds no new code fence, and it doesn't touch gates, source behavior or exports. The snippet, full-site, link and caveat checks you have in flight, plus the regenerated prose, corpus and publication carriers, still need to pass before you push.
