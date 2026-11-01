# MCP public contracts and validation

MCP's public-surface-doc-lint_test.ts runs deno doc --lint per export-map entrypoint. Adding ToolError.provenance requires TelemetryProvenance to be a named public export; CLI snapshot injection also needs its port and request/result types public. Isolated declarations require explicit annotations on computed constants/default parameters even in fixture modules. Keep new analysis schemas inside domain/telemetry rather than growing the already over-cap central tool-contract registry. Group telemetry summaries/query adapter with the feature to avoid adding siblings to existing over-cap folders.

Initial full suite: 522 passed / 1 doc-lint failure for private TelemetryProvenance; repaired by named exports. No runtime-health regression. Root quality:gate passes with existing warnings. Do not claim the 523-test suite green until rerun after repair.

Keep the snapshot port internal: a public snapshot return shape would require re-exporting upstream telemetry types, which doctrine discourages. Test real MCP composition with its existing endpoint override. Only TelemetryProvenance needs a new root export.

audit-jsr-package requires --allow-write when --out is used; its slow-type warning parser counts the normal checking banner despite a successful publish dry-run. run-deno-doc-lint accepts only one --root (the last wins); invoke each package separately. MCP full export doc lint and telemetry/query pass. Full telemetry doc lint has seven existing errors, reproduced identically in a detached baseline checkout.
