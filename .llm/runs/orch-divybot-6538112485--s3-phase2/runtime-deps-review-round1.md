FAIL_FIX (slice 7c0: runtime dependency metadata)

**Blocker: `render-ui` doesn't import Fresh UI, so the frozen legacy check now has an unjustified exception.**

- **What the copied file actually imports:** `render-ui` copies only `packages/fresh-ui/src/ai/render-ui.tsx`. That file's real imports are `preact` (line 6) and `@netscript/ai/tools` (lines 7-8). It doesn't import `@netscript/fresh-ui` anywhere.
- **Where the false positive comes from:** the only mentions are JSDoc examples (lines 110 and 141, `from "@netscript/fresh-ui/ai/render-ui"`). The scanner's `runtimeImport` pattern in `tests/registry/runtime-dependencies.test.ts:20` matches `from "…"` anywhere in the text, comments included, so it counts `render-ui` as a runtime user.
- **What that caused:**
  - **Unneeded dependency:** `registry.json` now gives `render-ui` the dependency `jsr:@netscript/fresh-ui@0.0.8` (lines 3909-3913), so every consumer that installs `render-ui` gets an import mapping its copied source never uses.
  - **Unjustified exception:** `LEGACY_RUNTIME_DEPENDENCY_REPAIRS` (`tests/registry/post-v1-items.ts:32`) lets this one historical item differ from frozen `legacy-v1.json`. That list is the only way past the frozen check, and its own description is "Existing copies missing only their actual package runtime dependency."
  - **One-directional check:** the test only checks that detected users declare the dependency, never that items declaring it really use it. So the scanner can't catch this.
  - **Wrong count:** "Eight registry items import Fresh UI" is really seven: command-palette, date-picker, menu-items, menubar, alert-dialog, hover-card and context-menu.
- **Required fix:**
  1. Remove `render-ui` from `LEGACY_RUNTIME_DEPENDENCY_REPAIRS` and restore its dependencies exactly as in `legacy-v1.json` (`jsr:@netscript/ai@0.0.8`, `npm:preact@^10.29.2`). Then regenerate the carriers.
  2. Make the scanner look at real imports only. Either remove block and line comments before matching, or match import declarations at the start of a line (`^\s*import\b[^;]*?\bfrom\s*['"]@netscript\/fresh-ui…` plus `^\s*export\b…from`, and dynamic `import(`).
  3. Check in both directions: every item whose copied TS/TSX actually imports the runtime must declare `FRESH_UI_RUNTIME_DEPENDENCY`, and every item declaring it must actually import it.
  4. Add negative tests: a source that only mentions the package in a comment is not a user, and an item that declares the dependency without using it fails.
  5. Rerun the authoring, runtime-dependency and gaps-install tests.

The rest of the change is sound:

- **Real users:** the seven components that really import Fresh UI each declare `jsr:@netscript/fresh-ui@<FRESH_UI_PACKAGE_VERSION>`, and the release-version check still covers them.
- **The command-palette repair is justified:** its source imports `Combobox` and `Dialog` from `@netscript/fresh-ui/interactive`. The repair only adds the root dependency, and the negative test for dropping it is in place.
- **Legacy guard:** `legacy-v1.json` itself is untouched, every other baseline field still has to match exactly, and the other negative tests remain.
- **`gaps-install.test.ts`:** it now starts the consumer with no Fresh UI aliases, installs through the real `ui:add`, checks that the installer adds the root mapping, and only then adds local subpath aliases so current unpublished source compiles. That's a real proof the dependency gets installed.

Outside this slice's scope, for awareness: `registry/islands/DesktopOnly.tsx` and `desktop-update-prompt.tsx` import `@netscript/sdk/*`. Once the scanner handles real imports, the same two-way check could cover other `@netscript/*` packages later.
