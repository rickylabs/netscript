# Drift

- RTK missing: equivalent underlying commands used.
- Dispatcher generic close/ready instructions conflict with explicit operator instructions. Follow operator Refs #2419 only, no labels and exact-head green READY.

- S1 browser found health inner wrapper intrinsically wider than mobile shell, and fixed-height topbar allows wrapped nav to overlap. Added w-full to health content and moved the narrow topbar flow fix in registry/styles/layouts.css from S4 into S1. Initial development probe ran concurrently with build and observed production mode; rerun dev/prod separately.

- Fresh Context.config.mode remains production under the scaffold's Vite dev integration. Browser evidence caught the missing development Design link; use Vite import.meta.env.MODE, the same mode that controls route inclusion, with vite/client types.

- S1 default documentation also updates docs/site/reference/fresh-ui/index.md, whose default statement otherwise contradicts the changed scaffold. The tokens-init command reference deliberately remains NS One.

S2 browser comparison exposed a baseline native-choice cascade bug: checked selectors masked invalid borders and pointer hover only applied to the visually hidden input. Utility scopes now bind hover to the label and keep invalid red after checked/hover. Capture restores checkbox state after pointer activation so the gallery labels remain accurate. Figma-only xs/link buttons and sm switches are outside the existing public contract; their absence is a documented deferred gap.

S2 label font follows the Figma font/label role (sans for Utility); mono remains on meta/keycaps. Bare studio root is also accepted because token emission aliases it to Utility. Off switch thumb follows spec surface/card; no base forms ledger is present to supersede it. Filter-form card fill will be reconciled with the S3 surface family.
