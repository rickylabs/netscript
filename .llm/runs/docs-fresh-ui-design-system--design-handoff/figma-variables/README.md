# Figma variables export

All local variables of Figma file `pGRLnkPPRZJZy74evNcQBr`, exported on 2026-10-28. There is one
JSON file per variable collection. `index.json` lists each collection with its file, mode names and
variable count.

| File                 | Collection    | Modes                                                                           | Variables |
| -------------------- | ------------- | ------------------------------------------------------------------------------- | --------: |
| `primitives.json`    | Primitives    | Value                                                                           |       413 |
| `theme.json`         | Theme         | Studio, Ledger, Filigrane, Signal, Tonal, Glass, Brutal, Fluent, Tactile, Pixel |       277 |
| `base-accent.json`   | Base accent   | Ink, Blue, Violet, Orange, Indigo, Tomato, Lime                                 |        32 |
| `scheme.json`        | Scheme        | Light, Dark                                                                     |       446 |
| `density.json`       | Density       | Comfortable, Compact, Dense, Airy, Chunky                                       |        19 |
| `base-gray.json`     | Base gray     | Neutral, Slate, Sand, Mauve                                                     |        26 |
| `studio-flavor.json` | Studio flavor | Utility, Cloud, Workshop, Playful, Ledger, Atelier, Signal                      |       202 |
| `theme-b.json`       | Theme B       | Bloom, Cupertino, Liquid, Terminal, macOS 27, Apple Classic, Fluent 2 Web       |       277 |
| `theme-set.json`     | Theme set     | A, B                                                                            |       277 |

## File shape

```json
{
  "collection": "Scheme",
  "modes": ["Light", "Dark"],
  "variables": [
    {
      "name": "surface/bg",
      "type": "COLOR",
      "scopes": ["FRAME_FILL", "SHAPE_FILL"],
      "codeSyntax": "var(--ns-bg)",
      "values": {
        "Light": { "alias": "Theme set/surface/l/canvas" },
        "Dark": { "alias": "Theme set/surface/d/canvas" }
      }
    }
  ]
}
```

- `modes` lists the collection's modes in Figma order. The first mode is the collection default.
- `variables` is sorted by `name` in UTF-16 code-unit order, so `accent/d/10` sorts before
  `accent/d/2`.

## Variable fields

- `name`: the Figma variable name. Groups are separated by `/`.
- `type`: the resolved type, one of `COLOR`, `FLOAT`, `STRING`, `BOOLEAN`.
- `scopes`: the Figma `VariableScope` list. An empty array means the variable is hidden from every
  property picker in Figma.
- `codeSyntax`: the `WEB` code syntax, for example `var(--ns-bg)`. The key is omitted when the
  variable has no web code syntax. No variable in the file defines another platform's syntax.
- `description`: the Figma description, verbatim, including HTML entities such as `&gt;` as stored.
  The key is omitted when the description is empty.
- `values`: one entry per mode, keyed by mode name.

## Value encoding

- `COLOR`: lowercase hex. `#rrggbb` when alpha is 1, `#rrggbbaa` otherwise. Each channel is
  `Math.round(c * 255)` of Figma's 0–1 float.
- `FLOAT`: the raw number. Figma stores 32-bit floats, so a value entered as `-2.4` reads as
  `-2.4000000953674316`. Round when emitting tokens.
- `STRING`: the raw string. Font family values are family names. Font style values are style names
  as entered in Figma; both `SemiBold` and `Semi Bold` occur.
- `BOOLEAN`: `true` or `false`.

## Aliases

A value that references another variable is written as:

```json
{ "alias": "<Collection name>/<variable name>" }
```

The text before the first `/` is the collection name, and the rest is the variable name. Collection
names contain no `/`. To resolve an alias, find the collection's file through `index.json`, then the
variable whose `name` equals the remainder.

An alias target can be in the same collection or a different one, and can itself be an alias. Figma
evaluates the target in the mode that is active for the target's collection, not in the mode of the
referring collection. For example, `Theme` mode `Studio` aliases `type/display/tracking` to
`Studio flavor/type/display/tracking`, which then takes its value from the active `Studio flavor`
mode.

Every alias target in these files exists in the export: 4,498 alias values point to 1,315 distinct
variables, all local to this file.

## Theme set

Scheme roles alias through `Theme set` rather than straight to a theme collection. `Theme set` has
the same 277 variable names as `Theme` and `Theme B`. Mode `A` aliases each one to the variable of
the same name in `Theme`, and mode `B` to the variable of the same name in `Theme B`, so set `A`
selects Theme and set `B` selects Theme B. Studio flavor and Base accent reach theme variables
through `Theme set` in the same way. For example, `surface/bg` Light resolves through
`Theme set/surface/l/canvas` (set `A`), then `Theme/surface/l/canvas` (mode `Studio`), then
`Studio flavor/surface/l/canvas` (mode `Utility`).
