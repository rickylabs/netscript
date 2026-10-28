# Token sources

**Status: staged S1 implementation, not ready to use.** Independent source review
still blocks the new NS One line-height mapping. The new inputs live under
`v2/` so the existing S0 build continues to read its unchanged legacy inputs.
The output engine, name/contrast gates, public tokens CLI, fonts and route
migration remain unimplemented. Do not switch an app to these sources yet.

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
   semantic aliases. Add component part/state aliases in `component.tokens.json`.
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

Existing `--ns-*` declarations and `[data-theme='dark']` remain supported.
Modern selection uses `data-theme` for the language, `data-scheme` for light or
dark, `data-density` for the preset density, and Studio `data-flavor`.
