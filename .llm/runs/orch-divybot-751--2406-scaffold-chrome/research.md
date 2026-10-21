# Research — #2406 items 1 + 4 (scaffold chrome, ui:add page nav, netscript-build skill)

Re-baselined against `main` `a833dfa` (0.0.8 cut). The orchid worktree started on `6f6cbdf`
(2026-10-01), 11 days stale; it was reset to `origin/main` before any read used here.

## Findings

1. **Allowlist chrome.** `packages/cli/src/kernel/assets/app/routes/_layout.tsx.template` computes
   `showScaffoldChrome = pathname === home || pathname === dashboard || startsWith(examples)`. Any
   other path renders `<Partial name='page'><Component /></Partial>` with no top bar — including
   `/health`, which the top bar itself links to, and every `ui:add page` output.
2. **Why `/design` must stay out.** `routes/(design)/design/_layout.tsx` renders its own
   `SidebarShell` with brand, breadcrumb and `ThemeToggle`; Fresh nests layouts, so the root top
   bar would stack above it. It is the only legitimate chrome opt-out in the scaffold.
3. **Partial navigation.** `_app.tsx` sets `f-client-nav` on `<body>`; both branches of the root
   layout wrap content in `<Partial name='page'>`. Any redesign must keep one `page` partial around
   every page so client navigation swaps chrome and content together.
4. **Partial routes skip layouts already.** `definePartial` sets `skipInheritedLayouts` and
   `skipAppWrapper` (`packages/fresh/src/application/builders/define-partial.tsx`), so making the
   chrome default cannot leak a top bar into `routes/partials/**` responses.
5. **`ui:add page`** (`kernel/application/ui/web-scaffold.ts`) writes `routes/<path>/index.tsx`
   whose only layer is `() => <main><h1>Name</h1></main>` (no `ns-shell`, no `PageHeader`), and
   string-inserts `'<id>': createRouteReference('/<path>', …)` into `router.ts`'s `appRoutes`. It
   prints `Generated <role>: <path>` lines only — no hint about chrome, nav or theme.
6. **`ui:remove page`** (`remove-ui-page.ts`) regenerates the scaffold with `force+dryRun`, proves
   each non-registration file is unchanged (after fmt normalization), deletes them and reconciles
   `router.ts` via `removeScaffoldedAppRoute`. A new registration role must be filtered the same
   way and reconciled on removal.
7. **Scaffold content pages** (`home-view`, `dashboard-view`, `examples-view`) all open with
   `<main class='ns-shell ns-section ns-stack ns-stack--lg'><PageHeader>…`. That is the house page
   rhythm a generated page should start from.
8. **Generated output must survive the generated project's `deno fmt --check`** (`lineWidth 100`,
   `singleQuote`, semicolons — `kernel/templates/workspace/deno-json.ts`). `scaffold.runtime` runs
   `ui:add page data-screen --island --client users --app <app>`
   (`e2e/src/application/gates/scaffold/ui-data-screen-gates.ts`) and then type/fmt-checks.
9. **Cliffy 1.3.1** parses `--nav [label:string]` + `--no-nav` into
   `undefined | true | string | false` (probe in this session).
10. **`netscript-build` skill is stale.** `skills/netscript-build/SKILL.md` says there is no
    `netscript generate routes` and no `netscript ui:remove page`; 0.0.8 ships both
    (`public/features/generate/routes/generate-routes-command.ts`,
    `public/features/ui/remove/remove-ui-command.ts`). It also never mentions chrome or theming.
11. **`assets/styles.css` custom tail is clobbered.** `writeStylesAggregator`
    (`kernel/application/ui/registry-styles.ts`) recomposes `styles.css` from the registry theme's
    base on every `ui:add <registry item>`, preserving only extra `@import` lines; the aggregator
    ends with `/* App-specific custom styles below. */`, inviting edits that the next `ui:add`
    deletes. Any "make one theme apply app-wide" recipe that edits `styles.css` is unsafe until
    that tail survives.
12. **No named-theme machinery exists.** `data-ns-theme`, `assets/themes/*.css` and
    `html:has([data-ns-theme=…])` have zero hits in the repository; the registry ships one
    `kind: 'theme'` item (`theme-seed`, NS One). The benchmark agents invented per-page theme
    scoping because the docs did not describe the real chain. (Docs fix is #752's half.)

## jsr-audit surface scan

No package export changes. `UI_DATA_SCREEN_FILE_ROLES` is exported from a public feature module
but not from `packages/cli/mod.ts`; the new role is additive. Generated app source is consumer
code, not published surface.

## Open questions (closed)

- Nav by default? → top-level pages yes, nested pages no; `--nav [label]` / `--no-nav` override.
- Where does nav data live? → new app-owned `navigation.ts` beside `router.ts`, so the CLI edits
  a data module instead of a hand-styled layout.
