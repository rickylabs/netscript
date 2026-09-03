# Research — #1906 slice 3

## Re-baseline

- Base `3149d18e1` contains #1969 at `02c9cf648` and the shared buffered observer from #1909.
- The six-file concurrency fence is clear. The guard allowlist still names all six, but only
  `runtime/verify-listener-readiness.ts` actually polls `aspire describe` in a timed loop.
- `runtime/listener-unreachable-fixture.ts` already keeps one scoped follower open across the
  induced Unhealthy and Healthy transitions. Its remaining timed loop observes the fixture-owned
  acknowledgement file, not Aspire state.
- `runtime/readiness-disagreement.ts` is a pure classifier and `runtime/owned-container-log.ts`
  performs one owned-container inventory/log read. Neither polls resource state.
- `scaffold/verify-live-db-endpoint.ts` takes one live topology snapshot; its retry loop is for
  post-request telemetry correlation.

## Doctrine and surface

- Surface: the nested CLI E2E harness adjacent to Archetype 6; it changes no published package
  surface. `packages/cli` remains **Keep** in doctrine file 10.
- The governing rule is Aspire's continuous resource update stream: subscribe before an induced
  change, consume buffered events, and use a snapshot only once after the event when richer detail
  is required.
- JSR audit: N/A; no package export, dependency, or publish surface changes.

## Open questions

None. The issue and committed brief lock the observation channel, fenced inventory, Bucket-C
decision criteria, gate set, and PR metadata.
