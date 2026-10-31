# Plan & Design — READY FOR REVIEW

Archetype 6 CLI; change network policy at existing injected Web adapters. Published CLI exports and command syntax unchanged. Package JSR surface risk: no new public export; preserve explicit signatures and existing injected ports.

Locked: common JSR resource reader owns @std/async retry (3 total attempts; base 250ms, exponential multiplier 2, max 2 seconds, jitter). Retry HTTP 5xx, 429, Fetch TypeError/network transport errors, including body-read disconnects. Other 4xx and aborts fail immediately. Preserve validator 404 domain results. Consume/discard failed bodies before retry. Respect Retry-After seconds and HTTP dates as a minimum before the next request (never wait after final failure); invalid/negative dates fall back to jitter. Advertised delays beyond a 60-second named ceiling stop retries with a clear diagnostic, never an early retry. Errors after exhaustion name URL, actual attempts, final HTTP status or transport failure, retaining cause. Unknown programming errors and malformed JSON do not retry.

Expose Fetch API injection through existing Web adapter constructors. Shared raw-byte resource reader keeps fetch/body reads within the retry boundary; JSON parsing remains outside it. Metadata caches parsed JSON per response; file adapter reads bytes. No new timer utility. Tests use FakeTime, fetch stubs, call assertions and exact recorded attempt sequence; no real network or timer polling.

Slices: 1 bootstrap and separate PLAN-EVAL; 2 request policy + adapter wiring + regression tests, scoped structured check/lint/fmt and focused plugin tests, quality:gate; 3 reviewed evidence + push + exact-head evaluation and CI. Required CLI publication checks: doclint, JSR audit/publish dry run, freshness. Official install/copy is affected, so full scaffold.runtime CI is required; request coordinator arming, do not run it locally or mutate labels.

Risks: successful response body failures need retries without reusing consumed streams; failed responses must release bodies; Retry-After must not be clamped earlier; 404 validation semantics must survive; retain meaningful error diagnostics. Cover transient/persistent errors, 404, 429 both header forms, transport failures, malformed JSON, final attempt no extra sleep, and multiple metadata stages. Regression negative control runs new policy tests against a retry-bypassed isolated source copy.

Deferred: unrelated UI registry/deploy HTTP policies, new CLI flags, Deno's own package resolver, version/dependency changes. No open decisions or new architecture debt.

## PLAN-EVAL repair — locked

B1: shared request failure class carries url, attempts, optional status and cause. Exhausted Web metadata requests throw it; FetchJsrPluginValidator catches only this class and returns invalid-metadata, preserving the existing result/code contract and full diagnostic message at all four metadata/manifest stages. Other4xx retain domain results. File reads throw the same diagnostic class.

B2: MAX_RETRY_AFTER_MS=60000. Retry-After beyond it fails immediately with URL, attempts, status and advertised delay. Do not sleep or retry early. Retry-After inside the bound remains a minimum. Invalid headers fall back to jitter. Test both header forms and excessive headers with FakeTime.

B3: shared reader returns status/ok/attempts/raw bytes. Only fetch() and raw response.arrayBuffer() rejections are classified for transport retry; no caller callback runs inside that catch. JSON.parse runs in the metadata response json() outside retry. Retriable errors are marked status/transport failures only. Unknown non-network errors and JSON/programming errors propagate once. Test fetch and raw-body disconnects separately and JSON/non-transport errors with one attempt.
