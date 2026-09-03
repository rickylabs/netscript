Refs #1906

## Summary

- replaces the remaining in-scope `aspire describe` deadline loop with the shared, scoped
  `describe <resource> --follow --format Json` observer and adds a regrowth guard
- observes the streams producer stop/recovery cycle from one buffered subscription established
  before the stop command, including guaranteed follower cleanup
- observes app/plugin/database endpoint allocation from endpoint-bearing events; database topology
  is read once only after allocation is confirmed
- keeps detailed dead-port readiness evidence by taking one snapshot after aggregate `Unhealthy`
  was observed, because follow lines do not promise the per-check `healthReports` map

## Inventory disposition

- `wait-for-workers-runtime.ts` and `KV_BACKGROUND_RUNTIME_WAIT_TIMEOUT_SECONDS` were already gone
  on the pinned base.
- service-env and Quickstart use native blocking `aspire wait` only for first-occurrence/coarse
  arrival, then at most one settled snapshot.
- plugin-resource retries assert application HTTP effects, not Aspire resource state, so they remain
  intentionally bounded HTTP probes.
- Concurrency-fenced Bucket A files, Bucket B, and Bucket C remain follow-up scope; this PR is a
  partial slice and intentionally does not close #1906.

## Verification

- RED receipt: guard reported only `verify-endpoint-readiness.ts` on the pinned baseline
- GREEN receipt: 63 focused converted-helper tests passed at `9e20929a9`
- final policy receipt: 4/4 passed at implementation head `0f4588e15467a277ffc41ea01a3127560a88d54c`
- final e2e receipt: 309/309 passed at the same implementation head
- e2e check: 225 files, zero findings
- e2e tests: 309 passed, zero failed
- e2e format: 225 files, zero findings
- e2e lint: 225/225 files covered with zero findings using config-aware 218 + 7 batches; the single
  root invocation has a pre-existing Deno 2.9.5 config-boundary crash for the standalone desktop
  fixture, documented in the run worklog and drift log
- `deno task e2e:cli suites`: pass
- `deno task quality:gate`: pass

Cap audit: no ceiling was shortened. Hosted evidence spans 3.562–13.065s restores, 9.133–38.62s
starts, 0.257–40.456s per-resource settled waits, and 0.336–0.825s database endpoint captures.
Remaining HTTP/telemetry bounds are explicitly classified as application-effect probes rather than
Aspire resource observation.

The full scaffold runtime was not run locally because this lane has no runtime lease. The
`ci:full` hosted tier is the live proof surface.
