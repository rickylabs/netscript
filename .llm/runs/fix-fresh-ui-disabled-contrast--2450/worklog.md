# Worklog

## Design

1. Public surface: additive internal TokenContrastPair metadata and TokenContrastReport.exempt; maintainer JSON/Markdown and check command explicitly show inactive uses. No new CLI command or barrel export.
2. Domain vocabulary: exemption means an annotated inactive UI text use outside SC 1.4.3 requirements; exclusion still means an exact failing source value retained for Figma correction. These are separately reported.
3. Ports: existing TokenContrastPort and TokenContextOutput; Figma provenance remains immutable; maintainer filesystem adapter publishes reports.
4. Constants: single inactive-component marker, criterion and reason constants in the domain contract, reused by checker and tests.
5. Commit slices: bootstrap plan/run + draft; one implementation slice (contract/checker/policy/report/tests/docs/generated carriers/reports), proved by focused and configured gates + independent evaluation; final evidence/sign-off.
6. Deferred scope: owner-owned Figma value pass/re-export and remaining 475 active failures; no values changed or full issue closure.
7. Contributor path: packages/fresh-ui/tokens/README.md explains explicit pair classification and reports.

## Bootstrap

Fresh branch from merged #2495, matrix queried, supervisor written first, prior memory consulted. PLAN-EVAL selected by owner and mandatory before code. RTK is unavailable; raw equivalents used. Evaluation evidence will contain no public session ids. No labels, no merge.
