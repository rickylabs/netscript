# Plan & Design — READY FOR REVIEW

Archetype 6 CLI; change network policy at existing injected Web adapters. Published CLI exports and command syntax unchanged. Package JSR surface risk: no new public export; preserve explicit signatures and existing injected ports.

Locked: common JSR resource reader owns @std/async retry (3 total attempts; base 250ms, exponential multiplier 2, max 2 seconds, jitter). Retry HTTP 5xx, 429, Fetch TypeError/network transport errors, including body-read disconnects. Other 4xx and aborts fail immediately. Preserve validator 404 domain results. Consume/discard failed bodies before retry. Respect Retry-After seconds and HTTP dates as a minimum before the next request (never wait after final failure); invalid/negative dates fall back to jitter. Large advertised delays are not shortened. Errors after exhaustion name URL, actual attempts, final HTTP status or transport failure, retaining cause. Unknown programming errors and malformed JSON do not retry.

Expose Fetch API injection through existing Web adapter constructors. Shared resource read callback keeps transport/body reads within the retry boundary. Metadata caches parsed JSON per response; file adapter reads bytes. No new timer utility. Tests use FakeTime, fetch stubs, call assertions and exact recorded attempt sequence; no real network or timer polling.

Slices: 1 bootstrap and separate PLAN-EVAL; 2 request policy + adapter wiring + regression tests, scoped structured check/lint/fmt and focused plugin tests, quality:gate; 3 reviewed evidence + push + exact-head evaluation and CI. Required CLI publication checks: doclint, JSR audit/publish dry run, freshness. Official install/copy is affected, so full scaffold.runtime CI is required; request coordinator arming, do not run it locally or mutate labels.

Risks: successful response body failures need retries without reusing consumed streams; failed responses must release bodies; Retry-After must not be clamped earlier; 404 validation semantics must survive; retain meaningful error diagnostics. Cover transient/persistent errors, 404, 429 both header forms, transport failures, malformed JSON, final attempt no extra sleep, and multiple metadata stages. Regression negative control runs new policy tests against a retry-bypassed isolated source copy.

Deferred: unrelated UI registry/deploy HTTP policies, new CLI flags, Deno's own package resolver, version/dependency changes. No open decisions or new architecture debt.
