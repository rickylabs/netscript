---
version: alpha
name: <Theme Name>
description: >-
  <One-sentence thesis, e.g. "Guideline-based neumorphism: one material, convex keys, concave
  wells.">
colors:
  # ILLUSTRATIVE SUBSET, NOT A COMPLETE EXPORT. Keys are the NetScript CSS suffix of a core role
  # (surface/bg -> --ns-bg -> `bg`); the Dark value uses the same key with `-dark`. Replace every
  # value with the resolved Figma value, and list every core role the theme changes. The S1 export
  # (#2414) remains the complete role map.
  # The defaults below are safe, Utility-compatible values: a designed graphite dark, never white
  # primaries, borders or rings in dark. `muted` is a surface; `muted-fg` is its text.
  bg: '#ffffff'
  bg-dark: '#18181a'
  card: '#ffffff'
  card-dark: '#1e1e21'
  muted: '#f0f0f0'
  muted-dark: '#26262a'
  fg: '#202020'
  fg-dark: '#eeeeee'
  muted-fg: '#646464'
  muted-fg-dark: '#b4b4b4'
  border: '#e0e0e0'
  border-dark: '#383838'
  input-border: '#838383'
  input-border-dark: '#7b7b7b'
  ring: '#202020'
  ring-dark: '#7b7b7b'
  primary: '#202020'
  primary-dark: '#313131'
  primary-border: '#202020'
  primary-border-dark: '#7b7b7b'
  primary-fg: '#fcfcfc'
  primary-fg-dark: '#eeeeee'
  success-text: '#2a7e3b'
  success-text-dark: '#71d083'
  warning-text: '#4f3422'
  warning-text-dark: '#ffca16'
  destructive: '#e5484d'
  destructive-text: '#641723'
  destructive-text-dark: '#ff9592'
  info-text: '#113264'
  info-text-dark: '#70b8ff'
typography:
  display:
    fontFamily: <family>
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  title: { fontFamily: <family>, fontSize: 28px, fontWeight: 600, lineHeight: 1.2 }
  heading: { fontFamily: <family>, fontSize: 20px, fontWeight: 600, lineHeight: 1.3 }
  body: { fontFamily: <family>, fontSize: 14px, fontWeight: 400, lineHeight: 1.45 }
  label: { fontFamily: <family>, fontSize: 12px, fontWeight: 500, lineHeight: 1.3 }
  data: { fontFamily: <family>, fontSize: 14px, fontWeight: 400, fontFeature: '"tnum" 1' }
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-fg}'
    rounded: '{rounded.md}'
    height: 36px
  button-primary-dark:
    backgroundColor: '{colors.primary-dark}'
    textColor: '{colors.primary-fg-dark}'
    rounded: '{rounded.md}'
    height: 36px
  input:
    backgroundColor: '{colors.card}'
    textColor: '{colors.fg}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    height: 36px
  input-dark:
    backgroundColor: '{colors.card-dark}'
    textColor: '{colors.fg-dark}'
    rounded: '{rounded.sm}'
    height: 36px
---

# <Theme Name>

<!--
Format: Google Labs DESIGN.md (alpha, Apache-2.0), github.com/google-labs-code/design.md.
- The eight spec sections come first, in spec order.
- The NetScript extension sections come after them. Unknown sections are preserved by spec
  consumers.
- Replace every <placeholder>.
- Token values must be the resolved Figma values (file pGRLnkPPRZJZy74evNcQBr). The front-matter
  colour keys are an illustrative subset: keep them as CSS suffixes of real core roles
  (`muted` = surface, `muted-fg` = text, `input-border`, `primary-fg`), and never invent a key.
- The rules in docs/design-system/GUIDELINES.md apply.
-->

## Overview

- **Thesis:** one sentence.
- **Signature moves:** three things nobody would mistake for another theme.
- **Anchor:** the documented reference system, what is taken from it, and what must not be copied.
- **Family:** System, Platform, Expressive, Editorial or Developer.
- **Best for / avoid for:** where the style works, and where its own guidelines say it fails.
- **Feel:** three adjectives, and the user's first impression in one line.

## Colors

- **Ground and surface ladder:** canvas → panel → raised → overlay, in Light and Dark.
- **Accent policy:** exactly where the accent may appear, and where it must not.
- **Status colours:** values and contrast against their surfaces.
- **Dark design notes:** tinted ground, how elevation is shown, and the dark primary treatment. Dark
  is designed, never inverted: no white primaries, borders, rings or headers. The template defaults
  (graphite #18181a ground, #313131 primary with a #7b7b7b keyline and ring) are a safe starting
  point, not a theme.

## Typography

Families with licence and fallback stack, pairing logic, the scale, weights, tracking, numerals and
label case.

## Layout

Grid, density mode, row and field heights, spacing rhythm, page structure, and how the Orders
fixture is composed in this theme.

## Elevation & Depth

The depth model, as a rule anyone can apply. For each level, give:

- the shadow, bevel or glass recipe (CSS-implementable);
- which elements get it, and why.

## Shapes

The radius scale and concentricity, notches, steps, pills, borders and stroke widths.

## Components

For each component: the variant used in this theme, its anatomy differences, and its states (rest,
hover, pressed, focus, disabled, selected, error). Cover at least:

- button tiers;
- input and select;
- checkbox, switch and radio;
- tabs and segmented controls;
- table or list row;
- badge and tag;
- KPI card;
- notice;
- nav item;
- top bar and toolbar;
- dialog or sheet;
- the theme's signature objects.

## Do's and Don'ts

Ten to fifteen bullets, written as guardrails. Include every owner correction and reviewer finding
that shaped the theme, phrased as a rule.

## Iconography & Imagery

The icon set and its licence, sizes, stroke or fill, colour icons, avatars, and the illustration or
backdrop policy.

## Motion & States

Hover, press and selection physics, durations and easing, and the reduced-motion equivalent.

## Accessibility

Measured contrast for text, non-text boundaries and focus; hit sizes; RTL notes; known exceptions,
with their tracking issue.

## NetScript Mapping

| Layer              | Value                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Theme mode   | `<mode>`                                                                                                                                           |
| Base gray × accent | `<gray> × <accent>`                                                                                                                                |
| Density            | `<mode>`                                                                                                                                           |
| Flavor             | `<mode or n/a>`                                                                                                                                    |
| `data-theme`       | `<id>`                                                                                                                                             |
| Language roles     | Token-only assignment: `none`. Declared language pack: the role manifest, every `<theme>/<path>` → `--ns-<theme>-<path>` it adds (GUIDELINES §2.4) |

- **Node-level exceptions:** any primitive or raw value bound directly on a Figma node, with its
  node id, the reason and the S1 role that will replace it. These are Figma-only and never ship in
  L2 component CSS (GUIDELINES §2.1).
- **Figma frames:** node ids of the Light, Dark and state-sheet frames.
- **Renders:** the frozen render set the review used (for example
  `.llm/runs/design-system-s4--language-review/renders-r7/`), with its `SHA256SUMS` hash. Never cite
  a mutable render directory as evidence.
- **Evidence status:** say which facts are observed on exported pixels, which are reported by the
  Figma author (node ids, modes, alias chains, binding counts, effect values, text-style weights)
  and independently unverified, which are adopted design judgement, and which runtime behaviour is
  still unproven (#2419).

## Provenance

Sources with links, the review rounds and their verdicts (with the evaluator runtime only where it
was attested in the review worklog), owner decisions (quoted, and marked as excerpts), and open
evidence (#2414 tokens/fonts, #2416 states, #2419 runtime). Separate verified upstream values from
adopted local parameters.
