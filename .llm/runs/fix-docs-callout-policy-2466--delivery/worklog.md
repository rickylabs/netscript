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


## Implementation and red/green proof

Red tests failed on unsupported ERROR, authored DANGER bypassing normalization, and a real browser
policy input that hid red --ns-primary via an unapproved exemption entry. Production now reads
canonical markers through both paths and accepts only the exact number-kind role/value exception.
No rendered callout tone/label/icon, parser fallback or color-use rule was weakened.

Green: 5 top-level structured tests (including 20 real renderer fixture cases), 12 initial policy
browser cases, and 32 rebuilt docs/browser cases across light/dark and mobile/desktop pass. The
built Markdown scan covers every twin and requires more than100 actual alert markers. Docs build,
rendered-output check, links, accuracy and release preflight pass. Scoped checks cover26tool files,
20site plugin files and4strict browserfiles. Explicit docs-config lint/format on all6ownedsource
files passes. Initial root lint refused its all-excluded selection; no false PASS was recorded.

Separate read-only implementation review is active. Final negative-control exits, carrier chain,
all rootcheck tasks and broader docs tooling tests are next. PR#2585 is draft, milestone0.0.9.


Independent round1 PASS supports the sign-off commit. The nonblocking README suggestion is applied.
The four actual CLI negative controls all exit1 with expected findings; all15checks and fourcarrier
freshness gates pass. Broader docs-tooling tests pass25/25; quality/architecture passes. Source is
complete; repeat carrier freshness after the README addition, then commit/push for hosted readiness.

After the README addition allfourcarrierfreshness checks passed again. This leaf is reconciled against main4a2dae3. Sign-off commits the reviewed code, mechanically generated docs and all gate evidence together. Hosted CI/runtime remain next; no READY yet.
