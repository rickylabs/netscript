# Context pack — W3-J #1597

Status: implementation complete; validation and PR handoff in progress.

The selected fix preserves both scaffold tiers and the critical gate. Before fixture setup, it checks
the exact JSR metadata for config/workers/streams. A 404 produces exit 78, which the command gate
reports as a named `skipped` exclusion; non-404 registry failures remain critical. Published CLI
entrypoints supply their own exact version; local source uses the tree release version.

Negative control: `0.0.1597-unpublished` failed before the fix and is explicitly skipped after it.
Positive control: published `0.0.5` executes the full fixture and passes. No `scaffold.runtime` slot
was consumed because the affected gate itself was executed in both states.

Formal IMPL-EVAL remains automatic on draft → ready and must not be self-certified.

