# Slice 15 Browser And Scaffold Report

## Scope

Slice 15 rebuilt the generated app pages on the copied `@netscript/fresh-ui` registry vocabulary:

- `/`
- `/dashboard`
- `/examples`
- `/examples/crud`
- shared scaffold chrome
- `/design/{tokens,components,composition}` route structure correction

The design routes now use NetScript Fresh page-builder seams and route-scoped folders:

- `routes/(design)/design/{tokens,components,composition}.tsx`
- `routes/(design)/design/(_components)/*-view.tsx`
- `routes/(design)/design/(_islands)/*`
- `routes/(design)/design/(_shared)/*`

## Generated App Proof

Command:

```powershell
deno run -A packages/cli/bin/netscript-dev.ts init slice15-pages --path .llm/tmp/scaffold-smoke-slice15 --db none --ci --yes --no-git --force --no-aspire
deno check --unstable-kv apps/dashboard
```

Result:

- Scaffold created 110 files / 23 directories.
- `deno check --unstable-kv apps/dashboard` passed from the generated app root.
- Generated app contains the scoped design route folders and no app-global `lib/design` copy.
- App-page surface scan found no raw utility class patterns on `/`, `/dashboard`, `/examples`,
  `/examples/crud`, or shared scaffold chrome templates.

## Browser Evidence

Generated app served at `http://127.0.0.1:8025`.

Routes loaded with expected titles and zero console errors:

- `/dashboard` -> `slice15-pages -- dashboard`
- `/examples/crud` -> `slice15-pages -- CRUD example`
- `/design/tokens` -> `Design tokens -- NetScript design system`
- `/design/components` -> `Components -- NetScript design system`
- `/design/composition` -> `Composition rules -- NetScript design system`

Mobile viewport `390x844` evidence:

- `slice15-dashboard-mobile-390x844.png`
- `slice15-crud-mobile-390x844.png`
- `slice15-design-tokens-mobile-390x844.png`
- `slice15-design-components-mobile-390x844.png`
- `slice15-design-composition-mobile-390x844.png`
- snapshots show active content constrained within the 390px viewport; the design sidebar is
  intentionally off-canvas on mobile.

Theme evidence:

- `slice15-design-composition-mobile-light-before-theme.png`
- The user manually verified the theme flip and route rendering after the MCP click-capable browser
  namespace was blocked by an existing profile lock.

## Gate Results

- Focused CLI type check: PASS.
- Focused CLI tests: PASS, 3 tests / 32 BDD steps.
- Generated app `deno check --unstable-kv apps/dashboard`: PASS.
- Fresh-ui `deno task check`: PASS.
- Fresh-ui `deno task test`: PASS, 39 tests.
- Fresh-ui `deno task tokens:check`: PASS.
- `check-ds-no-raw-hex.ts`: PASS, 95 files clean.
- `check-ds-color-utilities.ts`: PASS, 95 files clean.
- `deno task arch:check`: PASS with existing `registry.manifest.ts` size warning.

