# Drift

- Owner-selected implementation and evaluator routes override matrix cells; exact grants in worklog.md.
- RTK unavailable; use direct commands and structured validation wrappers.
- Specific operator process wins over contradictory generic assignment boilerplate: draft, Refs #2420 only, no labels, no session IDs, Cockpit merges.

- Before browser/retrieval tests: extend writable surface to existing browser suite tools/fresh-ui-browser/docs-tests/components.spec.ts and MCP component-guidance test, so new checks use the maintained test runners. No implementation ownership overlap.

- Native root std/fs import alias added for the existing standard walker. deno.lock gains exactly one workspace-dependency entry for already-resolved std/fs; no resolved versions or integrities changed. Retain this intentional metadata delta.

- Owner CI follow-up: the Utility browser job fails in the unchanged global tooling type-check, before browser execution, on isolatedDeclarations for ROOT/OUTPUT and the imported existing UiPresetSchema. Add explicit declaration types (including an equivalent named UiPreset contract) in the existing CLI codec; no runtime/schema or workflow-policy change. Extend owned surface to that one codec file.

- Carrier generation exposed that the new root std/fs alias invalidates private/reference lock workspace metadata. Replace the build-only traversal with Deno.readDir recursion and remove our root std/fs declaration/lock entry. No dependency versions, integrity hashes, lock deletion, cache deletion or reload. This supersedes the earlier one-line lock metadata delta; private locks remain unchanged.

- Add the new native-doc/codec/freshness regression module to the existing Pages tooling test command, with read-only Deno subprocess permission. Extend owned surface to .github/workflows/pages.yml. Existing type/lint/fmt/browser/style-policy gates remain intact; this adds test coverage and does not change workflow policy.

- Full docs browser run exposed a cross-document auditor bug: all 24 iframe preset stylesheets were merged into the outer docs role graph, producing a large false red/undefined finding flood without a complete child report. Audit isolated assets through canonical source/minifier hashes and a dedicated iframe authored-style policy/negative controls; retain the outer docs policy and every existing negative contract. Add docs-tests/docs.spec.ts to the write surface for document-scoped collection. Also trim inline callout bodies before twin quoting to preserve the gallery contract.
