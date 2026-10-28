# Fluent — Figma map

Internal map for implementers. The public specification is
`docs/design-system/themes/fluent/DESIGN.md`; this file keeps the node-level facts it no longer
carries.

## File and modes

- Figma file `pGRLnkPPRZJZy74evNcQBr`, page `53:2`.
- Theme mode `Fluent` (mode id `52:0`). `radius/card` is 8 in this mode. No non-Fluent frame uses
  the mode.
- The core `primary`, `primary-fg` and `ring` of the mode store the WinUI values as raw values; no
  primitive exists for them. Theme-mode `ring/d` is `#8d8d8d`, aligned with `fluent/focus/outer`.
- The current frames read only `radius/*` from Theme, so core-role changes do not re-render them.
- Density: none bound (WinUI defaults).

## Frames

| Frame                                              | Node                                 |
| -------------------------------------------------- | ------------------------------------ |
| Light desktop / window                             | `155:737` / `155:746`                |
| Dark desktop / window                              | `158:922` / `158:931`                |
| Components sheet (Light / Dark panels)             | `159:1106` (`159:1107` / `159:1330`) |
| Library                                            | `153:730`                            |
| Icons (51 components)                              | `152:729`                            |
| Superseded Fluent 2 web frames (not the reference) | `55:19`, `58:206`                    |

## Library components

| Component          | Node      | States                                             |
| ------------------ | --------- | -------------------------------------------------- |
| Button             | `153:780` | Rest, hover, pressed, disabled, focus              |
| TextBox            | `153:805` | Rest, hover, focus, error, disabled                |
| ComboBox           | `153:822` | Rest `153:811`, Hover `153:817`, Pressed `153:818` |
| ToggleSwitch       | `154:742` | On / off                                           |
| CheckBox           | `154:751` | Checked / unchecked                                |
| NavigationViewItem | `154:768` | Rest, hover, selected                              |
| ListViewItem       | `154:779` | Rest, hover, selected                              |
| Badge              | `154:790` | Five statuses                                      |
| Avatar             | `154:803` |                                                    |

## Role bindings

- `fluent/*`: 79 Scheme roles (`--ns-fluent-*`).
- Every solid paint in the Light window binds a `fluent/*` role (0 unbound). Radii bind
  `radius/control` and `radius/card`.
- Not componentised: SettingsCard rows, KPI cards and table rows are frames.

## Variables changed from the native WinUI value

| Variable                          | Node       | Value                                                |
| --------------------------------- | ---------- | ---------------------------------------------------- |
| `fluent/text/on-accent-secondary` | `150:1158` | Opaque `#ffffff` light / `#000000` dark              |
| `fluent/accent/tertiary`          | `150:1173` | Light `#0054a3` at 1; dark `#60cdff` at 0.8 (native) |
| `fluent/focus/outer`              | `150:1185` | Dark `#8d8d8d`; the six focus effects resolve to it  |

## Node bindings

| Element                                 | Nodes                                | Binding                                                                   |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| ComboBox Rest / Hover bottom edge       | `153:811`, `153:817`                 | `stroke/control-strong`                                                   |
| ComboBox Pressed bottom edge            | `153:818`, edge node `199:5993`      | 1px `stroke/control-strong`; all 8 instances inherit it                   |
| "0 / 500" counter                       | `156:964` (light), `158:1285` (dark) | `fluent/text/secondary` (`#5f5f60` on `#f9fafb` 6.10:1; `#d0d0d0` 8.45:1) |
| Superseded `Fluent/Input` and textareas | `53:26`, `57:248`, `58:503`          | `border/input` re-seeded (stored `#000000`); no current node affected     |

## Node-level exceptions

None. No primitive or raw value is bound on a current node.

## Renders

Under `.llm/runs/design-system-s4--language-review/`:

- `renders-r7/fluent--{light,dark,components}.png`, hashed in `renders-r7/SHA256SUMS` (sha256
  `092b1cd4…`; review input commit `affd6b158`). They show the native WinUI values for the pressed
  accent label, the ComboBox edge and the dark focus outer.
- Superseded Fluent 2 web frame: `renders-r7/fluent-r5-rejected--dark.png`.
- The exports with the NetScript overrides overwrite
  `renders-r6/fluent--{light,dark,components}.png` (not hashed).
- WinUI source keys for every value: the run's `fluent-sources.md`.
