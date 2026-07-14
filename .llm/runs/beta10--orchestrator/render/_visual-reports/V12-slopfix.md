# V12 Extensions — Fresh UI slop fix

## Design question

*"What tailored components, layout, composition, data-visualization, and data-structure best showcase EXTENSIONS — installed add-ons that mount contributions into host surfaces — and how do they compose together?"*

A compact contribution console: a flat summary card with one segmented contribution-by-surface
bar; a dense provider roster paired with a sticky manifest detail; a surface view organized as
aligned panel/command/tool lanes; and an available list with contract-compatibility facts. Providers
remain the primary records, contributions are grouped by host surface, and selection reveals source,
version, trust, contract, permissions, and mount points. The surface bar carries the only chromatic
signature; flat cards, internal hairlines, neutral metadata tags, and one pressed primary Install
action supply the Fresh UI grammar around it.

## Slop-checklist result

| # | Violation found before | Fix applied | Result |
| --- | --- | --- | --- |
| 1 | The overview, provider rows, manifest, lanes, mount tiles, and available cards mixed colored borders, colored side rails, and 6–12px rounding. | Rebuilt the visual containers with real Card grammar: `--ns-card`, `--ns-shadow-xs`, zero outer border/radius, and `--ns-border` internal rules. Removed every colored side/top rail. | PASS |
| 2 | Decorative diamonds, warning marks, surface glyphs, permission glyphs, arrows, colored pips, and pill controls appeared throughout all three views. | Removed the S16 decorative glyph nodes. Recast filters, counts, tiers, mounts, providers, versions, and permissions as 4px DM Mono uppercase tags. Kept only the small status dot because it carries enabled state. | PASS |
| 3 | Copper, teal, amber, success teal, and warning amber competed across cards, icons, rails, badges, and meters. | Reserved copper/teal/amber for the single overview contribution-by-surface bar and its legend. Supporting meters, provider micro-bars, lane meters, tags, and selected states are neutral ink-on-surface. Warning remains only where it communicates a held contract; copper remains on the one primary Install action. | PASS |
| 4 | Rounded grids created excess gutters; mobile stacked large boxes; contribution paths used clipping/ellipsis; lanes left uneven visual mass. | Tightened the summary and rows, used `min-width: 0` and wrapping/`overflow-wrap`, removed value ellipsis, stretched Available cards equally, and composed the tall Panels lane beside stacked Commands/AI Tools lanes. Playwright found zero horizontal overflow and zero visible template holes in 12 Extensions variants. | PASS |
| 5 | The Surfaces view used disconnected colored cards and ornamental lane caps rather than a coherent contribution map. | Removed fake connector/rail decoration. The view is now an aligned two-column surface composition with one tall panel lane, two stacked secondary lanes, shared row rules, bottom-pinned summaries, and no implied graph geometry. | PASS |
| 6 | The lede read like landing-page prose: “Every UI contribution in the app … The dashboard is itself a plugin.” The held state used explanatory filler. | Replaced it with “Installed add-ons and the host surfaces they extend.” Reduced quarantine copy to “Held: built for contract v1; host contract v2.” Labels remain terse and developer-side. | PASS |
| 7 | S16 hand-rolled outlined cards, saturated pills, compatibility boxes, and badges diverged from Fresh UI primitives. The block also contained raw hex and non-sanctioned color mixing. | Matched `card.css`, `badge.css`, `data-table.css`, `detail-layout.css`, `button.css`, and `inline-notice.css`: flat Card surfaces, hairline row divisions, 4px metadata tags, grid structure without chrome, and token-only colors. The Pass V12 block contains no raw hex or raw RGBA. | PASS |
| 8 | The contribution concept was strong, but multiple colored micro-bars, rails, icons, and hard shadows competed to be the signature. | Made the segmented contribution-by-surface bar the single feature signature. Kept exactly one hard-offset `3px 3px 0` press shadow on the visible Install action; computed-style verification found exactly one. | PASS |
| 9 | Accent rails, glyph boxes, tinted group headers, and dashed separators were ornamental rather than structural. | Removed them. Remaining structure encodes data: surface proportions, enabled ratio, contract compatibility, selected provider, contribution grouping, mount points, and permissions. Internal rules separate real row/group boundaries. | PASS |
| 10 | Body-font pills, mixed-case tags, oversized glyph gutters, and four airy header blocks weakened scan hierarchy. | Metadata now uses DM Mono, uppercase, `.08em` tracking, fit-content width, and 4px radius. Headings stay DM Sans/Mono at restrained sizes; the summary is a contiguous strip and contribution rows are dense with consistent breathing room. Computed styles confirm DM Mono, uppercase, and 4px tag radius. | PASS |
| 11 | Reference ideas had accumulated decoration instead of retaining the references’ density and restraint. | Summary strip follows `11-devconsole-a.png`’s contiguous RECORDS/SIZE/PARTITIONS metric rail; provider rows follow its dense records-table rhythm; manifest contribution rows follow `19-pm-dashboard.png`’s compact My Projects metadata rows; Surfaces uses `21-flow-builder.png`’s primary-canvas/secondary-palette composition without inventing connectors; Available uses the compact contract/action density of `11-devconsole-a.png`’s side panel. | PASS |
| 12 | The page risked repeating the rounded-card dashboard grammar used elsewhere; Providers and Surfaces also repeated each other’s card treatment. | Extensions now has a distinct provider → manifest → surface composition and a single segmented contribution signature. Providers is roster/detail, Surfaces is lane composition, and Available is contract/install comparison. All 16 routes were clicked successfully after the change; each produced its expected screen label. | PASS |

## Before / after

Before, the screen read as a branded template: rounded colored outlines on nearly every object,
decorative diamonds and warning glyphs, copper/teal/amber repeated across the entire viewport,
marketing copy, full-height accent rails, and several press shadows. The provider roster was harder
to scan because icons and tags consumed the first read; the Surfaces view looked like three unrelated
card stacks; Available used colored rails and boxed compatibility widgets.

After, the hierarchy survives the squint test: title and view control; one flat summary strip; the
colored surface-distribution signature; then the active working view. Provider records and manifest
metadata read as one dense console, Surfaces aligns one primary lane against two secondary lanes,
and Available compares two equal-height contract records. Dark mode preserves the same hierarchy
without gradients or special-case tint decoration.

Screenshots are in `V12-slopfix-shots/`:

- `before/` and `after/` each contain desktop light Providers, provider selection, Surfaces,
  Available, desktop dark Providers/Available, mobile light Providers/Surfaces, and mobile dark
  Available.

## Verification

- Browser: headless Chromium at the required Playwright executable.
- Extensions matrix: Providers / Surfaces / Available × 1440 / 390 × light / dark = 12 variants.
- Provider interaction: six providers found; selecting the second provider produced exactly one
  selected row and updated the manifest.
- Layout/content: zero horizontal overflow, zero visible `{{ }}` holes, and zero decorative S16
  glyphs in every variant.
- Console: zero application console errors and zero page errors (the static-server favicon request
  was fulfilled by the browser harness so it could not pollute the application-error gate).
- Component grammar: all visible summary/provider/manifest/lane/available cards computed to
  `border-radius: 0` and zero outer border; metadata tags computed to DM Mono, uppercase, 4px radius.
- Signature: exactly one visible `3px 3px 0` hard press shadow, on `Install`.
- Regression: all 16 navigation buttons rendered the expected `data-screen-label`; all had zero
  horizontal overflow and zero visible template holes.

## Honest gaps

- Per owner direction, this slice did not produce a new PLAN-EVAL or GLM evaluator report. The
  original dashboard-design run already has PLAN-EVAL PASS; this focused visual refinement was
  verified directly with screenshots and browser assertions.
- The other 15 routes were regression-clicked and measured, but were not re-screenshotted because
  the requested visual scope is Extensions only.
