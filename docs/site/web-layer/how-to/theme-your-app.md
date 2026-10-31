---
layout: layouts/base.vto
title: Theme your app
description: How the Studio Utility theme reaches every page, how to switch or tune a preset, and how a new page inherits the app chrome and theme.
templateEngine: [vento, md]
order: 104
---

# Theme your app

A scaffolded Fresh app has one theme and one chrome, and every page gets both. This recipe shows how
the theme reaches each page, how to switch or tune it, and what a new page inherits. New apps start
on Studio Utility: ink on neutral gray, sharp corners, hairline rules, and compact density.

Paths are relative to the Fresh app, such as `apps/dashboard/`. Commands pick the app from your
current directory. In a workspace with several apps, add `--app <name>`. For routes, islands, and
registry components, see [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).

## How the theme reaches every page

Generated files hold the values, and the app shell stamps the selected preset on `<html>`.

```tree
apps/dashboard/
├── client.ts                       # [owned] imports assets/styles.css on every route
├── navigation.ts                   # [owned] top-bar links and chrome opt-outs
├── tokens.config.json              # [owned] the selected preset; ui:apply and tokens init write it
├── tokens/semantic.tokens.json     # [owned] your alias overrides
├── lib/theme.ts                    # [owned] reads theme-preset.json and fonts.json
├── assets/
│   ├── styles.css                  # [owned] Tailwind, the tokens, and every component stylesheet
│   ├── ui/                         # [owned] one stylesheet per component
│   ├── tokens.css                  # [generated] the --ns-* tokens for the preset, light and dark
│   ├── theme-bridge.css            # [generated] Tailwind utilities such as bg-ns-surface
│   ├── theme-preset.json           # [generated] the preset's language, density, and flavor
│   ├── fonts.json                  # [generated] font stylesheet URLs for each preset
│   └── tokens.json                 # [generated] the token catalog behind /design/tokens
└── routes/
    ├── _app.tsx                    # [owned] stamps the theme on <html>
    └── _layout.tsx                 # [owned] the app chrome
```

1. `client.ts` imports `assets/styles.css`, so every route loads the tokens, the Tailwind
   utilities, and the component CSS.
2. `routes/_app.tsx` wraps every page. It reads `assets/theme-preset.json` through `lib/theme.ts`
   and stamps the attributes below on `<html>`.
3. `assets/tokens.css` selects on those attributes, so one stamp restyles the whole app.
4. A script in `<head>` sets `data-scheme` before first paint, from `ns-theme` in `localStorage` or
   else the OS preference. `ThemeToggle` flips `data-scheme` and writes `ns-theme`. It leaves the
   language, flavor, and density alone.
5. The shell links the font stylesheets that `assets/fonts.json` lists for the preset.

| Attribute | Value |
| --- | --- |
| `data-theme` | The design language, such as `studio`. |
| `data-flavor` | The Studio flavor, such as `utility`. Absent for other languages. |
| `data-density` | `compact` or `comfortable`. The preset fixes it. |
| `data-scheme` | `light` or `dark`. |

> [!WARNING]
> There is no per-page theme. `tokens.css` holds only the configured preset plus NS One
> compatibility, so a `data-theme` or token values on a page wrapper restyle at most that subtree
> and no other page follows. There is no `data-ns-theme` attribute or `assets/themes/` folder.
> Change the preset or the tokens instead.

## Pick a preset

A preset is one design language with its type, colors, shape, and density. NetScript ships 24. The
[design system](/design-system/) shows each theme.

| Group | Preset ids |
| --- | --- |
| Studio flavors | `studio-utility` (default), `studio-cloud`, `studio-workshop`, `studio-playful`, `studio-ledger`, `studio-atelier`, `studio-signal` |
| Other languages | `ledger`, `signal`, `glass`, `tonal`, `fluent`, `brutal`, `filigrane`, `pixel`, `tactile`, `bloom`, `cupertino`, `liquid`, `terminal` |
| Platform copies | `macos-27`, `apple-classic`, `fluent-2-web` |
| Earlier default | `ns-one` |

Switch the whole app with `ui:apply`:

```sh
netscript ui:apply --preset studio-cloud
```

The command rebuilds the generated files, records the preset in `tokens.config.json`, and installs
the theme's `DESIGN.md` and `SKILL.md` under `.agents/skills/fresh-ui-theme-<preset-id>/`. It keeps
your `tokens/semantic.tokens.json` and leaves your components as they are. An unknown preset fails
before any file changes.

`--preset` accepts four forms:

| Form | Example |
| --- | --- |
| A preset id | `studio-cloud` |
| A preset code that can also carry a style, font, and icon library | `ns1_eyJ2ZXJzaW9uIjoxLCJ0aGVtZSI6InN0dWRpby1jbG91ZCJ9` |
| A share link: an HTTPS URL with a `?preset=` code, decoded locally | `https://example.com/?preset=ns1_...` |
| An HTTPS URL to preset JSON or to a `registry:theme` item | `https://example.com/themes/acme.json` |

`netscript ui:preset url --theme studio-cloud` prints a share link, and
`netscript ui:preset decode <code>` reads a code. `--only theme` or `--only font` limits a preset code
to one part. A registry theme URL applies as a whole.

A new app takes the same flag, so it starts on that preset:

```sh
netscript init my-app --preset studio-cloud
```

To compare presets first, run `netscript tokens build --previews`, start the app in development,
and open `/design/tokens?preset=<id>`. The preview applies under `/design/` only. Every other route
keeps the configured preset.

> [!NOTE]
> Switch presets with `ui:apply`, not `ui:add theme-<id>`. The second command copies the theme's
> files but leaves `tokens.config.json` on the old preset, so the next `tokens build` restores it.

## Fine-tune a preset

An override reassigns a semantic role to another token of the same type. Create the override file
once, naming your current preset, because `tokens init` defaults to NS One:

```sh
netscript tokens init --preset studio-utility
```

Add `--force` when `tokens.config.json` already exists, as it does after `ui:apply`. `--force`
also resets `tokens/semantic.tokens.json`, so run it before you edit.

Edit `tokens/semantic.tokens.json`. This example gives Studio Utility a blue primary, with text
that reads at 4.5:1 or better in both schemes, and rounder medium corners:

```json
{
  "semantic": {
    "primary": { "$type": "color", "$value": "{semantic.blue-11}" },
    "primary-fg": { "$type": "color", "$value": "{semantic.gray-1}" },
    "primary-hover": { "$type": "color", "$value": "{semantic.blue-12}" },
    "primary-stroke": { "$type": "color", "$value": "{semantic.blue-12}" },
    "radius-md": { "$type": "dimension", "$value": "{semantic.radius-lg}" }
  }
}
```

Then rebuild:

```sh
netscript tokens build
```

An override can only alias an existing semantic role. A raw value such as `#0057ff`, an unknown
role, or a changed type fails before any file is replaced. The ramp steps resolve per scheme, so
one override covers light and dark. `tokens build` does not check the contrast of your overrides.
Check text on `primary` in both schemes yourself.

The build replaces the generated files, so keep edits in the override file. The full command
reference is in [`tokens`](/reference/cli/commands/#tokens-fresh-application-design-tokens).

## Registry theme items

The Fresh UI registry publishes each preset as a `registry:theme` item named `theme-<preset-id>`,
such as `theme-studio-utility`. An item carries the six theme files in `assets/` and that theme's
`DESIGN.md` and `SKILL.md`, which `ui:apply` and `ui:add` place under
`.agents/skills/fresh-ui-theme-<preset-id>/`. `netscript ui:list` shows the items, and
`netscript init` copies the `theme-studio-utility` files into a new app.

Your own registry can publish `registry:theme` or `registry:base` items the same way. Register it
with `netscript ui:registry add`, publish it with `netscript ui:build`, and apply an item by URL
with `ui:apply --preset <url>`. The [`ui:*` reference](/reference/cli/commands/#ui-fresh-ui-registry)
lists every registry command.

## Add a page that inherits the chrome and theme

```sh
netscript ui:add page status
```

The command writes `routes/status/index.tsx`, registers a typed route in `router.ts`, and links the
page in `navigation.ts`. The page needs no theme or frame code:

```tsx
// routes/status/index.tsx
import { PageHeader } from '@app/components/ui/mod.ts';
import { appRoutes } from '@app/router.ts';
import { definePage } from '@app/utils.ts';

function StatusContent() {
  return <p>Start building this page here.</p>;
}

export const statusPage = definePage()
  .withRoute(appRoutes['status'])
  .withMeta(() => ({ title: 'Status' }))
  .withLayer('status', StatusContent, () => ({}))
  .withLayout((slots) => (
    <main class='ns-shell ns-section ns-stack ns-stack--lg'>
      <PageHeader>
        <PageHeader.Main>
          <PageHeader.Intro>
            <h1>Status</h1>
          </PageHeader.Intro>
        </PageHeader.Main>
      </PageHeader>
      {slots.status()}
    </main>
  ))
  .build();

export const { default: page } = statusPage;
export { page as default };
```

Fresh applies the shell and the layout to every file under `routes/`, so a hand-written page gets
the same result:

| Source | What the page inherits |
| --- | --- |
| `routes/_app.tsx` | The `<html>` shell: theme attributes, fonts, the scheme script, and the skip link. |
| `assets/styles.css` through `client.ts` | The tokens, Tailwind utilities, and component CSS. |
| `routes/_layout.tsx` | The top bar: brand, the `appNavigation` links, and `ThemeToggle`. |

The links in the top bar are the `appNavigation` list in `navigation.ts`. `ui:add page` links
one-segment pages for you. Use the flags for the rest:

| Flag | Effect |
| --- | --- |
| `--nav` or `--nav "Daily reports"` | Links a nested page, such as `reports/daily`, with an optional label. |
| `--no-nav` | Skips the link. |

`netscript ui:remove page <path>` removes the page, its route registration, and its link. Add
`--dry-run` to preview.

A page that needs its own frame, such as a sign-in screen, adds its route prefix to
`chromelessRoutePrefixes` in `navigation.ts`. The `/design` showcase does this: it renders its own
sidebar layout.

Keep the page to its own content:

- Give it one `<main>`, then a `PageHeader` with one `<h1>`, then sections built from
  `@app/components/ui/mod.ts`.
- Lay out with `ns-shell`, `ns-section`, `ns-stack`, and `ns-cluster`, or with Tailwind utilities
  such as `bg-ns-surface`, `text-ns-muted-fg`, and `p-ns-4`.
- Use no hex colors or pixel values. A literal does not follow the preset or the dark scheme.
- Never copy a header, navigation, or `ThemeToggle` into a page. Duplicated chrome drifts and breaks
  client navigation. Edit `navigation.ts` or `_layout.tsx` instead.

## Upgrade an app scaffolded before tokens v2

Older apps keep working. `[data-theme='dark']` and `[data-theme='light']` still resolve NS One, and
every earlier `--ns-*` property remains. To adopt the new attributes:

1. Move any hand edits in `assets/tokens.css` into `tokens/semantic.tokens.json`. Applying a preset
   replaces the generated files.
2. Run `netscript ui:apply --preset ns-one` to generate `theme-preset.json` and `fonts.json` for
   the earlier look.
3. Update `routes/_app.tsx` and `lib/theme.ts` to match a new scaffold: stamp `data-theme`,
   `data-density`, and `data-flavor` on `<html>`, and link the fonts.
4. Make the preference script set `data-scheme`, keeping the `ns-theme` key. Update `ThemeToggle`
   and the light `color-scheme` selector the same way. The shipped toggle also supports older
   hosts.
5. Run `netscript ui:update` to merge registry copies. It lists files you edited for a manual merge.
   Carry over the `/design` token helper and view if you want its ramps to follow the generated
   tokens.
6. Switch presets with `netscript ui:apply --preset studio-utility`.

Component copies from 0.0.8 also need `netscript ui:migrate variants --dry-run`. It previews the
conversion to the data-attribute contract that the current styles use. Drop `--dry-run` to apply.

## Check your work

With the app running in development:

1. Open `/design/components` and `/design/tokens` to see the components and tokens under the active
   preset. The `/design` routes return 404 outside development.
2. Open the pages you changed. Flip `ThemeToggle` and check light and dark, including the empty,
   loading, and error states.
3. Run `deno task check` from the app directory.

## Next steps

Edit routes, add islands, and install more components in
[Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/). For how the pieces fit, see
[Fresh UI & design](/web-layer/fresh-ui/) and the [`@netscript/fresh-ui` reference](/reference/fresh-ui/).
