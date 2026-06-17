# `@netscript/fresh-ui`

[![JSR](https://jsr.io/badges/@netscript/fresh-ui)](https://jsr.io/@netscript/fresh-ui)
[![Deno](https://img.shields.io/badge/runtime-Deno-000000?logo=deno&logoColor=white)](https://deno.com/)
[![Fresh](https://img.shields.io/badge/framework-Fresh-ffdb1e?logo=deno&logoColor=111111)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](https://opensource.org/licenses/MIT)

The NetScript design system for Fresh: a theme-driven token vocabulary, a copy-source component
registry, and a small package-owned runtime of accessible interactive primitives.

It follows the shadcn model adapted to Deno + Fresh: **you own the components** (they are copied
into your app), while accessibility behavior and the token contract stay package-owned and update
with releases.

## Package role

`@netscript/fresh-ui` is an **Archetype 4 (DSL/Builder)** package with **Archetype 3 runtime
behavior folded in** (see [`docs/architecture.md`](docs/architecture.md)). Its primary product is a
design-system DSL — the semantic `--ns-*` token vocabulary plus the copy-source component registry —
and it also owns a small imported runtime of accessible interactive primitives. The public import
surface is curated through `mod.ts`, `interactive.ts`, and `primitives.tsx`; `src/` holds the
role-named implementation (`src/runtime/`, `src/presentation/`), and `registry/` is the copy-source
payload consumers own after `ui:add`.

## The three pillars

1. **Themes** — A theme is a complete set of semantic `--ns-*` CSS variables (light + dark)
   generated from a DTCG token source. **NS One** is the first theme that ships with the package; it
   is an instance, not the system. Components never reference a specific theme — they consume only
   the semantic vocabulary, so swapping themes restyles every component.
2. **Registry** — `fresh-ui-foundation` (manifest schema v2): 44 copy-source items — 18 L2
   components, 11 L3 blocks, 3 islands, 7 style sheets, 2 libs, 2 support modules, and the theme
   seed. Installed with the NetScript CLI; once copied, the code is yours.
3. **Runtime** — Package-owned, imported (not copied): seven interactive compound components
   (Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip), L0 primitives (`Show`,
   `VisuallyHidden`, `SrOnly`), and stable helpers (`cn()`, URL toast state).

## Layer model

Every item in this package has a layer. The layer decides who owns it and what it may import.

| Layer | What                                                                      | Delivery | May import                    |
| ----- | ------------------------------------------------------------------------- | -------- | ----------------------------- |
| L0    | Platform contract: token vocabulary, attribute rules, behavior primitives | imported | platform only                 |
| L1    | Runtime behavior: hooks and interactive compound components               | imported | L0                            |
| L2    | Registry components (button, input, card, …)                              | copied   | L0, L1 — **never another L2** |
| L3    | Registry blocks (data-table, sidebar-shell, …)                            | copied   | L0–L2                         |
| L4    | Your application                                                          | yours    | everything                    |

Shared behavior moves **down** to L0/L1; shared composition moves **up** to L3. The full contract is
in [`docs/l0-conventions.md`](docs/l0-conventions.md).

## Install

The NetScript CLI is the supported installation path. It copies registry sources, resolves registry
dependencies, rewrites relative imports for your project layout, creates the styles aggregator, and
merges `deno.json` imports:

```sh
netscript ui:init --project-root ./my-app      # theme seed + foundation
netscript ui:add button --project-root ./my-app
netscript ui:add forms-core --project-root ./my-app   # collections work too
```

Collections: `foundation`, `forms-core`, `surface-core`, `feedback-core`, `layout-foundations`,
`dashboard-blocks`.

For the imported runtime, add the package to your `deno.json`:

```jsonc
{
  "imports": {
    "@netscript/fresh-ui": "jsr:@netscript/fresh-ui@^0.1"
  }
}
```

Manual copying also works — the registry source ships in the published package under `registry/`;
copy files and fix up the relative imports (island copies typically change `../lib/` depth).

## Entry points

| Import                            | Layer | Purpose                                                              |
| --------------------------------- | ----- | -------------------------------------------------------------------- |
| `@netscript/fresh-ui`             | —     | Stable helpers: `cn()`, `withToast`, `getToast`, `stripToastFromUrl` |
| `@netscript/fresh-ui/interactive` | L1    | Accordion, Dialog, Drawer, Popover, Sheet, Tabs, Tooltip             |
| `@netscript/fresh-ui/primitives`  | L0    | `Show`, `VisuallyHidden`, `SrOnly`                                   |

## Quick start

```tsx
import { cn, getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';
import { Dialog } from '@netscript/fresh-ui/interactive';
import { Show, VisuallyHidden } from '@netscript/fresh-ui/primitives';

const deployButtonClass = cn('ns-button', 'ns-button--primary');

const redirectTo = withToast('/dashboard/deployments', {
  type: 'success',
  title: 'Deployment queued',
  message: 'api-gateway will roll out to three regions.',
});

const toast = getToast(new URL(`https://app.example${redirectTo}`));
const cleanPath = stripToastFromUrl(new URL(`https://app.example${redirectTo}`));

export function ConfirmDeployDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger class={deployButtonClass}>Deploy</Dialog.Trigger>
      <Dialog.Content aria-label='Confirm deployment'>
        <Dialog.Title>Deploy api-gateway?</Dialog.Title>
        <Dialog.Description>
          {toast?.message ?? 'The deployment will use the selected region plan.'}
        </Dialog.Description>
        <Show when={cleanPath === '/dashboard/deployments'}>
          <VisuallyHidden>Redirect path is clean</VisuallyHidden>
        </Show>
        <Dialog.Close>Cancel</Dialog.Close>
        <button type='submit'>Confirm</button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
```

Runtime components emit `data-part`, `data-state`, and ARIA attributes — never `ns-*` classes.
Styling comes from the copied registry CSS, which targets those attributes and the `--ns-*`
vocabulary.

## Theme contract

Components are theme-blind. The rules that make that work:

- Component CSS consumes **only** semantic `--ns-*` variables (and `color-mix()` over them). Raw hex
  / `rgb()` / `oklch()` literals are forbidden outside generated theme artifacts and are enforced by
  fitness gates in CI.
- Markup uses only the `*-ns-*` Tailwind utilities produced by the theme bridge — never stock
  palette utilities (`bg-red-500`, `text-white`) or arbitrary color values.
- Primitive color **ramps** (`--ns-gray-1..12`, etc.) are theme raw material: themes map ramps onto
  semantic slots; components do not read ramps directly (documented exceptions carry an allow
  marker).
- Looping animations honor `prefers-reduced-motion`: infinite loops become static treatments,
  essential spinners slow down, sub-250ms one-shot enter/exit animations collapse to their end
  state.

Theme artifacts are generated from a DTCG source with Style Dictionary v5
(`deno task tokens:build`): `registry/theme/tokens.css` (light + dark variable blocks),
`registry/theme/theme-bridge.css` (Tailwind v4 `@theme inline` bridge),
`registry/theme/tokens.json`, and `registry/theme/styles.css` (aggregator). To author a new theme,
see [`docs/theme-authoring.md`](docs/theme-authoring.md).

## Registry catalog

`fresh-ui-foundation` v0.1.0 — copy-source, schema v2.

**Components (L2)** — `button`, `icon-button`, `input`, `textarea`, `checkbox`, `switch`, `label`,
`select`, `form-field`, `card`, `panel`, `badge`, `separator`, `alert`, `inline-notice`, `spinner`,
`progress`, `skeleton`.

**Blocks (L3)** — `breadcrumb`, `sidebar-shell`, `page-header`, `filter-form`, `stats-grid`,
`detail-layout`, `data-table`, `responsive-table`, `pagination`, `empty-state`, `section-divider`.

**Islands** — `theme-toggle` (L2), `sidebar-toggle` (L3), `toast` (L2).

**Styles (L2)** — `form-control-styles`, `choice-styles`, `surface-styles`, `sheet-styles`,
`floating-styles`, `alert-styles`, `layout-objects` (stack / cluster / grid / split / toolbar /
switcher composition objects).

**Lib & support** — `cn`, `public-types`, `control-props`, `toast-support`.

**Theme** — `theme-seed` (the NS One artifacts above).

## Helpers

URL-encoded toast state that survives redirects:

```ts
import { getToast, stripToastFromUrl, withToast } from '@netscript/fresh-ui';

const redirectTo = withToast('/dashboard/users', {
  type: 'success',
  title: 'User saved',
  message: 'Your changes were persisted.',
});
const toast = getToast(new URL(request.url));
const cleanUrl = stripToastFromUrl(new URL(request.url));
```

Class merging with conflict resolution (clsx + tailwind-merge):

```ts
import { cn } from '@netscript/fresh-ui';

const klass = cn('ns-button', isQuiet && 'ns-button--ghost', props.class);
```

## Living reference

A consuming app should expose the design system on real routes (the NetScript playground ships these
under `/design`):

- `/design/tokens` — the full semantic vocabulary, live against the active theme;
- `/design/components` — every registry component in every variant/state;
- `/design/composition` — the layer model, layout objects, and do/don't rules.

These routes double as the browser validation surface: theme flip, reduced motion, and 390px
viewport checks run against them.

## Validation

From the package directory:

```sh
deno task check    # type-check (no-slow-types-safe public surface)
deno task test     # unit tests + consumer-shaped JSX render fixture
deno task tokens:build
```

Design-system fitness gates (run from the workspace root in CI):

```sh
deno run --allow-read .llm/tools/fitness/check-ds-no-raw-hex.ts
deno run --allow-read .llm/tools/fitness/check-ds-color-utilities.ts
```

## Docs

- [`docs/getting-started.md`](docs/getting-started.md) — install flow and doctested runtime helper
  example
- [`docs/concepts.md`](docs/concepts.md) — themes, registry ownership, runtime, and validation
- [`docs/architecture.md`](docs/architecture.md) — ADRs and package architecture decisions
- [`docs/l0-conventions.md`](docs/l0-conventions.md) — layer, token, attribute, and motion rules
- [`docs/theme-authoring.md`](docs/theme-authoring.md) — authoring a complete `--ns-*` theme
- [`docs/recipes/living-design-routes.md`](docs/recipes/living-design-routes.md) — browser proof
  routes for consuming apps

## Resources

- [`@netscript/fresh`](https://jsr.io/@netscript/fresh) — page builders, route contracts, and form
  helpers
- [Fresh documentation](https://fresh.deno.dev/docs/)
- [Preact documentation](https://preactjs.com/guide/v10/getting-started)
- [DTCG design tokens](https://tr.designtokens.org/format/) — token source format
- [Style Dictionary](https://styledictionary.com/) — token build pipeline

## License

MIT
