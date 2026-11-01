**FAIL_FIX** — four correctness findings need fixes. This is an S2 source review, not final IMPL-EVAL. I made no tool calls and have not independently verified the reported preview results.

1. **[P2] Resource health can report “Operational” despite failed readiness.**  
   In [health.ts.template](packages/cli/src/kernel/assets/app/routes/(_shared)/health.ts.template), `healthyResponseSchema` accepts `{ state: 'ready', registryReady: false, dependencyReady: false }`: neither dependency flag participates in validation. The supplied acceptance contract requires both flags to be true for background workers. The probe also always requests `/health`, while the streams capability correctly uses `/health/ready`; successful stream liveness therefore does not establish stream readiness.

   Use resource-specific readiness contracts and endpoints. Add negative cases for false or missing worker readiness flags and for streams whose liveness succeeds while readiness fails. The web route’s intentional HTTP 200 liveness behavior can remain.

2. **[P2] The generic renderer silently discards successful result data.**  
   In [query-result-template.ts](packages/cli/src/kernel/application/ui/page/query-result-template.ts), any object containing numeric `page`, `total`, and `totalPages` returns only the pagination paragraph. For example, `{ page: 1, total: 1, totalPages: 1, items: [{ id: 7, name: 'Actual record' }] }` never renders its record.

   Separately, the `rich` array branch replaces the actual field set with five hardcoded columns. Additional returned fields disappear merely because rows also contain `reference`, `ownerName`, `currency`, and `amount`. This affects the shared generic page/resource renderer.

   Render collection contents alongside pagination metadata, and preserve fields outside an explicitly defined presentation mapping. Add behavioral rendering assertions for a paginated envelope and an extended rich row; the existing goldens and consumer type-check do not detect these omissions.

3. **[P2] Generic currency formatting can crash rendering and changes amounts without a unit contract.**  
   In the same file, `RichRecordValue` calls `Intl.NumberFormat` after checking only that `currency` is a string. A rich-shaped row with `currency: 'credits'` or `currency: ''` throws a `RangeError` instead of rendering the result. It also divides every detected amount by the currency precision: an unrelated service returning `amount: 100` in major USD units displays `$1.00`.

   The supplied `ScaffoldRecord` contract explicitly guarantees minor units; the generic `unknown` query renderer has no equivalent guarantee. Make monetary conversion depend on an explicit presentation contract, with a safe raw-value fallback for unsupported currency values. Cover malformed currency strings and a service result whose amount uses major units.

4. **[P2] Activity reads are byte-limited, but do not reliably produce recent activity as history grows.**  
   In [scaffold-plugin-capabilities.ts.template](packages/cli/src/kernel/assets/app/lib/scaffold-plugin-capabilities.ts.template), each request uses `offset=-1`, reads the entire response, parses every event, and only then selects the last five. A valid response exceeding 1 MiB turns a functioning stream into `unavailable`, with guidance to start the service. If history is returned in multiple batches, the code never establishes that its single response reaches the current stream head before describing the entries as “Latest events.”

   Keep the read budget, but use a supported bounded recent-history mechanism or maintained cursor/snapshot strategy. Distinguish an exceeded history budget from a service outage. Verify a valid history larger than 1 MiB and a response that ends before the stream head.

**Privacy boundary remains unproven:** the streams branch uses `getStreamsAuth()` and uses the incoming request only for cancellation. It performs no caller authorization itself. Its display fields reach the dashboard, and complete capability objects are passed into the Settings island. If the workers topic is private, this path needs a caller-access check before the credentialed read; if it is intentionally public, that policy needs explicit evidence. The supplied source does not establish an outer authorization rule, so I cannot claim a demonstrated anonymous leak or sign off on private-topic isolation.

The non-persisting note demonstration is within the stated scope. Mobile, visual, and interaction accessibility gates remain pending for final evaluation; they are not the basis of these correctness findings.
