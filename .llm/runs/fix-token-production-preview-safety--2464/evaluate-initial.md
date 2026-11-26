**Verdict: PASS**

I found no source defects in the three #2464 findings. I only read files; I ran no commands. The tests that passed and the negative controls are reported results that I did not re-run. The full scaffold runtime is still **UNPROVEN**.

### Findings

1. **`TOKEN_PRESET_FILE` in clean (correct).** `clean-app-tokens.ts:18` now uses the shared constant from `domain/tokens/token-config.ts:10`. The build side (`build-app-tokens.ts:32`) uses the same constant, so build and clean can no longer drift apart.

2. **Production guard (correct and substantive).** `production-theme_test.ts` takes the real `vite.config.ts` template and swaps only its imported dependencies for stubs, keeping `node:` imports. It then runs the real `defineConfig` callback in both modes.
   - It checks that `ignore` is `[]` in development, and that the production patterns match both POSIX and Windows paths for `(design)/design/tokens.tsx`.
   - It no longer hard-codes `!path.includes('(design)')` to find production routes. Production routes are now chosen by the patterns the config callback returns. The graph walk follows static and dynamic imports and still rejects `tokens.json` and any `(design)` module.
   - The reported negative controls (exclusion removed, wrong regex, direct catalog import) line up with these assertions.

3. **Preview only when installed (correct).** In `(_shared)/theme.ts.template`:
   - The `import.meta.glob('/static/presets/*.css', { query: '?url', import: 'default' })` call is lazy, so only its keys are read. Nothing loads the CSS, and there is no runtime filesystem or HTTP probe.
   - A preset is chosen only if it passes both `Object.hasOwn` checks: it is in the catalog and its stylesheet file is installed.
   - The `__proto__` and unregistered-filename cases are handled; the test matrix includes both.
   - `designTheme` stays synchronous. The fallback is `configured.id`, which keeps the configured preset, label, fonts and no `previewStylesheet`. `_app.tsx` only adds a `<link>` when `previewStylesheet` is set, so a missing optional stylesheet is never linked.
   - The glob path `/static/presets/` matches where both installers write: `tokens build --previews` (per the token lifecycle tests) and the `static/presets/*.css` targets in the `theme-previews` registry. Vite resolves the leading `/` from the app root, where `vite.config.ts` sits. The HTTP path `/presets/<id>.css` is checked against a real static server (HTTP 200 plus body content).
   - Production cannot reach the glob: the route exclusion leaves `(design)` routes out of the production graph, and the middleware returns 404 outside development before its dynamic import.
   - Type support is in place: generated apps get `types: ['vite/client']`.

4. **Real tests on both template copies.** `design-theme_test.ts` runs 6 scenarios × {authoring, shipped} through real Vite `createServer` + `ssrLoadModule`. The shipped side reads through `readTemplateAsset(TEMPLATE_KEYS.*)`; both keys exist in `manifest.ts`. Servers and temp directories are cleaned up in `finally`. The embedded copy in `embedded.generated.ts` contains the new installed-file condition.

5. **Dependency wiring (acceptable).** `packages/cli/package.json` declares `vite: "catalog:"` as a devDependency. That follows the existing per-package `package.json` pattern (e.g. `packages/fresh`), and the catalog already pins vite at 7.2.2. It is not published: `publish.include` leaves out `package.json`, and `**/*_test.ts` is excluded. The lock changes only add `packageJson` metadata for the CLI package.

### Notes (none block the PASS)

- **One carrier check unconfirmed.** `reports/validation.json` still records `assets-barrel: "pending"`. I confirmed by reading that the embedded copy has the new logic, but the check's own result should be recorded before merge.
- **Line endings.** The import-stripping regex in `production-theme_test.ts:33` needs LF endings. `.gitattributes` doesn't force LF for `*.template`, so a CRLF checkout on Windows would break the stub step and the test would error out instead of passing falsely. Adding `*.template text eol=lf`, or allowing `\r?\n` in the regex, would remove that risk.
- **Layout import check is text only.** The assertion on the design layout's helper import is a string match, not a resolved import graph. That is enough for the stated scope.
- **Limits of the Vite tests.** They use plain Vite SSR, not Fresh's Vite plugin environment, and they don't cover a stylesheet installed while the dev server is running (that depends on Vite's glob watcher). Neither is required by the scope.
- **Runtime not proven.** The canonical `scaffold.runtime` run exited 1 because the host had no healthy Aspire or Docker. Runtime is UNPROVEN, not passed, and this verdict covers source correctness only.
