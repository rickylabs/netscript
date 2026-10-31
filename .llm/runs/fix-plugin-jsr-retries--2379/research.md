# Research

Live #2474 control-plane and issue/PR searches show F1 #2379 is unclaimed with no covering PR. Fresh-related F1 items have an explicit overlap check with the Fresh UI lane; this independent JSR request leaf avoids those. #2375, #2411, #2384 and #2269 already have owners. No duplicate inbox issues needed.

MCP find_guidance then search_docs consulted. Production JSR network edges are WebFetchJsrHttpClient (package/version metadata, details, manifest) and WebJsrPackageFileFetcher (integrity and published Prisma fragment copy). Existing JsrHttpClient and JsrPackageFileFetcher ports remain. No existing generic CLI HTTP retry helper found. Deno doc @std/async/retry confirms bounded maxAttempts, exponential jitter, isRetriable and RetryError; reuse it rather than implement a retry loop. @std/async delay handles Retry-After minimum separately. No real network needed in tests: inject Fetch API function and use existing @std/testing FakeTime.
