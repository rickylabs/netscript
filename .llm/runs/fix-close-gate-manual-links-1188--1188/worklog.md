# Worklog

## Design

- Public surface: close-gate report gains source-aware closing references.
- Domain vocabulary: authoritative closing set and `body keyword|commit message|manual link` sources.
- Ports: GitHub REST for PR/issues and GraphQL for closing truth + commit messages.
- Constants: GraphQL query and finite source labels.
- Commit slices: discovery/provenance contract; regression/gate handoff.
- Deferred scope: mutation of links and uncommon >100-node pagination.
- Contributor path: extend the pure reference resolver first, then the GitHub query adapter, then report formatting.

## 2026-08-05

- Read #1188 first and confirmed the gate uses only PR-body keywords.
- Added an authenticated GraphQL query for `closingIssuesReferences` and PR commit messages.
- Added a pure resolver that unions GitHub truth, body keywords, and commit keywords, reporting each source; an authoritative reference with neither keyword source is named `manual link`.
- The existing acceptance gate now evaluates the authoritative union; pretty and JSON reports carry source metadata.
- Fixture proves manual-only + unchecked fails and removing the link passes; body-only and commit-message cases are covered.
- Validation-tool suite: 40 passed; targeted check/lint/fmt passed.
- Live query against PR #1303 correctly found #1188 via body keyword and failed on its unchecked acceptance; live PR #1180, whose manual link has been removed, reported no closing references and passed.
- Reconcile: #1188 remains the sole closing issue; scope and milestone unchanged.
