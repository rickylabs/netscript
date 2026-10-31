# Drift

- RTK missing: equivalent underlying commands used.
- Dispatcher generic close/ready instructions conflict with explicit operator instructions. Follow operator Refs #2419 only, no labels and exact-head green READY.

- S1 browser found health inner wrapper intrinsically wider than mobile shell, and fixed-height topbar allows wrapped nav to overlap. Added w-full to health content and moved the narrow topbar flow fix in registry/styles/layouts.css from S4 into S1. Initial development probe ran concurrently with build and observed production mode; rerun dev/prod separately.

- Fresh Context.config.mode remains production under the scaffold's Vite dev integration. Browser evidence caught the missing development Design link; use Vite import.meta.env.MODE, the same mode that controls route inclusion, with vite/client types.

- S1 default documentation also updates docs/site/reference/fresh-ui/index.md, whose default statement otherwise contradicts the changed scaffold. The tokens-init command reference deliberately remains NS One.
