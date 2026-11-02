FAIL_FIX

**Blocker: the legacy-compatibility test will fail at head e70209f.**

- **The test:** `packages/fresh-ui/tests/registry-authoring.test.ts:8-19` ("JSON authoring preserves every legacy file target…") builds a name → {kind, files, dependencies, CSS, tags} map from the whole compatibility projection. It then checks that map is **exactly equal** to the frozen baseline `tests/registry/legacy-v1.json`.
- **Why it now differs:** `legacyRegistryManifest` (`src/registry/legacy-registry.ts:58-61`) projects every `registry.json` item that has `meta.netscript`. All 7 new items have it, so the projection now contains `button-group`, `toggle`, `toggle-group`, `radio-group`, `input-group`, `input-otp` and `slider`. None of those keys are in `legacy-v1.json`, so the exact-equality check fails. Your focused registry run should show it.
- **Required fix:** keep the protection that existing items can't change silently, while letting new items in on purpose. Either:
  - **Preferred:** keep `legacy-v1.json` as the frozen v1 baseline. Change the test so every baseline item must still appear in the projection unchanged, and every item outside the baseline must be on an explicit list of post-v1 additions, currently exactly these 7. That way a missing, changed or unexpected item still fails.
  - Or update `legacy-v1.json` with the 7 projected entries in a reviewed commit, and note that the file is the current compatibility snapshot, not a frozen v1 one.
  - Then rerun the fresh-ui registry tests, the asset-barrel freshness check and the install test at the new head.

The rest of the conflict resolution is correct against the current registry README:

- **`registry.json` is the authoring source.** Each new item has a `registry:component` TSX file and a `registry:file` CSS file with the same targets as before (`@ui/…`, `@assets/ui/…`). `meta.netscript` carries kind, layer, copy ownership, tags and the CSS import.
- **Dependencies resolve.** `theme-seed`, `cn`, `button` and `toggle` all exist as items.
- **Style and collections:** `style-utility.meta.components` maps all 7 to themselves. The Forms items are appended to `forms-core`, and the new `actions` collection holds the action items.
- **Compatibility manifest:** `registry.manifest.ts` is unchanged on main; it only projects `registry.json`, so the hand-written manifest edits from before the rebase are rightly gone.
- **CLI carrier:** the design registry template lists all 7. For the compressed registry asset, rely on `check:assets-barrel`/`registry:embed:check` passing.
- **S2 surfaces:** the S2 installer, schema, theme documents and existing items are untouched.

Non-blocking:

1. `tests/registry/gaps-install.test.ts` picks its items with `kind === 'component' && tags.includes('contract')` and never checks the result. If the projection ever dropped those tags, the test could pass while checking nothing. Assert the expected item names, or at least a non-empty list matching the contract's shipped gap items.
2. Every other collection starts with `theme-seed` and `actions` doesn't. Each item already depends on `theme-seed`, so this only affects consistency.

The force-with-lease push for this repair is the user's explicit decision, so I've left it alone.