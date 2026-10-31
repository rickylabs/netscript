# Slice 4 independent review

Owner-requested separate Anthropic session, claude-opus-5-5 high effort; read-only, stdin closed. Private execution identity omitted.

## Initial verdict

**FAIL_FIX**

One blocker. I checked the rest of slice 4's scope and found nothing else blocking.

**1. Ordinary builtin installs now generate CSS that forces light colours under `[data-theme='dark']`.**

- **What triggers it:** `registryCssFiles` in `packages/cli/src/kernel/application/ui/v2/registry-effects.ts:91` turns any item's `cssVars` into a generated stylesheet. That includes builtin items that already carry legacy metadata. Every foundation component depends on `theme-seed`, and `theme-seed` is the only builtin item with `cssVars` (`packages/fresh-ui/registry.json:1397`). So a plain `ui:add button` now goes through `installUiRegistry` (`packages/cli/src/public/features/ui/add/add-ui-command.ts:143`) and writes `assets/registry/theme-seed-<hash>.css`.
- **What that file contains:** `itemCss` (`registry-effects.ts:32-36`) emits:
  - the `light` values as `:root { --ns-bg: var(--ns-gray-1); --ns-fg: var(--ns-gray-12); }`
  - the `theme` values as `@theme inline { … }`. That is Tailwind-only syntax, which a Fresh UI app without Tailwind ignores.
- **Why dark mode breaks:**
  - `composeStylesAggregator` (`packages/cli/src/kernel/application/ui/registry-styles.ts:144-151`) puts per-item imports after the theme's own imports. The generated rule therefore loads after `tokens.css`.
  - In `packages/fresh-ui/registry/theme/tokens.css:241-244`, dark mode is set by `[data-theme='dark'] { --ns-bg: var(--ns-gray-12); … }`. That selector has the same specificity as `:root`, so the later rule wins.
  - Result: with `data-theme="dark"`, background and foreground switch to the light values. It applies to every app that installs a component through the new path, and the legacy installer never emitted these `cssVars`.
- **No test catches it:** neither `packages/cli/src/kernel/application/ui/v2/tests/ui-install_test.ts` nor `packages/cli/src/public/features/ui/protocol/protocol-command_test.ts` checks the generated stylesheet for a builtin theme dependency. The protocol fixture only uses a remote item with `cssVars.light`.

**Fix:** stop emitting `cssVars`, `css` or `font` CSS for builtin items whose token bytes already ship through the theme or legacy files, i.e. items with `meta.netscript`. Alternatively, drop the decorative `cssVars` from `theme-seed`; slice 1's legacy baseline doesn't compare `cssVars`. Then add a test that a default builtin install (for example `button`) writes no `assets/registry/*.css` and adds no generated import to `styles.css`.

I also checked the following and found nothing blocking:
- **`--diff`:** it writes nothing. Edited and untracked differing copies are reported and kept unless `--force` is given. A target shared with a different, non-managed copy is refused before any write.
- **Destinations:** they are resolved through aliases and checked against the app root, and a registry item can't overwrite `components.json` or `fresh-ui.lock.json`. Collisions are rejected before any write.
- **`ui:remove`:**
  - it is blocked while other items depend on the target, refuses to delete edited copies, and keeps files that another item still owns
  - it only removes `deno.json` import entries that are unchanged and no longer used by any remaining item
  - it prunes the stylesheet imports and the lock entry
- **`update`:** with no names it updates exactly the lock's items, an empty lock does nothing, and apps without a lock fall back to the legacy path.
- **Physical path checks:** `deps.paths` is passed to every real `commit()`, in `install-registry.ts:232`, `registry-lifecycle.ts:92` and `registry-queries.ts:125`.

## Repair verdict

**PASS**

The repair fixes the blocker, and I found no new blocking issues in the slice 4 scope.

- **The fix:** `packages/cli/src/kernel/application/ui/v2/registry-effects.ts:92` now skips generated CSS (`cssVars`, `css`, `font`) for any item with `meta.netscript`. Builtin items keep their shipped stylesheets and their declared imports. Remote items without `meta.netscript` still get generated CSS and automatic imports as before.
- **The regression test:** the new test in `packages/cli/src/kernel/application/ui/v2/tests/ui-install_test.ts:95` runs a real `ui:add button` install against the embedded builtin registry. That pulls in `theme-seed`, so it exercises the case that broke. It asserts:
  - no `registry-css:` copies are planned
  - no files are written under `/registry/`
  - no `./registry/` import appears in `styles.css`
  - `tokens.css` still contains the `[data-theme='dark']` block

  Together these show that nothing loads after `tokens.css` to override dark mode.
- **Rest of slice 4:** nothing changed in the areas I cleared last round:
  - `--diff` writes nothing
  - edited, untracked or shared copies are refused or reported
  - destinations are checked against the app root, and metadata files are protected
  - collisions fail before any write
  - removal reconciles the lock, `deno.json` imports and stylesheet imports
  - update follows the lock, and an empty lock does nothing
  - the symlink check runs on every real commit

I didn't run the tests myself.

## Executor gate evidence

Structured UI/client/command/startup/styles tests: 53 passed, 0 failed, 0 ignored, exit 0. Structured check/lint/format: 26 source files, exit 0. Root quality and architecture scans exit 0. The real public command fixture observes environment-backed auth and checks all stdout/stderr, lock behavior, aliased imports, read-only diff, update and removal.
