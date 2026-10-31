# Drift

- RTK missing: equivalent underlying commands used.
- Dispatcher generic close/ready instructions conflict with explicit operator instructions. Follow operator Refs #2419 only, no labels and exact-head green READY.

- S1 browser found health inner wrapper intrinsically wider than mobile shell, and fixed-height topbar allows wrapped nav to overlap. Added w-full to health content and moved the narrow topbar flow fix in registry/styles/layouts.css from S4 into S1. Initial development probe ran concurrently with build and observed production mode; rerun dev/prod separately.

- Fresh Context.config.mode remains production under the scaffold's Vite dev integration. Browser evidence caught the missing development Design link; use Vite import.meta.env.MODE, the same mode that controls route inclusion, with vite/client types.

- S1 default documentation also updates docs/site/reference/fresh-ui/index.md, whose default statement otherwise contradicts the changed scaffold. The tokens-init command reference deliberately remains NS One.

S2 browser comparison exposed a baseline native-choice cascade bug: checked selectors masked invalid borders and pointer hover only applied to the visually hidden input. Utility scopes now bind hover to the label and keep invalid red after checked/hover. Capture restores checkbox state after pointer activation so the gallery labels remain accurate. Figma-only xs/link buttons and sm switches are outside the existing public contract; their absence is a documented deferred gap.

S2 label font follows the Figma font/label role (sans for Utility); mono remains on meta/keycaps. Bare studio root is also accepted because token emission aliases it to Utility. Off switch thumb follows spec surface/card; no base forms ledger is present to supersede it. Filter-form card fill will be reconciled with the S3 surface family.

S3 owns the carried filter-form CSS adjustment: the Figma Card/Filter form render confirms transparent fill and top hairline, so it now uses the same per-side card border roles. Badge info moves from planned to shipped; its type, real render fixture and JSON contract advance together. Section-divider uses existing label size/line and wide tracking with font-eyebrow because separate eyebrow size/line/tracking tokens do not exist. No token value is invented.

S3 capture now loads the actual scaffold Tailwind preflight through UTILITY_PREFLIGHT. Without it, browser-default paragraph margins exaggerated the card header. Toast gallery wrappers are placed in flow and timers frozen only in the specimen harness so every toast is visible; native runtime positioning/timers remain the shipped implementation. No production behavior is certified by an SSR timer snapshot.

S4 adds the existing top-bar scope/parts to the scaffold layout template so its generated header consumes Utility CSS. Automatic ChartBlock/Donut categories need to be distinguishable from explicit semantic tones: additive data-series (1–5, derived only when tone is omitted) is declared in the contract, emitted by both charts, and covered by intent-preservation tests. Legacy data-tone emission remains unchanged. This avoids automatic red error colour on the fifth category while preserving a caller's destructive series.

S4 missing role: the Figma donut's larger diameter has no named token in tokens v2. Preserve the shipped SVG footprint and text-lg center size, apply the KPI font/weight, and record the size difference instead of constructing a literal or arithmetic substitute. Sidebar's new marker anatomy remains deferred with the unshipped contract part.

Owner authority update supersedes the earlier S4 sidebar-marker deferral: locked renders require square tab/nav/filter markers. Existing spacing scale supplies the 6px marker and gap; pseudo-elements are decorative and keep public parts unchanged. Locked DataGrid selection uses ink native checkboxes, compact vertically centered rows, a leading ink selection rule and combined selected-hover paint. S4R will reconcile earlier families against this newly supplied authority.
