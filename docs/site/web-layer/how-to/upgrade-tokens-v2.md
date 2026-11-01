---
layout: layouts/base.vto
title: Upgrade an app to tokens v2
description: Adopt the theme attributes and app-wide presets in an older Fresh scaffold.
templateEngine: [vento, md]
order: 105
---

# Upgrade an app to tokens v2

Paths are relative to your Fresh app, such as `apps/dashboard/`. For the current theme chain,
presets, and semantic overrides, see [Theme your app](/web-layer/how-to/theme-your-app/).

Older apps keep working. `[data-theme='dark']` and `[data-theme='light']` still resolve NS One, and
every earlier `--ns-*` property remains. To adopt the new attributes:

1. Move hand edits in `assets/tokens.css` into the override file where the alias layer can hold
   them. Applying a preset replaces the generated files.
2. Run `netscript ui:apply --preset ns-one` to generate `theme-preset.json` and `fonts.json` for
   the earlier look.
3. Update `routes/_app.tsx` and `lib/theme.ts` to match a new scaffold: stamp `data-theme`,
   `data-density`, and `data-flavor` on `<html>`, link the fonts, and make the preference script
   set `data-scheme`, keeping the `ns-theme` key. Update `ThemeToggle` and the light
   `color-scheme` selector the same way.
4. Run `netscript ui:update` to merge registry copies. It lists files you edited for a manual merge.
5. Switch presets with `netscript ui:apply --preset studio-utility`.

Component copies from 0.0.8 also need `netscript ui:migrate variants`. Preview it with `--dry-run`.

