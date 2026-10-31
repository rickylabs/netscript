# Token sources

The canonical inputs live under `v2/`. `deno task tokens:build` uses the public
`@netscript/fresh-ui/tokens` builder and Style Dictionary 5.7.1 formats to build
all 96 scheme × preset × requested-density inputs. `tokens:check` compares all
88 generated outputs without writing or repairing them. `tokens:validate` checks
source freshness, official schemas, aliases, registered names and contrast. The
CLI and design routes consume the same built preset catalog.

Figma owns values. The registered roles and DTCG resolver own names, tiers and
supported contexts. NS One remains the default. Studio Utility is an additional
preset; it does not switch existing applications.

The nine-collection value snapshot in `figma/` comes from design handoff #2493 at
`dd442e82794c4b960e51529f1c7ac534afda75ea` (2026-10-31), with 2,186 variables. `legacy.json` records
the NS One value source and CSS from S0 #2432. Neither snapshot is a DTCG source.
The `v2/*.tokens.json` documents are DTCG 2025.10; `v2/tokens.resolver.json` is the one
resolver document. Official schemas in `schemas/` are vendored unchanged from
https://www.designtokens.org/schemas/2025.10/format.json and
https://www.designtokens.org/schemas/2025.10/resolver.json.

To extend the system, start here:

1. Add or update the approved Figma value snapshot. An alias reads the target
   collection's active mode, including Base gray/accent and Studio flavor.
2. Declare any new code name in `role-manifest.json` and its language mapping.
   Shared components use core roles; a language pack reads only its own names.
3. Run `scripts/import-figma-tokens.ts` with the package frozen lock. It rounds
   floats, normalizes font styles, lifts raw values into primitives and creates
   semantic aliases. Add component part/state aliases in `v2/component.tokens.json`;
   that file is authored directly and is never overwritten by the importer.
4. Run the token schema, alias-only, name, contrast and build freshness gates.
   Never fix a failing Figma value in code. A contrast exception must name the
   exact preset, scheme, pair, ratio and value source; stale exceptions fail.

The resolver expands sources before Style Dictionary resolves aliases and runs
the registered formats. This wrapper follows upstream issue 1590 and can be
removed when SD supports this resolver natively. It performs no filesystem IO.

Each preset fixes density, gray and accent. Both requested density inputs build,
but do not override those choices. Source geometry from Dense, Airy and Chunky
is retained as preset-owned values and identified in metadata; those names are
not public density contexts. Adding them is a schema follow-up.

Semantic values are whole-token aliases, including derived colors. A mix uses
`$extensions.netscript.derive` with `kind: "mix"`, two token paths, a weight
from 0 to 1, and `srgb` or `oklab`. CSS keeps `color-mix()`; Figma gets the
computed sRGB value. Component tokens alias the semantic vocabulary.
Shadow recipes also retain semantic aliases for color, vertical offset and blur;
their computed composite values match the live CSS references after overrides.

`name-migrations.json` records four ambiguous WEB names in the original Figma
export: Studio rule dimensions collide with Scheme rule colors. Color names
stay unchanged; the dimension names gain `-width`. Original snapshots retain
their source syntax. The importer and round-trip formatter reject a stale
collision mapping; exported collection syntax uses the migrated width names.

The build returns output bytes and resolved contexts and performs no IO. Custom
formats under `src/tokens/adapters/format-*.ts` own serialization. The package
script only compares or writes bytes. Web outputs include `fonts.json` and a
small `theme-preset.json`; registry presets share the common artifacts. The
Figma directory retains original filenames and index fields and adds one
computed Light/Dark collection per preset. Composite values use lossless STRING
variables because Figma has no native shadow/transition variable type.
Dimensions become Figma pixel floats using the existing 16px root conversion;
durations become milliseconds. Unknown units fail instead of losing their unit.
All exported WEB names are checked against the generated role types.

Hex colors form the base CSS declarations. `@supports` blocks enable oklch and
native mixes, since repeating a custom-property declaration cannot detect an
unsupported color function. Exact S0 declarations remain preserved as a fixture.
Provider-specific mono font weight requests live in `font-requests.json`;
families and role weights remain in DTCG.

Existing `--ns-*` declarations and `[data-theme='dark']` remain supported.
Modern selection uses `data-theme` for the language, `data-scheme` for light or
dark, `data-density` for the preset density, and Studio `data-flavor`.
`data-density` reports the preset's effective geometry; it is not a separate
density toggle that overrides that preset.

## Theme set and language presets

Scheme aliases Theme set, whose A mode selects Theme and B mode selects Theme B.
The selected collection then uses its own language mode. Studio flavor, Base gray,
Base accent and Density retain their own active modes throughout the alias chain.
Theme/Theme B/Theme set share WEB names: import emits each once through Theme set.
Unexpected shared names fail; the four existing rule-width migrations remain explicit.

All 24 presets build: NS One; seven Studio flavors; Ledger, Signal, Glass,
Filigrane, Tonal, Brutal, Fluent, Tactile, Pixel; Bloom, Cupertino, Liquid, Terminal;
and the faithful macOS 27 (`macos-27`), Apple Classic (`apple-classic`) and Fluent 2 Web
(`fluent-2-web`). All three faithful modes fully resolve and retain Figma-exported
values without core overlays or fallback to NS One. Legacy-only compatibility roles
remain available in every preset. Base inputs affect only aliases that reach them;
Theme B's own gray/accent values are not replaced by Base collection defaults.

The existing Bloom, Cupertino, Liquid and Terminal ids now select their namesake
Theme B modes. They no longer share Tonal, Glass or Signal scalar defaults. Studio
and Fluent core roles also follow the current export rather than old pack overlays;
Brutal's shadow x comes from Theme set. These are intentional value updates.

`TokenPreset.themeSet` is optional for existing callers (default A), explicit for
built-in presets. New opacity roles are unitless DTCG numbers. DTCG 2025.10 has no
fontStyle type: an Italic style uses a regular fontWeight carrier with exact CSS
and original Figma style metadata; CSS emits `italic` and Figma output retains
`Italic`. Other weight styles remain numeric fontWeight values.

## Validation and contrast feedback

From this package directory:

```sh
deno task tokens:sources:check
deno task tokens:validate
deno task tokens:report
deno task tokens:check
```

`role-manifest.json` is the independent code vocabulary and type contract. Import
and build never regenerate it. Unknown, missing, duplicate or changed-type
exports fail before SD serialization. Source-level alias validation also checks
values that a later modifier would otherwise overwrite.

`contrast-pairs.json` declares intentional foreground/background uses and paint
stacks. Every foreground and named background must be covered in its owning
language; shared roles apply to all presets. Core input/control boundaries and
focus require 3:1, and text requires 4.5:1. Chart series require 3:1 against bg,
card-bg and card, plus the owning Cupertino/Liquid/Fluent chart surfaces. Explicit
l/d chart and surface intermediates are checked only in their matching scheme.
Every code/syntax role requires 4.5:1 on code-bg; removing a required chart surface
or syntax pair fails coverage. The Terminal key variant is measured
in Terminal. Fluent's outer 2px indicator provides the focus contrast; its inner
1px decorative line is not treated as a standalone indicator.

Color.js measures native oklch components with CSS gamut mapping and sRGB
source-over alpha compositing against the opaque preset ground. Hex output does
not quantize the values before measurement. The report includes every measured
use; it does not omit accepted failures from the count.

`contrast-exclusions.json` binds one preset, scheme, pair, threshold, measured
ratio and rendered foreground/background colors, with source provenance and a
reason. Ratios are recorded to twelve decimal places after the AA decision.
Unused, fixed, changed or duplicate entries fail. Figma values stay unchanged;
the owner corrects and re-exports them. Inherited S0 color failures are separately
identified to preserve NS One compatibility. Newly introduced NS One gaps use
suitable existing palette aliases rather than adding avoidable exceptions.

The required negative controls deliberately exit nonzero:

```sh
deno task tokens:validate --negative-control=unknown-name
deno task tokens:validate --negative-control=raw-semantic
deno task tokens:validate --negative-control=contrast
```

The package tests invoke the real checker for all three controls. A separate
policy regression rejects unpaired roles, missing focus checks, weakened text
thresholds and stale exclusions. `tokens:report` emits JSON on stdout; the normal
validation task also prints its source-freshness preflight.

The internal report script re-measures with zero exclusions, so fixed exceptions
cannot survive a refresh. From this package directory, after updating source inputs
and embeddings:

```sh
deno run --lock=deno.lock --frozen --allow-read --allow-write --allow-env scripts/report-token-contrast.ts --write-exclusions --report-dir ../../.llm/runs/<run>
deno task tokens:embed
```

It writes every failing pair with preset, scheme, foreground role, background paint
stack, unrounded-decision ratio and required ratio to `failing-pairs.json`. The short
`failing-pairs.md` table shows the worst relative failure and count per preset/scheme.
Omit `--write-exclusions` for a report without updating policy. Contrast value
burn-down stays open for the Figma owner; the report is feedback, not a value fix.

## Consuming app commands

From a NetScript workspace, select an app with `--app dashboard` (or point
`--project-root` to the Fresh app itself):

```sh
netscript tokens init --app dashboard --preset studio-utility
netscript tokens build --app dashboard
netscript tokens clean --app dashboard
```

Init copies the eight bundled DTCG source documents into `tokens/source/`, writes
`tokens.config.json`, and creates `tokens/semantic.tokens.json`. Existing copies
require explicit `--force`. Edit the final alias layer, for example:

```json
{
  "semantic": {
    "radius-md": { "$type": "dimension", "$value": "{semantic.radius-lg}" }
  }
}
```

Build validates all contexts before writing five core web assets. Add `--previews` to write the 24 separate development preview styles. App builds skip catalog-only Figma formats. The public
builder owns DTCG, alias, reference, type and name validation. CLI application
logic uses the existing filesystem port; its lazy engine adapter imports this
package's public `tokens` entrypoint only for token commands. Clean retains the configured `theme-preset.json`, app
styles, settings, overrides and source copies; it loads only lightweight file metadata. Build also works before init using
bundled sources, retaining an installed registry preset and detecting the
conventional override when present. The detailed command reference documents
configuration and explicit override precedence.

New scaffolds read font requests and fixed preset axes from the generated JSON.
`data-theme` is the language, `data-scheme` is light/dark, `data-density` reports
fixed geometry, and Studio adds `data-flavor`. The toggle retains the `ns-theme`
preference key. The legacy light/dark data-theme selectors remain supported.
See docs/site/web-layer/how-to/customize-fresh-ui.md for merging this into an
existing app-owned shell and registry copies. NS One remains the default;
`/design/tokens?preset=studio-utility` previews Utility in development only.
Leaving a language preview uses document navigation: its root attributes, fonts
and optional stylesheet belong to the document shell, outside Fresh's page partial.
Home and Components therefore restore the configured preset; browser Back restores
the preview.

Authoritative JSON is embedded as gzip-compressed typed TypeScript for publication; raw JSON and registry copy sources are excluded from the published file set. Registry data loads only inside CLI registry commands. Run
`deno task tokens:embed` after editing source JSON and `tokens:embed:check` to check
freshness without changing files. `tokens:build` refreshes these embeddings before
and after generating outputs; the token, source and registry asset checks verify them.


## CSS loading budget

Every app stylesheet contains its configured light/dark preset and NS One
compatibility only (two effective contexts for NS One, four for another preset).
The build also emits `presets/<id>.css` for all 24 presets. A theme registry item
installs its own CSS as assets/tokens.css. Install `ui:add theme-previews` or run `tokens build --previews` to opt in to separate files under
static/presets; the development shell links one only when an allowlisted design
preview differs from the configured preset. Normal app pages load no preview CSS.
All 96 inputs still build, and all 88 outputs participate in read-only freshness.
The CLI writes five core files by default and 29 with `--previews`. Clean removes generated CSS/catalog/font files and any known preview CSS, preserving the selected preset, settings, source files and app styles. CI bounds app contexts/declarations and
bytes so unrelated preset CSS cannot return to the default stylesheet.

The native publish-file-set test enforces a 5,000,000-byte total budget for the
uncompressed package sources. Default NS One token CSS has a 6,000-byte gzip
budget: legacy CSS is an exact byte prefix, core/component aliases retain their
transitive dependencies, and unused language packs/ramps stay in design data.
Production routes import only preset/font metadata; the full manifest and preview
resolver are reachable only through development design routes. `--force` replaces
the managed `tokens/source/` tree, including stale files.

The exported Figma emphasis names (`weight-em`, `studio-weight-em`) currently mix
Italic with numeric body weights across modes. They cannot be used in one fixed CSS
font property across every preset. Consumers must inspect `sourceStyle`/`figmaStyle`
when present; a standard DTCG reader sees the regular-weight carrier for Italic.
The architecture debt register tracks splitting style and weight names before the
next stable design-system release. No shipped component currently consumes them.
