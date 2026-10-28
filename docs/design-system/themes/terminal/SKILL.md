---
name: fresh-ui-theme-terminal
description: Build, extend or review NetScript Fresh UI screens in the Terminal theme (a Charm-style TUI on a character grid with rounded Lip Gloss panes, one Geist Mono 14/24 scale, bracketed keys and an inverse lime selection bar). Use when a project sets data-theme="terminal", asks for a TUI, terminal, console, lazygit, Charm, Bubble Tea or keyboard-first developer look, or adds panes, tables, logs or a light mode to a Terminal app.
---

# Terminal theme

Read `DESIGN.md` in this folder first; it has the tokens and the full specification. This file is
the procedure. Cross-theme rules are in `docs/design-system/GUIDELINES.md`, shipped as the
`netscript-design` skill.

## Use it when / don't use it when

- **Use for:** developer tools, ops, support and on-call consoles, log and queue viewers,
  keyboard-driven admin.
- **Don't use for:** consumer products, onboarding, marketing pages or touch-first screens. Suggest
  Studio instead; its Signal flavor keeps the mono type and lime accent with normal controls.

## Thesis

The screen is a Charm-style terminal UI. Every glyph sits on a 1ch × 24px grid, panes are rounded
Lip Gloss boxes with titles set into the border, and the keyboard is the primary interface.
Signature moves:

1. One character grid (1ch = 8.4px at Geist Mono 14px) and one 14/24 scale for every pane.
2. Panes: 8px-rounded 1px boxes, inset `┤ title ├`, active pane = 2px lime border + `[focused]`.
3. Inverse-video lime selection with `▶`, bracketed keys `[ save ctrl+s ]`, a `key desc • key desc`
   help bar.

## Hard rules

- MUST size every fixed column in whole ch and reserve the 2ch marker cell on every row, header
  included, so selection never shifts columns. Give the leftover width to one `minmax(0, 1fr)`
  track, resolved inside the pane after padding, border and gaps. Orders:
  `2ch 12ch 25ch minmax(0, 1fr) 17ch 10ch 18ch 12ch` at 14/24. NEVER shrink type or clip columns to
  make the widths fit.
- MUST keep one Geist Mono 14/24 scale across panes, consistent pane padding 22/16/16/16 and 20px
  gaps, and dim secondary columns to `muted-fg`. Without them, panes are hard to read, columns drift
  and the screen looks like raw terminal output.
- MUST style the active pane (the one containing DOM focus, `:focus-within`) with a 2px
  `border/ring` pane border and a `[focused]` title suffix; the help bar lists only that pane's keys
  plus global keys. Active-pane styling is separate from DOM focus.
- MUST keep every editable prompt, check and key reachable and operable by keyboard, each with its
  own visible focus indicator. Document an entry and exit route for each composite (table, tab line,
  log); use roving focus only inside composites (tab lists, list and table rows). NEVER suppress
  native control focus to imitate a TUI.
- MUST treat the `tab switch pane` help-bar hint as provisional until the keyboard map in #2416
  specifies its dispatch; don't take `Tab` away from normal control-to-control navigation, and don't
  claim keyboard behaviour from a PNG.
- MUST give global commands modifiers (`shift+n` create, `ctrl+s` save); `⏎` belongs to the focused
  pane. A key's label must match the help bar.
- MUST explain status codes with a legend (`[ OK ] paid  [WAIT] …`) and put the repair line directly
  under an invalid prompt.
- NEVER fill the selected tab or the primary key with a pale slab in dark. Dark selected tab:
  `surface/hover` fill + 2px `ring` underline. Dark Save: `#222222` key, 1px `#7b7b7b` edge,
  `#bde56c` label. The lime selection row is the one intentional inverse surface.
- NEVER add shadows, glows, blur, gradients or proportional type. Show depth with border weight.
- NEVER signal status by colour alone; every status is a bracketed word.
- MUST only read semantic roles (`--ns-*`). Never use primitives. The one existing exception is the
  dark Save key, bound to `gray/d/3`, `gray/d/10` and `lime/d/11` until a scheme-aware key role
  lands in #2414; do not copy that pattern.

## Building a screen

1. **Enable the theme:** `data-theme="terminal"`, `data-scheme="dark|light"` (dark is the
   reference), `data-density="compact"`. The Figma Theme mode is the shared `Signal`; all names are
   provisional until the token export in #2414.
2. **Compose:** a 32px status line, a 43px numbered tab line, panes inside 20px outer padding (28
   top) with 16px between side-by-side panes, and a 33px help bar pinned to the bottom. One pane is
   active at a time: the one that contains DOM focus.
3. **Pick variants:**

   | Need             | Use                                                                  |
   | ---------------- | -------------------------------------------------------------------- |
   | Primary action   | `Terminal/Key` Primary: `[ verb shortcut ]`                          |
   | Secondary action | Key Default: 1px `border-strong`, `[ cancel esc ]`                   |
   | Inline shortcut  | Key Hint: 18×16 keycap + description                                 |
   | Text input       | `Terminal/Prompt field`: `label:` line, `> value` line, block cursor |
   | Boolean / choice | `Terminal/Check`: `[x]` `[ ]` / `(•)` `( )`                          |
   | Status           | `Terminal/Status`: `[ OK ]` `[WAIT]` `[SHIP]` `[FAIL]` `[RFND]`      |
   | Navigation       | `Terminal/Tab`: `n:label`                                            |
   | Region           | Lip Gloss pane with inset title                                      |
   | Chart            | Block trend bars or a block progress bar with dithered remainder     |

4. **Use the signature objects** where they carry meaning: the lime bar marks _the_ selected record;
   the `[focused]` border marks keyboard ownership; keycaps document real shortcuts only.
5. **Handle states:** active pane = 2px `ring` border plus `[focused]`; each focused control also
   shows its own visible focus; selection = inverse lime row with `▶`; error = label and prompt in
   `destructive-text` with `✗` and a repair line; the block cursor shows only on the focused field.
   Hover, pressed, disabled, the editor-focused variant and the keyboard map are pending in #2416;
   width behaviour (960px with pinned id and total) and keyboard proof in #2419.

## New components or screens

- Start from the closest existing component's variant. Keep the ch grid, 24px line box, square keys
  and 8px panes.
- If you need a new visual role, add it as `terminal/<path>` and register it in code (#2414). Don't
  reuse an unrelated role, and don't add another Theme-mode value to `Signal`, which Studio shares.
- Add the new component to a state sheet, in Light and Dark. Terminal has none yet.

## Self-check before handing off

- [ ] Recognisable as Terminal at a 480px thumbnail: boxed panes, mono grid, one lime bar.
- [ ] Dark audit: no white or pale tab, key, header or outline; only the selection row is lime.
- [ ] Text ≥ 4.5:1; active-pane border and key edges ≥ 3:1. Measured on pixels.
- [ ] Every prompt, check and key is reachable by keyboard with its own visible focus; each
      composite has a documented way in and out.
- [ ] Every column start lines up across header, normal and selected rows (sample the x positions).
- [ ] Whole-pixel edges; bound paints seeded with their resolved colour (Figma).
- [ ] Every key label matches the help bar; every status code is in the legend.

## References

`DESIGN.md` → Sources.
