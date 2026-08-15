# V12 Extensions — component rethink

## Design question

*"What tailored components, layout, composition, data-visualization, and data-structure best showcase
EXTENSIONS — installed add-ons that mount contributions into host surfaces — and how do they compose?"*

Extensions should read as a registry and mount map, not a metrics dashboard. The composition starts
with one compact inventory summary whose only visualization is the legitimate contribution-by-surface
proportion. Providers are selectable records with explicit columns for identity, version,
contributions, trust, source, and status; selection opens a manifest assembled from grouped
contribution rows. Surfaces invert that same data into three host-surface record groups, each with a
count and mount context. Available extensions are install-candidate records with categorical
contract facts, contribution tags, hold state, and action. Together these components express the
real relationship: providers contribute discrete items, and host surfaces receive those items.

The reference lineage is component-level: `11-devconsole-a.png` supplies the contiguous summary rail
and dense records rhythm; `19-pm-dashboard.png` supplies compact status-bearing rows; and
`21-flow-builder.webp` supplies the provider-to-host mental model while avoiding invented graph
connectors. The colored segmented surface split is the single signature. Everything else is quiet
table structure, factual text, compact tags, or status.

## Component decisions

| Existing element | Decision | Reason |
| --- | --- | --- |
| Contributions by surface segmented bar | Keep | It encodes a true 6:2:2 proportion and filters the registry. |
| Enabled coverage bar | Replace with `enabled / installed` text and disabled count | Six of six is a categorical availability fact; the bar added no comparison value. |
| Provider cards and contribution micro-bars | Replace with selectable data-table rows and contribution tags | Providers are records; `+1 panel` and `+1 tool` are the complete discrete data. |
| Surface share bars | Remove; use group count, mount context, and dense rows | The header already shows the global proportion; repeating it per group was redundant. |
| Available compatibility bars | Replace with built-for and host contract fact rows | Contract v1 versus v2 is a version mismatch, not progress toward a goal. |
| Available card pair | Replace with one registry table | Install candidates are comparable records, not dashboard tiles. |

## Kimi validation rounds

### Round 1 — 48 / 100

Kimi found five wrong-component choices and eleven craft issues. The bars were correctly gone, but
scalar metadata still wore badge chrome: contribution counts, surface providers, contract versions,
the first-party count, and the held state. It also flagged the desktop detail and mobile summary as
too roomy, and requested an explicit selected-provider mobile state.

Fixes: converted those badges to plain aligned metadata; made contract versions categorical fact
rows; reduced the manifest to a dense definition-list side panel; removed the duplicate held badge;
compressed the mobile summary; and added the selected-provider bottom-sheet shot. Kimi also asked to
rewrite capability descriptions, but that was not applied because the owner locked copy meaning.

### Round 2 — 82 / 100

Kimi reported **zero wrong-component findings**. It confirmed that enabled coverage, provider
contribution counts, surface shares, and compatibility were now represented as text/records, and
that the segmented 6:2:2 surface bar was the sole justified visualization. Four craft issues
remained: the rounded primary switcher, mobile Available density, prose treatment for compatibility
and hold information, and mobile summary height.

Fixes: retained the primary switcher because it is the repository's existing Fresh UI tabs/segmented
grammar rather than a hand-rolled ornament; restored the real Fresh UI button interaction states;
added canonical `ns-card` and `ns-data-table` composition classes; tightened mobile Available rows;
and reduced the mobile summary from three bands to a 2×2 composition. The held state remains a real
Fresh UI `InlineNotice` because it is actionable warning state, not generic metadata.

### Round 3 — 98 / 100

Kimi reported **zero wrong-component findings and zero slop findings**. It confirmed that the
segmented surface split is the sole visualization; that Providers, Surfaces, and Available are now
record structures; and that desktop side-panel plus mobile bottom-sheet are the correct detail
carriers. It also accepted the canonical Fresh UI segmented control, Card, DataTable, InlineNotice,
and hard-offset Button treatments as system primitives rather than local ornament.

Kimi held back two points for non-blocking craft observations: the 6-item Panels surface group is
naturally taller than the two 2-item groups on the right, and `CONTRIBUTES` appears once in the
manifest definition list and again above its detailed grouping. Neither is a component error or
slop, and the run stopped because it passed the owner-defined threshold with no wrong-component or
slop findings.

## Before / after

Before, four unrelated facts were forced into horizontal bars, producing solid ink strips that read
as redactions. Providers and install candidates were also presented as cards even though their data
was row-shaped and directly comparable.

After, the screen reads as an extension registry and mount map. The header is one compact Fresh UI
Card with the 6:2:2 segmented signature and textual inventory facts. Providers form a selectable
DataTable; contribution tags have become plain metadata and every requested column is visible.
Surfaces are grouped DataTable rows with host mount context and no repeated share visualization.
Available is one registry table whose contract mismatch is expressed as built-for/host facts plus a
single InlineNotice. Fresh UI Buttons own their real pressed interaction states. Mobile uses a 2×2
summary, full-width record rows, and the existing manifest bottom sheet.

## Validation

- Playwright matrix: Providers / Surfaces / Available × desktop 1440 / mobile 390 × light / dark —
  **12 / 12** with no document or screen overflow, no rendered template holes, and no deprecated bar
  components.
- Component composition in the rendered matrix: one signature `ns-extchan` in every state;
  `ns-card`, `ns-data-table`, `ns-btn`, and `ns-inline-notice` present where their data/interaction
  requires them.
- Provider selection: verified in desktop side-panel and mobile bottom-sheet screenshots.
- CSS scope: the S16 block contains no raw hex or RGBA values; only `--ns-*` tokens are used.
- Console: no application errors; the static Python server reports only the unrelated missing
  `/favicon.ico` request.

Final screenshots are in `V12-refix-shots/round3/`. Rounds 1 and 2 are retained beside them as the
visual evidence trail for the 48 → 82 → 98 evaluator trajectory.

## Honest gaps

- The Surfaces composition deliberately preserves one tall Panels group beside two shorter groups;
  this mirrors the real 6:2:2 data and leaves some passive whitespace below the right column.
- The manifest repeats `CONTRIBUTES` at summary and detail levels. The first is a definition-list
  value; the second labels the grouped records. Kimi treated this as minor redundancy, not a wrong
  component.
- Capability descriptions and `+N` contribution labels were not rewritten because routes, data,
  and copy meaning were explicitly locked.
