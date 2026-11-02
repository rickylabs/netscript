PASS

Nothing from the reviewed work or from main was lost in the second rebase, and the legacy guarantees still hold.

- **All reviewed slices are present:**
  - All 13 reviewed components and both support items (`calendar-date`, `menu-items`) are in `registry.json`.
  - `style-utility.meta.components` maps every one of them to itself.
  - The `actions`, `forms-core` (now including `calendar`/`date-picker`) and `navigation` collections are intact.
  - Each item has its source file on disk.
  - The fixes from earlier rounds are all still in place:
    - **Calendar:** range-middle state (`calendar.tsx:341`).
    - **NavigationMenu:** the Escape guard (`navigation-menu.tsx:62-63`).
    - **ActionMenu:** the role, `closeOnSelect` and autofocus cleanup changes.
    - **Docs:** the `ACTION_MENU_ITEM_ROLES` reference entries.
- **Main's Theme B work is present:**
  - The six new presets (`ledger`, `signal`, `glass`, `macos-27`, `apple-classic`, `fluent-2-web`) are in `TOKEN_PRESETS`.
  - Each has a `registry:theme` item with `meta.preset`, `meta.netscript`, preset CSS/JSON files and DESIGN/SKILL docs, all of which exist.
  - The earlier `theme-studio-*` items are kept.
- **Overlay work in progress isn't in the tracked tree:** there are no alert-dialog, hover-card or context-menu sources and no `focusOnOpen`. Their contracts are still `shipped: false`.
- **Legacy guard (`registry-authoring.test.ts`):**
  - `legacy-v1.json` stays frozen and every baseline entry must match exactly.
  - Anything outside the baseline must exactly equal the main theme presets not already in it, plus `POST_V1_COMPONENTS` and `POST_V1_SUPPORT`. This is still an exact equality check, so an item that's missing or wasn't expected fails.
  - The four negative tests are unchanged.
  - Allowing new presets automatically is safe because the separate generated-themes test checks each one's files, dependencies, tags, CSS and preset metadata.
- **`theme-previews`:**
  - The legacy comparison now only looks at the historical preview files, so any of those missing or changed still fails.
  - The full list is still checked exactly against `PREVIEW_TOKEN_FILES` in its own test.
- **Main's other registry tests are unchanged:** the structural validation in `registry-v2.test.ts`, the legacy-manifest name check in `registry-design-sync.test.ts`, and the item-count checks in `registry-build.test.ts`.

I couldn't diff against origin/main with read-only tools. These conclusions come from the current tree. You're checking the test and quality evidence and folding in the `3d83caf` change before you push, so those results still need to land.
