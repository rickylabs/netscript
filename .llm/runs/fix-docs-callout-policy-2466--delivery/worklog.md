# Worklog

## Design checkpoint

1. Public surface: exported Markdown alerts are GitHub-compatible; policy rejects red token uses
   even when an unapproved exemption entry is supplied.
2. Vocabulary: authored marker, canonical marker, destructive alias, exact token-value exception.
3. Ports: existing Lume/Vento renderer, Markdown twin serializer, browser CSSOM and token export.
4. Constants: CALLOUT_TYPES remains the marker authority; the exemption token is a closed key.
5. Slices: S0 contract/draft; S1 implementation/regressions; S2 carriers/gates/review/readiness.
6. Deferred: no component restyle, theme work, dependency/version changes or token regeneration.
7. Contributor path: tools/docs-site/callout-types.ts, with the existing browser policy tests.

Tracker intake verified #2582 merged and #2579/#2571/S3/S7 already owned. #2562 is already merged;
#2462 is explicitly blocked. #2466 is open with no existing PR or worker and is selected here.
Feature matrix queried. Continue session owner-directed separate read-only Opus5.5 high evaluator.
Source gates use structured wrappers; RTK remains absent. No package API is changed.
