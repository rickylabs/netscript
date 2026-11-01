# Plan and design — READY FOR REVIEW

Deliver all#2565cells in one CLI/tooling leaf, archetype6 with docs scope. No public package export or command-option changes; no dependency updates or accepted architecture debt.

## Locked decisions

1. Add stable theme-guide/gallery xref keys to the existing docs manifest. Resolve the three guidance routes (theme/customize/gallery) to their actual source files and MCP/local-doc slugs; fail on missing/ambiguous route sources. Tests can supply a fixture manifest. No second manually maintained list of route paths.
2. Derive theme count and numbered guideline references from current canonical source. Use semantic headings and fail closed if required headings disappear or duplicate. Catalogue extraction no longer assumes section6. Remove the redundant count word from the canonical introductory sentence; preserve its exact updated bytes in the bundled reference.
3. Generate a small private CLI metadata asset with doc slugs and the release-ref token. App conventions and page hints consume it. Keep all package runtime imports inside CLI; generation alone reads docs sources.
4. Generated design skill uses version-neutral source-link tokens. Agent init verifies the original bundle, then materializes only the design skill links using NETSCRIPT_RELEASE_VERSION and v<version> refs. Use the existing semver library. Local reference bytes remain exact; re-init is idempotent. Pages has only current routes, so use pinned source links plus the matching embedded MCP/local-doc slugs for rendered guidance; do not invent versioned Pages paths.
5. Correct the prior S9 evaluation's stale test locators with live test names/symbols and a maintenance note, preserving historical evidence.

## Slices and gates

1. This research/plan bootstrap commit and draft PR. Selected PLAN-EVAL because generator/installer materialization and release-version independence cross an integrity boundary; no implementation before PASS.
2. One cohesive implementation slice(<30expectedfiles): docs manifest/generator/metadata, release materialization, callers/tests, canonical generated carriers, requested citation correction and run evidence. Meaningful red/green tests for counts/section renumbering, manifest relocation/missing targets, stable/canary pinning, original-bundle integrity, exact GUIDELINES and installed idempotence; actual CLI agent install proof. Scoped check/lint/fmt, all root check:* tasks/four carriers, docs links/accuracy/snippets/contract derivation, release preflight, quality:gate/architecture and CLI JSR audit/dry-run. Run one-pass scaffold.runtime with cleanup for merge readiness; local Docker absence remains UNPROVEN and hosted results are separate. Independent same-session final IMPL-EVAL before sign-off; push normally and verify current-head CI.

## Risk register and open decisions

- Release-tag links must match repository v<version> tags, including canaries. Materialize at install time so version bumps do not break read-only generation checks. Native unit and installed-host tests cover this. Development manifests may name an unpublished release; bundled docs remain locally authoritative and future release tags are resolved by the published CLI version.
- Slugs/anchors must not silently drift. Derive route slugs from xrefs and section numbers from source headings; fixture mutations and real corpus lookups cover both.
- Bundle integrity must remain meaningful. Verify source bytes before materialization; preserve untouched files and canonical reference, test idempotence.
- Concurrent#2559 edits app-guidance punctuation/hints. Preserve that work during any normal main merge and re-run relevant callers/carriers. No rebase or force push.
- All decisions needed now are locked above. Optional future versioned Pages hosting is safe to defer; not required by this source-pinning solution.

## Deferred and contributor path

S7 payload/routing#2569 belongs to its separate worker. Other design-system leaves and release publication are not part of this PR. Contributor entry:.llm/tools/docs/generate-design-skill.ts and its fixture tests. Keep owner Refs-only/no-label/no-session-id policy; inherit issue milestone24. Cockpit owns merge. Continue the user-authorized tracker loop after this leaf is delivered, checking ownership before taking another.
