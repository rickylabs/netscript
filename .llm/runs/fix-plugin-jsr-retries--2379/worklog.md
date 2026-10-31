# Worklog

## Design

1. Public surface: existing plugin install/copy CLI; metadata/file Web constructors gain optional injected fetch; existing ports unchanged.
2. Vocabulary: attempt includes the first request; transient = 5xx/429 or transport disconnect; Retry-After is a minimum before the next attempt.
3. Ports: existing JsrHttpClient/JsrPackageFileFetcher; Fetch API function injection; resource read callback for body failures.
4. Constants: MAX_ATTEMPTS=3, INITIAL_BACKOFF_MS=250, MAX_BACKOFF_MS=2000; named transient status classification.
5. Slices: bootstrap/run review; JSR request reader and both adapters/tests with scoped wrappers/quality; evidence and independent exact-head evaluation/CI.
6. Deferred scope: other HTTP clients, resolver versions, dependencies, new CLI options.
7. Contributor path: packages/cli/src/public/infra/jsr/read-jsr-resource.ts.

## Routing and baseline

Feature matrix queried through agentic:matrix --tier feature --json. Continue owner-selected independent Claude Opus 5.5/high read-only evaluator route from prior leaf. No complex/architecture tier. Baseline fetched main e4875a56c13e91503b5f168e6fa6d95b093c5a8a. No code changed before selected PLAN-EVAL.
