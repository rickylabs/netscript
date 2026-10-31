# Tokens v2 — Plan & Design — READY FOR REVIEW

## Contract and locked decisions

Implement #2414 on S0, with NS One's existing CSS values as a compatibility
fixture. Use one DTCG 2025.10 resolver, three token tiers, and Style Dictionary
5.7.1 custom formats for every output. The wrapper only expands the resolver's
ordered sources and selected contexts; SD owns alias resolution and output.

Snapshot the seven approved Figma collections with provenance. A reproducible
source importer follows aliases in the target collection's selected mode,
rounds float noise, normalizes font styles, lifts raw values into primitives,
and creates alias-only semantic documents. Registered CSS names preserve WEB
syntax. Nodes and the theme mapping supply the extra named shape, font, key,
band, avatar, and hairline roles that do not yet have Figma variables.

The theme modifier has 18 contexts: NS One, seven Studio flavors, and the ten
other languages. Each gets a complete core map, including dedicated maps for
Bloom, Liquid, and Terminal despite their shared Figma Theme modes. Scheme has
light/dark contexts; density has comfortable/compact contexts. Build all 72
inputs, recording requested and effective axes. Theme presets apply their fixed
density after the density source, so unsupported user density requests do not
create a new visual preset. Record dense/airy/chunky as a schema follow-up.

Derived values keep an alias `$value`; `$extensions.netscript.derive` describes
their mix. SD's CSS formatter emits `color-mix()` with semantic `var()` operands;
JSON/Figma output receives the computed color. Figma output preserves collection,
mode, variable, scopes, and syntax shape and keeps alias metadata where valid.

The public `@netscript/fresh-ui/tokens` entry provides the build contract and
ships required JSON source assets. Runtime UI entrypoints do not import the
engine. CLI commands use filesystem/process ports through existing dependencies,
with a thin `tokens build|clean|init` group and semantic-only app overrides.
Override validation rejects primitives, components, unknown names, raw semantic
values, and cycles; the override applies last before SD resolution.

Keep `:root` as NS One light, retain the legacy `[data-theme='dark']` selector,
and add `data-theme`, `data-scheme`, `data-density`, and Studio `data-flavor`.
Update templates and theme toggle for the new attributes, preserving old stored
scheme preferences. Font imports and family choices come from generated tokens.
The design route reads generated JSON, including ramps and preset metadata.

## Commit slices and proving gates

1. Sources and resolver: `packages/fresh-ui/tokens/**`, token contracts, resolver,
   importer, focused tests, source documentation. Frozen source build, DTCG
   validation, target-mode/cycle/float/style and 72-input resolver tests.
2. Outputs: SD adapter and formats, build script, theme CSS/JSON/registry/Figma
   outputs, public export/publish assets. Frozen `tokens:build`, deterministic
   output checks, compatibility property diff, Figma shape/derived-color tests.
3. Checks: role manifest, contrast matrix/exclusions, token CI and negative
   controls. Unknown name, raw semantic, and seeded AA violation must fail.
4. CLI: `tokens` command group, port-driven use cases/adapters/composition and
   focused tests. Real scaffold `tokens init/build/clean` with semantic override.
5. Migration: app/design/font/toggle templates, registry asset generation, docs,
   browser harness baseline reconciliation. Scoped wrappers, browser/axe,
   quality/architecture, JSR/doc/publish checks, full scaffold.runtime command,
   then independent IMPL-EVAL and READY.

Every slice commits run evidence, pushes, and posts a PR scope/hash/gate comment.
Substantive review comes from a separate Anthropic-family evaluator; the
implementation session does not certify its own work.

## Required gate set

- Scoped structured check/test/lint/fmt wrappers for changed TS sources, with
  explicit CLI configuration when root exclusions would suppress coverage.
- Frozen `tokens:build` and deterministic `tokens:check`; source/alias/name/
  contrast gates including negative controls; compatibility evidence.
- fresh-ui test suite; CLI command/help/composition/registry/template tests.
- `quality:gate`, relevant design color/primitive guards, generated asset checks.
- Package JSR audits, complete-export doc lint, publish dry-run, dependency
  production-install evidence for the new export. No `any` or casting escape.
- S0 browser harness: NS One baseline and Studio Utility light/dark, no increased
  serious/critical axe findings, baseline selector deltas listed in the commit.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, one pass.
  Missing host prerequisites mean UNPROVEN, never PASS.

## Risks and mitigations

- Incomplete or ambiguous Figma values: preserve approved values and document
  role mappings; no color repair. Contrast exceptions name preset, scheme, pair,
  exact measured ratio, threshold, and Figma source; seeded violations still fail.
- CSS alias behavior vs flattened values: CSS references registered variables;
  tests override primary and confirm derived values remain live.
- Legacy NS One rendering: capture all effective pre-change declarations and
  compare light/dark maps and browser screenshots after build.
- Publication of data assets: update publish include and validate packed/export
  consumption, not only workspace imports. Keep engine off UI imports.
- Tooling unavailable: record exact error and unproven gate. No lock deletion,
  reload, private evidence, label changes, merge, tag, or release.

## JSR surface audit

Applied jsr-audit to the planned `./tokens` subpath: explicit documented exports,
annotated return types, module examples, required JSON in publish include,
no root runtime imports of Style Dictionary, no new slow-type carve-out. Validate
both affected packages with the existing audit and publish tools.

## Deferred and open decisions

No implementation decision is left open. Safely deferred: dense/airy/chunky
schema extensions, S3 component anatomy/state work, S8/S9 runtime fidelity,
Figma value corrections, default switch to Studio Utility, and release cuts.
Contributor entry: `packages/fresh-ui/tokens/README.md`.

## PLAN-EVAL correction: fixed value provenance

Every non-NS-One preset starts with all Scheme roles resolved using this table.
Theme mode aliases may select their own ramps; Base modes do not override them.
The source-density column preserves reviewed Figma geometry as preset-owned
values, without exposing extra density contexts in the public schema.

| Preset | Theme mode | Base gray | Base accent | Studio flavor | Source density | Public fixed density |
| --- | --- | --- | --- | --- | --- | --- |
| ns-one | legacy source | legacy | legacy | — | legacy | comfortable |
| studio-utility | Studio | Neutral | Ink | Utility | Compact | compact |
| studio-cloud | Studio | Slate | Blue | Cloud | Comfortable | comfortable |
| studio-workshop | Studio | Sand | Orange | Workshop | Chunky | comfortable |
| studio-playful | Studio | Mauve | Violet | Playful | Chunky | comfortable |
| studio-ledger | Studio | Slate | Indigo | Ledger | Dense | compact |
| studio-atelier | Studio | Sand | Tomato | Atelier | Airy | comfortable |
| studio-signal | Studio | Neutral | Lime | Signal | Dense | compact |
| tonal | Tonal | Mauve | Violet | — | Comfortable | comfortable |
| bloom | Tonal + Bloom overlay | Mauve | Violet | — | Comfortable | comfortable |
| cupertino | Glass | Slate | Blue | — | Comfortable | comfortable |
| liquid | Glass + Liquid overlay | Slate | Blue | — | Comfortable | comfortable |
| fluent | Fluent + WinUI overlay | Neutral | Blue | — | Comfortable | comfortable |
| brutal | Brutal | Sand | Orange | — | Comfortable | comfortable |
| filigrane | Filigrane | Sand | Tomato | — | Comfortable | comfortable |
| terminal | Signal + Terminal key overlay | Neutral | Lime | — | Compact | compact |
| pixel | Pixel | Sand | Orange | — | Comfortable | comfortable |
| tactile | Tactile + Tactile alias overlay | Slate | Blue | — | Comfortable | comfortable |

Approved gap decisions (all references are to the design reference in research):

- Bloom: retain and register every exported Bloom role, including currently
  unused roles. Remap bg/surface/card/raised/container ladder to canvas/surface/
  surface-high; fg/card-fg to fg; muted-fg/subtle-fg to muted; borders to line/
  outline, input to field-edge, control to control-outline. Primary/accent and
  their fg use hero/on-hero; hover remains hero; subtle/selected/container use
  surface-high. Inverse uses ink-card/on-ink-card. Intent text uses error/success/
  warn; existing Bloom primary/on-primary provides the remaining branded pair.
  **Ring aliases Bloom control-outline**, an existing designed boundary value;
  this is a named mapping decision, not an undefined-value exception. Shared
  decorative roles retain explicitly sourced Scheme values. Fonts are Funnel
  Sans/Funnel Display; type sizes and 2…40 radius scale come from Bloom's mapping.
- Liquid: retain/register all 54 roles and alias matching core surfaces/text/
  intents/boundaries to the Liquid roles, instead of Glass defaults. Core and
  pack success-text use the existing light `liquid/success/text`, and existing
  dark core `success/text` (#71d083), matching the actual node bindings. Inter
  type sizes/lines/weights are taken from Liquid front matter (hero 40/48,
  KPI 26/32, body 13/17, row 14/18, caption 11/14); radii 7,8,10,12,14,16,22
  remain exact. New pink tag, black initials, white knob/label, hairline opacity,
  on-accent rim and selected-avatar ring roles lift the literals in `figma/liquid.md`.
- Terminal: copy the complete Signal core map into its own preset, without any
  Studio flavor dependency. Add component key tokens: light aliases primary/
  primary-fg/input-border; dark aliases muted/input-border/primary-text, the
  three roles that equal the recorded gray/d/3, gray/d/10, lime/d/11 bindings.
- Cupertino: keep/register **all** exported cupertino/* roles, while existing
  core Glass bindings remain authoritative for shared components. Add
  switch-thumb aliasing primary-fg (scheme-aware), and distinct 24/26 container
  radius tokens from the documented literal radii; do not snap the shapes.
- Fluent: apply the exact seven core-to-pack aliases in the Colors section:
  primary, primary-fg, ring, fg, muted-fg, card, input-border. Hover aliases the
  existing fluent/accent/secondary. Preserve black text on dark #60cdff.
- Tactile: alias duplicated grounds/accent/ring/text/boundaries to the matching
  pack roles where equal; otherwise retain their explicitly recorded Theme
  primitives. Use the documented Nunito Sans/Geist Mono and 999/14/24 geometry.
- Pixel: semantic pixel/band/1…5 aliases the five exported band primitives.
- NS One gaps: containers → surface/card/surface-raised; inverse bg/fg → fg/bg;
  hover → muted; selected → accent-subtle; missing intent hover/text → existing
  intent/default; info → secondary; actions → primary/primary-fg/primary-border;
  disabled → muted/muted-fg; material fill/fill-strong/track/stroke → surface/
  surface-raised/muted/border; bevel colors and shadow colors → existing legacy
  color primitives; aurora/block roles → existing copper/teal/slate/amber ramps;
  remaining boundaries → existing input-border/ring/fg. Missing type/geometry
  aliases existing NS One sizes. These add names only; old declarations and
  legacy density values stay unchanged. No missing value becomes an exclusion.

## PLAN-EVAL correction: independent schemas and contrast coverage

DTCG validation uses the official self-contained 2025.10 format and resolver
JSON Schemas from designtokens.org, vendored unchanged with provenance under
`tokens/schemas/`, compiled by Ajv. It validates all source documents and the
resolver; malformed token type/value fixtures fail schema validation. Unknown
context and alias cycles fail the resolver separately. This validation is
independent of the importer, and precedes builds.

`tokens/contrast-pairs.json` is the checked-in coverage registry. Text is 4.5:1,
boundaries/focus are 3:1. It contains explicit pairs and narrowly defined
expansions over registered roles, with a coverage assertion for every exported
fg/on-color/text role; an unpaired text role fails instead of being ignored.
All 36 effective preset/scheme combinations run, and each check composites
alpha foreground/background over the preset ground before measuring sRGB WCAG.

- fg on bg, surface, card, raised, muted, hover, selected and each container;
  card-fg on card; muted-fg/subtle-fg on bg, surface, card and muted; inverse-fg
  on inverse.
- For all seven intents: fg on default and hover; text on bg, surface and subtle;
  on-container on container. action-primary-fg on action-primary-bg.
- ring on bg, surface and card; input-border and border-control on bg, surface,
  card and input fill; component key boundaries on their actual key background.
- Studio badge-solid fg/bg for all five intents; primary fg on bg/bg-hover;
  brand-on on brand/signal-brand; core fg on card/table/nav/tabs/kpi surfaces.
- Bloom every on-* role on its matching fill, fg/muted on canvas/surface/high,
  and status text on canvas/surface.
- Liquid/Cupertino primary fg/default+hover; text fg/muted on every own surface;
  each status text on its own bg; shipped-fg on info-bg; initials on tag hues;
  pack ring/input on their matching surface/field.
- Fluent badge/avatar fg/bg, on-accent/default+secondary+tertiary, primary/
  secondary/tertiary text on solid base, layer/card/control compositions;
  accent text on base/layer; system text on own bg; focus on base/layer/control.
- Tactile strong/body/muted text on base/tone/well; on-accent on accent and
  gradient endpoints; status/accent text on base/tone; edge-control on wells.
- Pixel band foreground uses block-fg on each band; existing core intents cover
  lips/face controls. Decorative shadows/lights have no text use. Disabled
  text is also measured and listed if it fails; it is not silently skipped.

The exception data is separate from this registry, binds exact preset/scheme/
pair/ratio/threshold and source, and rejects stale or unused exceptions. A new
seeded failure is absent from that file and must make CI red.
