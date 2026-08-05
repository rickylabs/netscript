# Plan — #1227 reopened restore stability

## Profile and gates

- Surface: Archetype 6 CLI/tooling E2E and release workflow.
- Required: focused unit/policy tests, scoped check/lint/fmt, workflow YAML parse, live branch
  diagnostic run, then N consecutive published-canary `quickstart.walk` runs.
- Release class: required because the published CLI quickstart gate changes.
- JSR audit: N/A; no package public export is planned.

## Locked decisions

1. Preserve PR #1297's bounded timeout and infrastructure classification.
2. Land diagnostic artifact capture before changing retry/cache behavior; diagnosis controls scope.
3. Retry only the exact observed restore failure class, with a finite total budget.
4. Cache exact pinned inputs and assert cache population, not merely cache-step syntax.
5. A single green run is not completion evidence.

## Commit slices

1. Diagnostic capture — upload Aspire CLI logs on every production E2E outcome; policy test; branch
   workflow run supplies the log.
2. Root-cause mitigation — signature-specific retry and exact cache correction chosen from slice 1
   evidence; focused negative/positive tests.
3. Repeated proof — N consecutive published-canary walks green; final evidence and ready handoff.

## Risk register

- Artifact paths may not expand `~`: workflow policy and live artifact inspection prove them.
- Broad retries could mask product failures: retry predicate is exact and unit-tested negative-first.
- Cache could be present but irrelevant: diagnostic logs and explicit package-presence assertions
  bind it to the restore operation.
- Cloud flake may not reproduce immediately: keep diagnostic upload always-on and do not claim
  completion without the consecutive-run bar.

## Open-decision sweep

- Consecutive-run count: three; enough to reject the observed alternating/lucky-single-pass pattern
  while keeping the p0 proof bounded.
- Log retention duration: safe to defer to Actions defaults.

## Deferred scope

- Aspire CLI upstream repair; this lane makes the NetScript quickstart resilient and diagnosable.

## Slice 2 decision

- Cache preparation is a separate prerequisite job so its post-save completes before product E2E
  begins. It restores and verifies all five exact packages under a new v2 key.
- Quickstart restore retries once only when exit code is 6 and stderr contains both observed Aspire
  preparation-cancellation markers. Timeouts, product exit codes, and partial matches do not retry.
