**Verdict: FAIL_FIX.** The source logic is correct and compatible. The only blocker is that two edited templates now produce generated files that fail `deno fmt --check`, which a new app's `deno task check` runs. Both fixes are mechanical.

I reviewed the working tree as it stood at the end of the review. It changed while I was reading: the layout filter moved from `config.mode` to `import.meta.env.MODE`, and `layouts.css` plus `registry.generated.ts` were added. Those later changes are included.

## Blockers

1. **`_layout.tsx.template` line 34 is longer than 100 characters.** The new `appNavigation.filter(... import.meta.env.MODE === 'development').map(...)` line is not in `deno fmt` form. The generated app's deno.json uses a line width of 100 and its `check` task starts with `deno fmt --check .`, so a fresh app's `deno task check` now fails on `routes/_layout.tsx`. Before this change the template was clean (I checked). Fix it by writing the line the way `deno fmt` does:
   ```tsx
   {appNavigation.filter((item) =>
     !item.developmentOnly || import.meta.env.MODE === 'development'
   ).map((item) => (
   ```
   Or move the filter into a `const visibleNavigation = …` above the JSX.

2. **`resource-slice/(_islands)/ResourceIsland.tsx.template` has two blank lines** between the end of `…Data()` and the `/** Replace this generic field view… */` comment. `deno fmt --check` rejects it, so every generated resource slice fails the check. Before this change the template was clean. Remove one blank line. Better still, emit `QUERY_RESULT_TEMPLATE` from `query-result-template.ts` so the two copies of `QueryResult` can't drift; right now the resource template has its own hand copy.

Add a canonical-form check for these two templates, like the one `web-scaffold_test.ts` already has for generated pages. That keeps this from regressing.

## What checked out

- **New apps get Studio Utility.** `UI_DEFAULT_THEME = 'theme-studio-utility'` goes through the legacy installer, where `resolveRegistryItems` swaps the official theme for it. Every theme item writes `assets/theme-preset.json`, and `_app.tsx` reads it to set `data-theme`/`data-flavor`.
- **Existing apps keep their preset.** `ui:init` with no theme only picks Utility when `components.json`, `tokens.config.json` and `assets/theme-preset.json` are all missing. Any app set up through a theme item already has `theme-preset.json`. An explicit `--theme` still wins, `--preset` still rejects being combined with `--theme`, and `tokens init`/`tokens build` are unchanged, as the plan locked.
- **Query data rendering.** The JSON dump is replaced by a recursive `QueryResult` view (`ol`/`dl`, empty, scalar and boolean cases, `overflow-wrap:anywhere`), with `role='status'`/`role='alert'` for loading and error. Data islands that receive initial data skip the loading branch, so behaviour is the same. The `VNode` type import resolves from the app's `preact` mapping.
- **Counter island.** It now uses the registry `Button` with `type='button'`, which matches `ButtonElementType`. Another island template (`FloatingSurfaceDemo`) already imports from `@app/components/ui/mod.ts`.
- **Design link.** Switching to `import.meta.env.MODE` is right. It is the same Vite `mode` that decides whether the `(design)` routes are built, and the drift note records that Fresh's `config.mode` stays `production` under Vite dev. The `/// <reference types="vite/client" />` line comes before the imports.
- **Health page.** It now uses `<main>`, `min-w-0`/`w-full`/`max-w-full overflow-hidden`, and no rounded corner. No `<main>` is nested, because the layout wraps pages without one.
- **Generated carriers are fresh.** The four CLI templates match `embedded.generated.ts` byte for byte. Decoding `registry.generated.ts` shows the new topbar rule. `registry:embed:check` passed.
- **Tests: 60 passed, 0 failed.** That covers `web-scaffold_test` (including its fmt-canonical test), `apply-ui-command_test`, `ui-lifecycle_test`, `app-tokens_test`, `tokens-group_test`, `write-app-files_test`, `generate-resource_test`, `reconcile-resource-slice_test` and `app-navigation_test`.

## Should fix (not blocking)

- **NS One topbar height changes.** In shared `layouts.css`, `.ns-topbar` goes from `height: 52px` to `min-height: var(--ns-topbar-h)`. NS One sets that to 3.5rem, so legacy apps get a 56px topbar. The plan says NS One styling is preserved. Either keep 52px as the legacy minimum or show in the browser evidence that legacy apps are unaffected. The drift note does record moving this file from S4 into S1.
- **No test for the "existing apps keep their preset" rule.** The code keeps it by construction, but add one case: `ui:init` on an app with an existing `assets/theme-preset.json` (NS One) still reports `ns-one`.
- **Stale help text.** `--theme` still says "(defaults to the official theme)"; it should mention Utility for unconfigured apps.
- **`--registry-root` path is inconsistent.** `ui:init --registry-root` on an unconfigured app still installs the official theme. It's a maintainer override, but either apply the same default or document it.
- **Existing fmt failure in `health-view.tsx.template`.** Line 12 (the JSX text wrap) already failed `deno fmt` before this change. S1 edits this file, so it's a cheap fix to make while here.
- **Nested arrays repeat labels.** Each nested list repeats `aria-label='Records'` and its own `role='status'` empty state. That's acceptable for a placeholder view the app is meant to replace.

## Not proven here

- I couldn't run the `scaffold.runtime` suite, which type-checks generated apps, because Docker is unavailable. So it's unconfirmed that `deno check` resolves `vite/client` types in a generated app; the app's import map does map `vite` to npm.
- Browser evidence for 390/1280 widths, the production/development Design link and the health bounding box is still in progress. I didn't attempt it.
