# Keep preset-only tooling out of ordinary CLI imports

The canonical fresh-route-manifest adapter imports Vite. Statically importing it
from an opt-in adapter makes every public CLI command load native Rollup, even
permission-constrained registry inspection. A clean-baseline control passed while
the new integration failed29 existing checks with missing FFI permission. Load
that adapter dynamically only inside the selected preset's non-dry-run path.
Do not weaken the inspection test's write denial or add FFI merely to hide it.
The existing public plugin-check consumer suite is the regression oracle.
