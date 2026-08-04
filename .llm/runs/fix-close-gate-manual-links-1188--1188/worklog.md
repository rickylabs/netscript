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

