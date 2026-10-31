# Worklog

## Design

1. Public surface: existing plugin install/copy CLI; metadata/file Web constructors gain optional injected fetch; existing ports unchanged.
2. Vocabulary: attempt includes the first request; transient = 5xx/429 or transport disconnect; Retry-After is a minimum before the next attempt.
3. Ports: existing JsrHttpClient/JsrPackageFileFetcher; Fetch API function injection; raw-byte resource result; structured request error; JSON parsing outside retries.
4. Constants: MAX_ATTEMPTS=3, INITIAL_BACKOFF_MS=250, MAX_BACKOFF_MS=2000, MAX_RETRY_AFTER_MS=60000; named transient status classification.
5. Slices: bootstrap/run review; JSR request reader and both adapters/tests with scoped wrappers/quality; evidence and independent exact-head evaluation/CI.
6. Deferred scope: other HTTP clients, resolver versions, dependencies, new CLI options.
7. Contributor path: packages/cli/src/public/infra/jsr/read-jsr-resource.ts.

## Routing and baseline

Feature matrix queried through agentic:matrix --tier feature --json. Continue owner-selected independent Claude Opus 5.5/high read-only evaluator route from prior leaf. No complex/architecture tier. Baseline fetched main e4875a56c13e91503b5f168e6fa6d95b093c5a8a. No code changed before selected PLAN-EVAL.

PLAN-EVAL round 1 FAIL_PLAN; all three blockers accepted in plan repair. Preserve invalid-metadata result by catching structured request failures at validator boundary, fail excessive Retry-After without sleeping or retrying early, and mark transport failures only at fetch/raw-byte reads. No implementation before round2 PASS.

## Implementation and local gates

PLAN-EVAL round2 PASS before implementation. Shared raw-byte reader uses @std retry at fetch/arrayBuffer boundaries, 3 attempts and jitter. Retry-After max60s; excessive values fail without waiting or retrying early. Validator converts structured transport/status errors into invalid-metadata; 404 domain results remain. Both Web adapters inject Fetch API, no new dependency.

| Gate | Result |
| --- | --- |
| Structured JSR suite, --deny-net --cached-only | exit0; 47 passed, 0 failed, 0 ignored |
| Public/local plugin + maintainer copy suites | exit0; 511 passed, 0 failed, 0 ignored |
| Isolated retry-disabled negative control | exit1; eight expected failures, no passes/skips |
| Structured check/lint/fmt, five changed TS files | exit0; full coverage, no findings |
| quality:gate | exit0; existing warnings only |
| CLI all-export doclint | exit0; zero private-type refs/missing docs |
| CLI JSR audit and native publish dry-run | exit0; no new slow types |
| MCP export corpus freshness | exit0; no generated refresh needed |
| Full scaffold.runtime CI | UNPROVEN; coordinator scheduling required |

Commands: structured .llm/tools/run-deno-test.ts with --allow-all --unstable-kv --frozen over packages/cli/src/public/infra/jsr, packages/cli/src/public/features/plugins, packages/cli/src/local/features/plugins/install and packages/cli/src/maintainer/features/sync/plugin. Focused JSR suite additionally denies network and uses cached-only. Negative control uses an archived source copy plus current changes, MAX_ATTEMPTS=1, and filter /502 then 200|persistent 502|recovers after 502/. Wrapper check/lint/fmt select the five changed TS files; lint/fmt use a private style-only config to avoid inherited CLI exclusions. No raw output with absolute paths is committed; evidence.json transcribes counts and final source hashes.

Exploratory formatting across all nine sibling JSR files found existing quote-style drift in untouched fetch-jsr-plugin-validator_test.ts; this is outside scope and unchanged. Final five-file format gate passes. Initial fake-clock driver exposed runAllAsync stopping between newly scheduled retries; replaced with fixed nextAsync opportunities. No timer polling or real network added.

Reconcile: baseline e4875a5, current branch from main, no deno.lock changes. No production/side work outside declared JSR adapters/tests and run artifacts. No runtime resource started. No architectural debt accepted.

Independent source review PASS, no blockers. Both real composition paths confirmed; evaluator correctly leaves runtime CI unproven. Applied optional json() contract improvement: cached asynchronous parse promise outside retry, then rerun affected focused/scoped gates.

Final json() refinement: focused47 with network denied, scoped5-file check/lint/fmt all pass. evidence.json hashes updated. Ready to push source-reviewed slice; required runtime proof remains explicitly unproven.

## Main integration and runtime execution

Core CI at d22b983 passed all source/test/build/quality jobs; close-gate remained red for the unproven runtime/final-review claim. The current canonical E2E workflow supports manual branch dispatch with per-PR/ref groups and isolated GitHub-hosted VMs. Dispatched run41207893689 without labels/local resources. Main then advanced with auth backend prerequisite #2519 at a9620a3; merged that exact main normally, preserving all five JSR source hashes. The manual runtime run is superseded by validation of the integrated head. No rebase or force push. This corrects the plan's overly narrow assumption that label arming was the only authorized execution path. No coordinator-owned labels/milestones or release actions changed.
