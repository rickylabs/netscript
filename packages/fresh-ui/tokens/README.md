# Token sources

The canonical inputs live under `v2/`. `deno task tokens:build` uses the public
`@netscript/fresh-ui/tokens` builder and Style Dictionary 5.7.1 formats to build
all 72 scheme × preset × requested-density inputs. `tokens:check` compares all
68 generated outputs without writing or repairing them. `tokens:validate` checks
source freshness, official schemas, aliases, registered names and contrast. The
CLI and route migration are the remaining S1 slices; the draft PR is not READY.

Figma owns values. The registered roles and DTCG resolver own names, tiers and
supported contexts. NS One remains the default. Studio Utility is an additional
preset; it does not switch existing applications.

The value snapshot in `figma/` comes from design handoff #2427 at
`e6ff8413683911a3a7ef82b0edacdc97ffdecb8c` (2026-10-28). `legacy.json` records
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
focus require 3:1, and text requires 4.5:1. The Terminal key variant is measured
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

Build validates all contexts before writing five core web assets plus 18 optional preview styles. The public
builder owns DTCG, alias, reference, type and name validation. CLI application
logic uses the existing filesystem port; its lazy engine adapter imports this
package's public `tokens` entrypoint only for token commands. Clean retains app
styles, settings, overrides and source copies. Build also works before init using
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


## CSS loading budget

Every app stylesheet contains its configured light/dark preset and NS One
compatibility only (two effective contexts for NS One, four for another preset).
The build also emits `presets/<id>.css` for all 18 presets. A theme registry item
installs its own CSS as assets/tokens.css. The18 separate preview files live under
static/presets; the development shell links one only when an allowlisted design
preview differs from the configured preset. Normal app pages load no preview CSS.
All 72 inputs still build, and all 68 outputs participate in read-only freshness.
The CLI manages 23 files (five core plus 18 optional CSS assets), and clean retains
all settings, source files and app styles. CI bounds app contexts/declarations and
bytes so unrelated preset CSS cannot return to the default stylesheet.
