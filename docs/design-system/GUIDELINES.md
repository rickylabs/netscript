# NetScript Custom Design Guidelines

How to design a Fresh UI theme that matches the quality of the eleven reference themes and works
with the NetScript framework.

The guidelines have two readers:

- a designer creating or extending a theme;
- an AI agent working from a `SKILL.md` and `DESIGN.md` pair.

The guidelines define the token contract every theme follows (§1 to §3), the method for designing
and checking a theme (§4 and §5), the existing themes (§6), and the steps for adding and shipping a
new one (§7 and §8).

> **Status: token names are provisional.** The role names below are the current Figma contract. S1
> (#2414) turns them into DTCG 2025.10 tokens with resolver modes. S3 (#2416) freezes component
> anatomy and data-attribute variants. Until both land, treat names as stable and values as owned by
> Figma. Do not invent new core role names.

## 1. Two rules that override everything

1. **Figma owns values; code owns names.** A theme changes the values of existing roles, tiers and
   modes. It never renames a core role or introduces a new core role on its own. New namespaced
   roles come only through a declared language pack (§2.4). CI rejects exported token names that
   code does not know.
2. **A theme is a language, not a palette.** Recolouring and re-rounding the default UI is not a
   theme. A theme must own a depth model, a shape language, a type system and a set of component
   variants, each traceable to a documented reference.

## 2. Theme architecture

Figma and code describe the same system. Figma stores values in variable collections and modes. Code
(S1 #2414) stores tokens in three DTCG 2025.10 tiers and selects between contexts with a DTCG
resolver file. This section maps one onto the other. Ownership follows the epic (#2412, decision 2):
Figma owns values; code owns names, tiers, modes and component anatomy.

### 2.1 Three token tiers

| Tier          | What it holds                                                                                                                                                                                                                                                                                   | Figma source                                                                                                                                            | Code surface (provisional until S1)             | Who may read it                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| **Primitive** | Raw values only: colour ramps (oklch with a hex fallback), dimensions, durations, font families. Radix 12-step ramps (gray, slate, sand, mauve, blue, violet, orange, indigo, tomato, lime, grass, amber, red, teal) and theme ramps (`ember`, `band`, `paper`, `glass`, `shadow`, `swiss-red`) | `Primitives` collection (Value mode)                                                                                                                    | Internal custom properties, e.g. `--ns-band-*`  | The semantic tier only. Components never read primitives |
| **Semantic**  | **Aliases only.** Every value references a primitive (or another semantic role), never a raw hex, px or ms. Core roles plus declared language-pack roles (§2.4)                                                                                                                                 | `Scheme` collection (Light, Dark). Its aliases are selected through the `Theme`, `Base gray`, `Base accent`, `Density` and `Studio flavor` modes (§2.2) | `--ns-*` (core) and `--ns-<theme>-*` (packs)    | Component tokens and L2 component CSS                    |
| **Component** | Part and state tokens (`button.*`, `input.*`, `card.*`, …) that alias semantic roles, so heavy customization is a token edit, not a CSS override                                                                                                                                                | Variable bindings on library components; there is no component collection yet                                                                           | Named by S1 from the S3 component specs (#2416) | That component's own CSS only                            |

- **Derived values.** Tints, hovers and other mixes are not raw values in the semantic tier.
  `$extensions.netscript.derive` describes them. CSS keeps `color-mix()`, and Figma receives the
  computed value.
- **Collections and modes are not tiers.** `Scheme`, `Theme`, `Base gray`, `Base accent`, `Density`
  and `Studio flavor` modes are contexts the resolver chooses between (§2.2). They never add a
  fourth tier.
- **Raw values inside Figma modes.** Some Theme modes still store raw values in slots that are
  semantically aliases, for example Tactile's `surface/{l,d}/*` and Fluent's `accent/{l,d}/solid`.
  Each theme's `DESIGN.md` records them. Before export, S1 splits each one into a primitive and an
  alias.
- **Node-level exceptions are Figma-only.** A primitive or raw value bound directly on a Figma node
  is a temporary exception. The theme's `DESIGN.md` names the S1 role that replaces it, pending in
  #2414. It never ships in L2 component CSS.
- **Layer ownership is unchanged.** L0/L1 own platform behaviour, attributes and prop getters. L2
  registry components consume component and semantic tokens. An L2 component never imports another
  L2 component.

### 2.2 How Figma collections map to the resolver

| Figma collection (modes)                                                                  | What it selects                                                           | S1 resolver (#2414)                                                                                                      | Root attribute (provisional) |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `Scheme` (Light, Dark)                                                                    | The semantic role values for each scheme                                  | `scheme` modifier: `light`, `dark`                                                                                       | `data-scheme`                |
| `Theme` (Studio, Ledger, Filigrane, Signal, Tonal, Glass, Brutal, Fluent, Tactile, Pixel) | Language values: fonts, type scale, radii, materials, shadow recipe, ring | `theme` modifier, with one context per **language preset** (§2.3), not one per Figma mode                                | `data-theme`                 |
| `Density` (Comfortable, Compact, Dense, Airy, Chunky)                                     | Control, page, section, card, table and badge spacing                     | `density` modifier. S1 specifies `comfortable` and `compact` only; `dense`, `airy` and `chunky` need an S1 schema change | `data-density`               |
| `Studio flavor` (Utility, Cloud, Workshop, Playful, Ledger, Atelier, Signal)              | Personality on top of the Studio language                                 | Not a modifier. Each flavor expands into a Studio preset                                                                 | `data-flavor` (Studio only)  |
| `Base gray` (Neutral, Slate, Sand, Mauve)                                                 | Which gray ramp a theme sits on                                           | Not a modifier. A preset parameter                                                                                       | `data-gray`                  |
| `Base accent` (Ink, Blue, Violet, Orange, Indigo, Tomato, Lime)                           | Which accent ramp drives `primary/*`                                      | Not a modifier. A preset parameter                                                                                       | `data-accent`                |
| `Primitives` (Value)                                                                      | Raw ramps                                                                 | The primitive tier; no modifier                                                                                          | —                            |

This Figma plan allows **10 modes per collection**, and `Theme` uses all 10. Figma modes and
languages are therefore not one-to-one: Cupertino and Liquid share `Glass`, Terminal uses `Signal`,
and Bloom borrows `Tonal`. A shared or borrowed Figma mode is prototype evidence only. The S1 export
must give each language preset its own complete core-role map. A new language either replaces a mode
or declares a language pack (§2.4). The S1 resolver removes the ceiling in code.

### 2.3 Supported resolver axes

The axes are scheme × theme × flavor × density × gray × accent. **Not every permutation exists.**
The unit of support is the **language preset**: a fixed choice of Theme values, density, gray and
accent (and, for Studio, flavor), designed and reviewed in both schemes.

| Axis      | Values                                                                                                             | Where it applies                                   | Supported today                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `scheme`  | light, dark                                                                                                        | Every preset                                       | Both schemes for every preset; each dark is designed, not inverted                                                   |
| `theme`   | `studio`, `tonal`, `bloom`, `cupertino`, `liquid`, `fluent`, `brutal`, `filigrane`, `terminal`, `pixel`, `tactile` | —                                                  | One preset per language; Studio has seven, one per flavor                                                            |
| `flavor`  | utility, cloud, workshop, playful, ledger, atelier, signal                                                         | Studio only                                        | Each flavor fixes its own gray, accent and density (Studio `DESIGN.md` → _Flavors_). Every other language ignores it |
| `density` | comfortable, compact (S1); dense, airy, chunky (Figma only)                                                        | Studio flavors; a few languages set one explicitly | Fixed per preset; not a free user override yet                                                                       |
| `gray`    | neutral, slate, sand, mauve                                                                                        | Studio flavors                                     | Fixed per preset. The other languages alias their own ramps inside their Theme mode and ignore it                    |
| `accent`  | ink, blue, violet, orange, indigo, tomato, lime                                                                    | Studio flavors                                     | Fixed per preset, as for gray                                                                                        |

**Precedence.** The resolver applies `theme` (with `flavor` for Studio) as a preset that fixes
density, gray and accent. `scheme` then selects the Light or Dark values. An app's override layer
(S1) applies last, on the semantic tier only. A preset ignores attempts to change an axis it fixes,
and the builder (§8) offers only supported combinations. A free axis, such as any density on any
language, needs an S1 schema change and a contrast run for every new permutation.

**Fixed axes per language.** This table comes from each theme's `DESIGN.md` → _NetScript Mapping_.
The mode assignments are read from the Figma library and are not yet verified in code (S1 #2414).

| Language  | Figma Theme mode   | Density                                   | Gray × accent                                           |
| --------- | ------------------ | ----------------------------------------- | ------------------------------------------------------- |
| Studio    | `Studio`           | per flavor (Utility: compact)             | per flavor (Utility: neutral × ink)                     |
| Tonal     | `Tonal`            | comfortable; M3 component sizes are fixed | mauve × violet, inside the mode                         |
| Bloom     | `Tonal` (borrowed) | none (literal geometry)                   | none; Bloom reads `bloom/*`                             |
| Cupertino | `Glass` (shared)   | comfortable                               | slate × blue, inside the mode                           |
| Liquid    | `Glass` (shared)   | comfortable                               | slate × blue, inside the mode; own values in `liquid/*` |
| Fluent    | `Fluent`           | none (WinUI defaults)                     | neutral gray × WinUI accent, inside the mode            |
| Brutal    | `Brutal`           | none (comfortable default)                | sand × amber, inside the mode                           |
| Filigrane | `Filigrane`        | none                                      | sand × tomato, inside the mode                          |
| Terminal  | `Signal` (shared)  | compact                                   | gray × lime, inside the mode                            |
| Pixel     | `Pixel`            | comfortable                               | sand-family × amber, inside the mode                    |
| Tactile   | `Tactile`          | none                                      | none; Tactile reads `tactile/*`                         |

**Migration from today's selectors.** Code today (NS One) scopes light on `:root` and dark on
`[data-theme='dark']`. The new model moves the scheme to `data-scheme` and gives `data-theme` to the
language: `data-theme="dark"` becomes `data-theme="<language>" data-scheme="dark"`. S1 acceptance
requires that existing `--ns-*` names keep resolving or have a documented migration, and that NS One
renders unchanged. S1 therefore either keeps `[data-theme='dark']` resolving as the default preset's
dark scheme or ships that migration, with a `ui:migrate` step for app-owned copies. Never rename an
existing `--ns-*` name without a migration.

### 2.4 Token-only assignments and declared language packs

There are two kinds of theme. Keep them apart.

- **Token-only assignment.** A theme, flavor or brand preset that only assigns values to existing
  roles, for example a Studio flavor, a gray or accent choice, or an app's brand theme. It adds no
  names and no CSS anatomy. Most themes should be this kind.
- **Declared language pack.** A language whose look needs roles or anatomy the core set cannot
  express. A pack is a registered extension, not a fork. It declares:
  1. **A role manifest:** every namespaced role it adds, as `<theme>/<path>` →
     `--ns-<theme>-<path>`, each with a Light and a Dark alias. Until S1 has a machine-readable
     manifest, the list is the _Language roles_ row in the theme's `DESIGN.md` → _NetScript
     Mapping_. S1 registers every listed role before the pack ships; unknown names fail CI.
  2. **Its anatomy additions:** only the S3 parts and `data-variant` values it adds to its own
     components, such as Studio's card variants or Bloom's notched widget. A pack never restyles
     arbitrary app markup or another L2 component's internals.
  3. **A complete core map:** every core semantic role still resolves under the pack, so shared
     components keep working.

Packs with namespaced roles today: `studio/*`, `liquid/*`, `tactile/*`, `bloom/*`, `cupertino/*`,
`fluent/*` and `pixel/*`. Only that language's components and CSS pack read its namespaced roles;
shared components never do. A Studio flavor changes variables inside Studio anatomy. A new language
variant changes only its declared S3 parts and variants.

### 2.5 Core semantic roles (every theme defines all of them, in Light and Dark)

The CSS custom property comes from each variable's code syntax. For example, `surface/bg` maps to
`var(--ns-bg)` and `surface/card` to `var(--ns-card)`.

- **Surfaces:** `surface/bg`, `surface/surface`, `surface/card`, `surface/raised`, `surface/muted`,
  `surface/hover`, `surface/selected`, `surface/overlay`, `surface/container`,
  `surface/container-high`, `surface/container-highest`, `surface/inverse`.
- **Text:** `text/fg`, `text/card`, `text/muted`, `text/subtle`, `text/inverse`, `ink/fg`.
- **Borders:** `border/default`, `border/subtle`, `border/hover`, `border/strong`, `border/input`,
  `border/ring`, `border/ink`, `border/control`.
- **Intents** (each has `default`, `hover`, `fg`, `subtle`, `border`, `text`): `primary`, `accent`,
  `secondary`, `success`, `warning`, `destructive`, `info`. Primary also has `primary/container` and
  `primary/on-container`.
- **Actions and state:** `action/primary-bg`, `action/primary-fg`, `action/primary-border`,
  `state/disabled-container`, `state/disabled-fg`.
- **Depth:**
  - `elevation/ambient`, `elevation/key`, `effect/shadow`;
  - `bevel/{highlight,lip,edge,inset,solid-highlight,solid-lip,glow}`;
  - `material/{fill,fill-strong,stroke,track}`.
- **Language accents** (only meaningful in their theme, but always defined): `aurora/{1..4}`,
  `block/{yellow,blue,green,pink,purple,ink-text}`, `frame/ink`, `control/ink`.

### 2.6 Variants and states are data attributes

Modes, variants and states are data attributes (`data-variant`, `data-size` and `data-state`), not
BEM modifier classes (epic Decision 4).

A theme may restyle any variant. It may add structure only through a declared language variant, such
as Studio's card variants or Bloom's notched widget. That variant must exist in the component
contract (S3).

## 3. Compatibility contract (MUST)

1. **Semantic roles only in components.** Components read their component tokens and semantic roles,
   never primitives. The only exception is a Figma node-level correction (§2.1). It is recorded in
   the theme's `DESIGN.md`, removed when S1 adds the role, and never ships in L2 component CSS.
2. **Both schemes are complete.** Every core role has a designed Light and a designed Dark value.
3. **Shippable effects only.** Every visual effect needs a web implementation. Some implementations
   only approximate the Figma effect:

   | Figma effect           | Web implementation / approximation                                                                                                      |
   | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
   | `GLASS`                | Approximation: `backdrop-filter` blur plus layered borders and gradients. CSS has no refraction or lensing, so never call it equivalent |
   | Drop and inner shadows | `box-shadow`                                                                                                                            |
   | Gradient strokes       | `border-image` or a mask                                                                                                                |
   | Bevels and lips        | stacked shadows or pseudo-elements                                                                                                      |

   Every translucent material needs an opaque fallback (`@supports not (backdrop-filter: …)`,
   `prefers-reduced-transparency`, `prefers-contrast: more`). Glass, the preference modes and
   scroll-dependent effects (scroll edges, sticky glass bars) also need S6 #2419 visual proof: a
   Playwright screenshot compared with the Figma render. Anything that cannot be shipped is not part
   of the theme.
4. **Web Platform base.** Use native `<dialog>`, the Popover API, CSS anchor positioning and our
   Preact behaviour. Never use a React-only library (epic Decision 3).
5. **Licensable assets only.**
   - **Fonts:** Google Fonts, other OFL fonts, or system stacks. SF Pro and Segoe UI cannot be
     embedded; ship them only as system-stack fallbacks. SF Pro is listed in Figma but renders blank
     from the Plugin API.
   - **Icons:** Lucide (ISC), Fluent System Icons (MIT), or our own pixel set. No trademarked
     product logos (Microsoft 365, Apple, Mojang).
   - **Reference brands:** Polaris, Mistral and Minecraft Ore UI inform patterns. Never copy their
     colours, marks or assets.
6. **Accessibility is part of the theme.** Every theme ships with:
   - text at WCAG 2.2 AA (4.5:1 normal, 3:1 large);
   - non-text contrast of 3:1 for input, checkbox, radio and switch boundaries, and for focus
     indicators;
   - a visible focus indicator of at least 2px;
   - states that never rely on shadow or colour alone;
   - reduced-motion and RTL mirroring;
   - hit targets of at least 24px (44px recommended for touch).

## 4. The quality method

Follow these steps for every language, from first draft to design sign-off.

### 4.1 Anchor in a documented system: measure it, don't guess

Each language has a public or open-source primary reference. Measure that source directly; don't
work from memory.

| Language  | Anchor                                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Studio    | shadcn/ui 2026 styles and Linear, with Geist and AlignUI                                                                                                                                      |
| Tonal     | Material 3 Expressive                                                                                                                                                                         |
| Bloom     | Material You, widget-first                                                                                                                                                                    |
| Cupertino | Apple-inspired classic: grouped-list and typography cues from Apple's pre-Liquid platforms, in a hand-built composition (not strict macOS 15 / iOS 18 fidelity)                               |
| Liquid    | Apple macOS 27 / iOS 27 Liquid Glass (official Figma kits)                                                                                                                                    |
| Fluent    | WinUI theme resources and Fluent 2 (MIT)                                                                                                                                                      |
| Brutal    | Gumroad UI and neobrutalism.dev                                                                                                                                                               |
| Filigrane | NetScript-defined minimal typography; FT Origami o3 and Guardian Source for focus, data and accent patterns, without newspaper chrome                                                         |
| Terminal  | Charm Lip Gloss and Bubbles                                                                                                                                                                   |
| Pixel     | the Mistral pixel idea, plus Ore UI component cues                                                                                                                                            |
| Tactile   | Themesberg Neumorphism UI and flutter_neumorphic (verified upstream, pinned), plus setproduct guidance adopted as local parameters (upstream unverified; see Tactile `DESIGN.md` → _Sources_) |

Official kits are available as Figma community libraries; Liquid's values are measured from the
macOS 27 and iOS 27 kits. Open-source theme resources give exact values.

### 4.2 Write the thesis before drawing

Write one sentence and three signature moves that nobody would mistake for another theme. Two
examples:

- **Bloom:** notch-cut pastel widgets, a large regular grotesk and black action discs.
- **Tactile:** one material and one light. Convex keys, concave wells, and selected means sunk.

### 4.3 Vary every axis, not only colour

A theme is unique only when most of these axes differ from its neighbours:

| Axis               | Questions to answer                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Depth model        | Flat, hairline, elevated, glass, bevel/lip, neumorphic, offset-hard? Which elements get depth, and why?                                       |
| Shape language     | Radius scale, notches, steps, pills; whether radii are concentric (inner = outer − padding)                                                   |
| Typography         | Display and body pairing, scale, weights, tracking, numerals, label case                                                                      |
| Colour strategy    | Ground and ladder; where the accent may appear; tinted (not black) darks                                                                      |
| Density and rhythm | Row heights, field heights, spacing scale, hit targets                                                                                        |
| Component variants | Card, button, tab, table, badge, KPI, top bar and nav; pick a different variant per theme                                                     |
| Signature objects  | The knurled dial, LED gauge, notch card, glass sheet, banded bars                                                                             |
| Iconography        | Stroke icons, filled pairs, colour icons, pixel icons, SF-Symbol-like glyphs                                                                  |
| State physics      | What hover, pressed, selected and focus look like. In Tactile a press sinks; in Pixel the lip collapses; in Liquid the glass lensing changes. |

Two themes that differ only in hue at a 480px thumbnail count as one theme. Check this on a contact
sheet (§4.5).

### 4.4 Build the specimen, the states and the dark mode

The fixture is the Orders screen: KPIs, filter tabs, a table, a detail editor, a notice and an
activity feed. It exercises about 30 components in one view. Then add:

- a **state sheet**: rest, hover, pressed, focus, disabled, selected and error for every interactive
  component;
- a **designed dark mode**, never an inverted one. A white header on a dark theme is a defect
  (§4.5).

### 4.5 Self-audit before anyone else looks

1. **Thumbnail test.** On a 4×2 contact sheet at 480px, each theme is identifiable without reading
   text.
2. **Dark inversion audit.** Check every dark frame for white or pale neutral surfaces: white
   headers, light gray slabs, white outlines or shadows, and white or pale primary buttons. Each is
   a high-severity defect, even when contrast passes. A saturated accent fill with dark ink is not
   an inversion when a theme's language requires it. These are the named cases, each limited to the
   scope in that theme's `DESIGN.md`:
   - **Fluent:** the native dark accent `#60CDFF` with black text, at control size and on native
     selection indicators only. It never fills content surfaces.
   - **Terminal:** lime `#bdee63` with dark ink on the selection row (inverse video) and the lime
     fill of the sync progress bar. The selected tab and the primary key stay dark.
   - **Pixel:** amber `#faab35` with `#12100e` ink, only where its accent policy allows it: the
     primary and hero keys, the selected tab, the current page key, checked checkboxes, the on
     switch, the focus ring, the block cursor, and the 2px amber bands used as signals.
   - **Brutal:** the saturated blocks and the amber primary, which are the language's surfaces in
     both schemes. They carry black ink, except the dark violet `block-purple`, which takes
     `text/fg` because black on it is 3.9:1.
   - **Cupertino:** `primary` `#0090ff` with dark ink `#111113`, only where its accent policy allows
     it: the prominent capsule, the selected list row, checked selection circles, and the brand and
     avatar discs.

   No other theme or usage is exempt. A new theme that needs such a fill is added to this list by a
   change to these guidelines.
3. **Measure pixels, not tokens.** Sample the exported PNG. Two traps make a correct token measure
   wrong:
   - a stale stored paint colour on side-specific strokes;
   - half-pixel positions that split a 1px rule into two faint rows.
4. **Model audit.** If the theme has a physical model (Tactile's elevation map, Liquid's glass
   layers), list every node that carries an effect and check that the model justifies each one.
5. **Guideline audit.** If the style has published guidelines, check every rule. Record which rules
   are verified upstream and which are your own adopted judgement. For example, the neumorphism
   guidance Tactile adopted warns against dense tables, small type and many-field forms (adopted
   local rules, partly unverified upstream).

### 4.6 Independent review, then sign-off

- **Get an independent review.** Ask someone who did not build the theme to check it against these
  guidelines. The review returns the design changes needed and the evidence still owed, such as
  missing measurements or states.
- **Review findings are corrections, never a template.** Apply each one as a local fix to the
  existing design, and edit approved frames in place. Do not rebuild the theme from a spec or a kit:
  a spec-literal rebuild looks generic, and a kit-literal rebuild loses what the existing design
  already does well.
- **Then get design sign-off** before the theme ships.

## 5. Anti-patterns

| Anti-pattern                                   | Symptom                                                                                     | What to do instead                                                                                                                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Recolour and re-round the default UI           | The theme looks like the default UI with new colours and radii                              | Vary the depth model, shape, type and variants (§4.3)                                                                                                                                                         |
| Inverted dark mode                             | The dark scheme is the light scheme with colours inverted, and text is hard to read         | Design the dark: tinted grounds, lighter tinted elevation, dark primaries with accent ink                                                                                                                     |
| Copying a brand                                | The theme reads as the reference brand, for example Mistral, instead of as its own language | Use the idea; derive your own palette                                                                                                                                                                         |
| Mixing two eras of a platform                  | One screen combines cues from two generations of the same platform                          | Keep the two eras distinct. Liquid owns refraction, lensing and the macOS 27 chrome. Cupertino is the Apple-inspired classic composition: blur-only materials, with the floating sidebar and capsule buttons. |
| Glass with nothing behind it                   | Translucent layers sit on a flat background, so the glass effect is invisible               | Put a real desktop, photo or glow behind translucent layers, with specular rims                                                                                                                               |
| Spec-literal or kit-literal rebuilds           | The redesign looks generic, or loses detail the previous version had                        | Keep the existing composition; apply measured facts as corrections                                                                                                                                            |
| Decorative depth                               | Shadows and bevels appear on elements with no consistent reason                             | Every shadow must follow the model: pressable things rise, input wells sink                                                                                                                                   |
| A style used where its guidelines say it fails | The screen uses a pattern the style's own guidelines advise against                         | Read the style's guidelines and recompose, for example tiles instead of dense tables                                                                                                                          |
| Imprecise alignment and rhythm                 | Icons sit off-centre in their containers, and regions look cramped                          | Centre on whole pixels; space regions generously and consistently                                                                                                                                             |
| Variations that only change colour             | Flavors are hard to tell apart on a contact sheet                                           | Change ground, shapes, sizes and component variants per flavor                                                                                                                                                |

## 6. Theme catalogue

| Theme              | Family     | Thesis                                                                                                                                                                                   | Best for                           | Avoid for             |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------- |
| Studio (7 flavors) | System     | A shared component set in seven flavors: Utility, Cloud, Workshop, Playful, Ledger, Atelier, Signal                                                                                      | Any SaaS; the neutral base         | —                     |
| Tonal              | System     | Material 3 Expressive: tonal surfaces and expressive shape                                                                                                                               | Android-adjacent and consumer apps | —                     |
| Bloom              | Expressive | Widget-first Material You: pastel notch cards, big regular type                                                                                                                          | Personal dashboards, consumer      | Dense admin           |
| Cupertino          | Platform   | Apple-inspired classic: floating sidebar, large-title header, capsule buttons, inset grouped lists, blur-only materials. A hand-built composition, not strict macOS 15 / iOS 18 fidelity | Mac-like tools                     | —                     |
| Liquid             | Platform   | macOS 27 Liquid Glass over a real desktop                                                                                                                                                | Pro desktop apps                   | Content-heavy reading |
| Fluent             | Platform   | Windows 11 / WinUI: Mica, layers, NavigationView pill                                                                                                                                    | Microsoft-centric enterprise       | —                     |
| Brutal             | Expressive | Gumroad-like flat blocks, black outlines, hard offset shadows                                                                                                                            | Creator tools, marketing           | Long data sessions    |
| Filigrane          | Editorial  | Minimal, thin, legible type with hairline structure                                                                                                                                      | Content, reporting                 | Dense controls        |
| Terminal           | Developer  | A Charm-style TUI on a character grid                                                                                                                                                    | Dev tools, ops                     | Consumer              |
| Pixel              | Expressive | Amber pixel bands, Pixelify Sans, Ore UI lips                                                                                                                                            | Games, playful products            | Formal finance        |
| Tactile            | Expressive | Guideline-based neumorphism: one material, convex keys, concave wells                                                                                                                    | Commerce consoles, IoT, widgets    | Dense tables          |

Each theme folder, `themes/<id>/`, holds a `DESIGN.md` (the specification) and a `SKILL.md` (how an
agent builds with the theme).

## 7. Creating a new theme: step by step

1. **Choose the anchor.** Record the reference pack in the theme's `DESIGN.md`: sources, licence,
   what you take, and what you must not copy.
2. **Write the thesis and three signature moves.**
3. **Fill in the axes table (§4.3).** Show that at least six axes differ from the nearest existing
   theme.
4. **Add the values in Figma.**
   - Use a Theme mode for a token-only assignment. Declare a language pack (§2.4) when the language
     needs namespaced roles or new anatomy, or when the mode ceiling is reached.
   - Use density and flavor modes as needed.
   - Seed bound paints with their resolved colour.
5. **Build the Orders specimen,** Light and Dark, plus a state sheet. Compose the screen the way the
   style's guidelines support.
6. **Run the self-audit (§4.5)** and record the measurements.
7. **Write `DESIGN.md` and `SKILL.md`** from `themes/_template/`.
8. **Get an independent review** (§4.6), apply its corrections in place, then get design sign-off.
9. **Register any new roles in code** (S1) before the theme ships through the registry (S2). List
   them in the pack's role manifest (§2.4) first.

## 8. Shipping (planned)

Nothing in this section ships yet.

- Themes ship as registry v2 items (S2 #2415). Adding a theme installs:
  - its token CSS, plus its CSS pack if it is a declared language pack;
  - one co-located skill directory, `.agents/skills/fresh-ui-theme-<id>/`, holding `SKILL.md`,
    `DESIGN.md` and summaries of the sources `DESIGN.md` references. `SKILL.md` says "Read
    `DESIGN.md` in this folder", so that relative path must resolve in the installed copy.

  An agent working in that app then builds on-theme by default.
- A consumer skill `netscript-design`, built from this document, ships in the CLI skill bundle (S9
  #2431). The docs site publishes the same files in a Design system page group (S8 #2430). The skill
  finds installed themes by skill name (`fresh-ui-theme-<id>`), never by a repository path such as
  `docs/design-system/themes/`. It must respect the generated-asset chain and the MCP docs budget.
- The `/create` builder (S7) offers only the supported presets and axes in §2.3 and exports the same
  token set. It must not imply that every gray × accent × theme × flavor × density permutation
  exists.
