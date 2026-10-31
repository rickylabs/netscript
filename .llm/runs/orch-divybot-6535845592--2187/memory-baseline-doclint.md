# Full-export doc lint baseline

`deno task doc:lint --root packages/plugin-triggers-core` exits 1 with the same three private-type-ref diagnostics for original and fixed production files: plugin-workers-core/src/public/root.ts (2), plugin-triggers-core/src/contracts/v1/triggers.contract.ts (1). Zero missing JSDoc/other diagnostics. Package publish:dry-run and JSR audit still pass. Keep these gates separate in reports; a passing audit does not green doc lint. Cross-cutting tests belong in the existing tests/ directory to avoid increasing src/runtime cardinality.
