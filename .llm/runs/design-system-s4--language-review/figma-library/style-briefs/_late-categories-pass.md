# Late-categories style pass (per style)

This pass covers the five base categories built after the first style passes: Data display 2,
Layout & blocks, AI, Desktop and Docs kit. Every component in the base library must exist in every
style. That is the shadcn style model: one contract, one set per style, and swapping restyles.

Builder protocol: `_builder-protocol.md`, plus `_budget-protocol.md` (Correction section). Run at
most 3 builders, at about 3 calls a minute each. On a refusal, back off and resume.

Each style gets two passes, each sized for one builder session:

| Pass | Categories | Base ids | Showcase screens |
| --- | --- | --- | --- |
| **A** | Data display 2 (D8–D14), AI (I1–I12) | `ledger-dd2.json`, `ledger-ai.json` | `chat` |
| **B** | Layout & blocks (L1–L12), Desktop (K1–K6), Docs kit (X1–X9) | `ledger-layout.json`, `ledger-desktop-docs.json` | `docs-article`, `desktop-app` |

## Per style, per pass

1. **Clone, then restyle each base set** as `<Style>/<Component>` on the style's theme page, under a
   new section per category. Keep the same property names, variant values and layer names, so an
   instance swap keeps overrides. Private helper sets (names starting with `.`) are cloned only when
   a public set nests them. Doc-only entries (L12 Direction, K6 Desktop only) get no set.
2. **Swap nested instances to the style's own sets** wherever they exist: Button, Icon button,
   Badge, Card, Sheet, Sidebar, Top bar, Menu content, Tooltip, Input, Textarea, Avatar, Progress,
   Skeleton, Spinner, Alert, Inline notice, Empty state, and the Code block from pass A.
   - After every nested swap, restore part layer names from the base, and re-apply text and
     overrides. `resetOverrides()` and nested swaps reset them.
   - Re-apply table row tones and avatar initials.
   - Reset stray opacity overrides on buttons. Scrims are 60%, never opaque.
   - Set `figma.skipInvisibleInstanceChildren = false`.
3. **Where the style's look comes from,** in this order:
   1. the style's existing sets (its Card, Dialog, Menu, Table, Alert);
   2. `style-briefs/<theme>.md`;
   3. the theme's DESIGN.md (`docs/design-system/themes/<theme>/DESIGN.md` on `origin/main`;
      read it with `git show`);
   4. its crafted frames.

   The aim is **truly unique per style**. Change structure, shape, surface, motion cues and
   typography, not just colour. A Pixel switch is square; a Terminal panel is a bordered pane with
   a title in the border.
4. **Category notes:**
   - **Data display 2:**
     - The Code block uses the style's code surface and `code/syntax/*` bindings, never literals.
     - Charts, Chart block and Donut keep `chart/1…5` bindings. Per-theme palettes come from the
       variables, so never override series colours.
     - Restyle the axis, grid, legend and tooltip chrome.
     - Accordion, Collapsible and Carousel get the style's disclosure language.
   - **AI:** messages, bubbles, the tool call card, prompt input, the model selector and the MCP
     widget, all in the style's own idiom. Examples:
     - Terminal: log lines and a `>` prompt;
     - Pixel: dialogue boxes;
     - Brutal: sticker bubbles;
     - Cupertino: Messages-style bubbles;
     - Fluent: the Copilot pane;
     - Filigrane: a typeset transcript.

     Tool status uses the status tones. Red is only for errors.
   - **Layout:**
     - App shell nests the style's Sidebar and Top bar.
     - Density, panel surfaces, separators, scrollbars and resizable handles take the style's
       language (Terminal box-drawing, Pixel chunky bevels, Tactile wells).
     - Mobile: the sidebar is a sheet over a 60% scrim.
   - **Desktop:**
     - Window chrome takes the style's platform voice (Cupertino and Liquid: macOS; Fluent: WinUI
       caption buttons and Mica; Terminal: a tmux or console title bar; Pixel: the Ore UI window;
       Brutal: a sticker window).
     - Keep the macOS, Windows and Linux variants.
     - Notifications and the update prompt follow the style's Toast.
   - **Docs kit:**
     - Prose uses the style's type scale and voice.
     - The File tree, chips, TOC, Ruled grid and Hero take the style's language.
     - Callouts are the style's Alert, and code is the style's Code block (pass A; if it doesn't
       exist yet, use the base and note it).
5. **Dark is designed, never inverted.** Check every dark render for flipped ink roles.
6. **Swap test:** swap base to style on at least five representative instances per category.
   Overrides, text and part names must survive. **Then** do the review frame (Utility-style
   light | dark), a strip, and the PNGs in `review/styles/<theme>/<category>.png`.
7. **Showcase screens:** in that style's group on "Screens · Archetypes" (`514:94470`, see
   `ledger-screens.json`):
   - duplicate the base composed screen for the pass (chat `595:185594`, docs article `601:3073`,
     desktop app `594:3154`);
   - set the style's modes;
   - swap programmatically;
   - restore names, overrides and tones.

   Save to `review/screens/<theme>/<screen>-<light|dark>.png`.
8. **Ledger:** `ledger-late-<A|B>-<theme>.json` (set ids, swaps, fixes, deviations).

Don't write `state.json`. Don't touch git (except a read-only `git show`), the repository, base sets
or other styles' pages.
