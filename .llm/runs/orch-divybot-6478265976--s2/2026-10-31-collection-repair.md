# Locked collection updates — coordinator repair

Baseline259374b0a11d99791daa294d9876dd2f9c38fc20. Cockpit delta review accepts the alias fix and finds one regression: the installed-item guard rejects ui:update surface-core after ui:add surface-core, because the lock stores member items, not collection keys. One small round approved; latest steering also requires normal merge of origin/main including S3 PR2467.

## Contract and implementation

A nonempty built-in collection counts as installed when every declared member has an own lock entry. Existing direct-item keys remain accepted. Empty/partial/uninstalled collections and unknown/uninstalled items are refused before source-file resolution or writes. Validate the entire explicit selection before updating any copy. Preserve named and unnamed legacy no-lock recovery and default discovery behavior. No lock-schema migration or collection-history keys.

Reuse the registry client's existing collection schema through its metadata-only collections method; resolver and lifecycle guard share that same validated definition. The new internal interface method uses the existing collection type, no package export added. Known direct-item updates and empty locks avoid the metadata query; other candidates read only embedded metadata, never remote items/files. Existing missing-item test now distinguishes one permitted local metadata read from source resolution; new getter and transport controls prove zero content reads/remote requests on refusal.

## Focused proof

Before production fix:2 passed/2 failed/0 ignored, exact errors refuse surface-core and a fully installed injected collection. Actual surface-core test installs the collection, asserts no collection lock key and all member keys, removes a card copy and edits a panel copy, then requires restoration of missing bytes and preservation/reporting of drift without adding a collection key. Injected controls cover empty/partial/complete locks, empty collections, unknown/namespaced/uninstalled items and mixed installed-collection plus absent-item requests; snapshots unchanged and zero content/remote reads. Complete collection updates both member versions. Repaired focused suite9/0/0; four-file structured wrappers PASS/zero findings/drops/refusals.

Archetype6 existing CLI application layering; same client metadata authority, no new architecture debt. PLAN-EVAL N/A: concrete authorized bounded repair. Contributor entrypoints registry-client.ts and registry-lifecycle.ts; tests in ui-collection-lifecycle_test.ts.

Next: commit source, merge latest origin/main normally, preserve S3/streams, regenerate conflicted carriers, validate full combined UI/scoped/broad gates, retain same independent native Opus5.5 High evaluator. Final evidence commit precedes decisive full CI. Require all actual8 shards/check-test/quality plus scaffold-static and both actual scaffold-runtime suites/full workflows at exact final head. deps-report policy skip remains separate. Post READY on PR2468 only after green; no labels/force push/self-merge/release/assignment commit or further push after green.
