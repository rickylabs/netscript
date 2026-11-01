# JSR static audit

publish:dry-run PASS through the durable gate runner; release:preflight PASS.
CLI and Fresh UI package metadata, scoped names, versions, exports and publish filters
remain unchanged. CLI exports3, Fresh UI exports11. No new public export or component
prop contract. Generated template/registry carriers contain the changed source.
Test files and run evidence remain excluded from publish surfaces.

CLI full-export doc lint: PASS,0 diagnostics. Fresh UI full-export doc lint: FAIL,
124 diagnostics (96 private-type-ref,28 missing-JSDoc), outside the changed registry
component source. Every reported source file and package config is byte-identical to
baseline0af8fd9e; see s4-doc-lint-baseline-comparison.json. This confirms unchanged
source attribution, not a separate baseline execution. Existing shared runtime
namespace/documentation debt remains. No false all-package documentation PASS.

A dry run is static evidence only; no publishing or remote install claim is made.
