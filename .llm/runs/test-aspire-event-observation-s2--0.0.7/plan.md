# Plan — #1906 slice 2

## Profile and doctrine

- Surface: CLI E2E harness, adjacent to Archetype 6 (CLI/tooling), with the service overlay for
  Aspire runtime behavior. The nested E2E workspace is not a published doctrine unit.
- Current package verdict: `packages/cli` is **Keep**. This slice changes no public CLI or product
  package source.
- Doctrine rule: wrap Aspire's push observation surface; do not reinvent it with snapshot or HTTP
  polling.
- Publishability / JSR audit: N/A. No published entrypoint, export map, dependency, or package
  artifact changes.
- Debt: no new architecture debt is planned.

## Locked decisions

1. Extend adoption of `watchResourceUpdates`; do not create another follower/parser.
2. The regrowth guard detects a file combining Aspire `describe`, a loop, and a timing primitive.
   Its only final exemptions are concurrency-fenced files.
3. Subscribe before producer stop, observe the stopped/finished update, and then continue the probe.
4. Resolve dynamically allocated URLs from a scoped follow update. Capture the full topology once
   only after endpoint evidence has arrived.
5. Retain HTTP retries whose verdict is application behavior rather than Aspire resource state, and
   document that classification.
6. Every stream cap is a test-failure ceiling, never an assumed transition duration.

## Open-decision sweep

- Safe to defer: none.
- Must resolve now: none. The issue and brief fix the observation channel, file ceiling, RED/GREEN
  order, gates, and PR metadata.

## Commit slices

1. **S1 — inventory guard RED.** Add scanner + focused tests and record the intentional failure
   listing current offenders. Files: `.llm/tools/validation/check-aspire-resource-polling*.ts` and
   run artifacts. Proof: durable focused test receipt with expected non-zero result.
2. **S2 — Bucket-A conversions GREEN.** Convert the in-scope event-observation defects and add
   focused unit tests. Files are limited to the brief's in-scope E2E sources/tests and run artifacts.
   Proof: focused tests plus the complete local gate set.
3. **S3 — cap audit and final evidence.** Record observed distributions/classifications, rerun
   focused durable receipts and all local gates, then finalize run artifacts. No source expansion.

## Risk register

- A follower started after `resource stop` can miss the event. Mitigation: subscribe before the
  command and test invocation order.
- A follow line can precede endpoint allocation. Mitigation: buffered `waitFor` predicates on
  declared resource URLs, with a failure ceiling and explicit diagnostic.
- A scanner can flag unrelated HTTP/telemetry waits. Mitigation: require the combined
  `aspire` + `describe` + loop + timing signature and test positive/negative fixtures.
- Whole-topology evidence can regress into polling. Mitigation: exactly one snapshot after the
  endpoint event, asserted in tests and explained inline.

## Deferred scope

- Every concurrency-fenced file, Bucket B, and remaining Bucket C sites.
- Generated AppHost injection or template changes.
- Live runtime execution locally; hosted CI owns that proof.

