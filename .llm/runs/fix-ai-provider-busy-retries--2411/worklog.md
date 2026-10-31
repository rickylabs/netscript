# Worklog

## Design

1. Public surface: additive OpenAiCompatibleModelProviderConfig.maxRetries and AiRateLimitError.status. Existing withRetryingChatClient gains pre-output busy-event retry; other event behavior remains compatible.
2. Domain vocabulary: busy provider = 429 rate limit or 503 temporarily unavailable; retryAfterMs = server minimum; attempts = wrapper attempts, independent of SDK maxRetries.
3. Ports: existing ChatClientPort, existing policy sleep/random injection and upstream SDK client options. No new port.
4. Constants: busy HTTP status set 429/503 named once where classification occurs; existing backoff constants retained.
5. Commit slices: bootstrap/run artifacts; scoped AI behavior/tests/docs and evidence; evaluator remediation only if required. Files limited to approved surface.
6. Deferred: other SDK configuration knobs, new retry classes, paid inference, arbitrary status retries and embedding behavior redesign.
7. Contributor path: packages/ai/src/application/provider-retry.ts; adapter regression exercises both supported APIs.

## Intake

Claimed #2411 on coordinator #2474 after verifying no competing issue/PR claim. #2269 stays with its dispatched owner. Matrix queried; sol/xhigh implementation and owner-selected Claude Opus 5.5/high independent evaluator. PLAN-EVAL selected because event-versus-throw and provider minimum delay behavior affect public failure contracts. Implementation awaits PASS.

PLAN-EVAL round 1 FAIL_PLAN: accepted precise busy code map, excluded insufficient_quota, and fail-fast ceiling for explicit Retry-After rather than clipping or overflowing timers. Baseline AI suite 174/174; combined doc lint exits 0 but individual private-ref diagnostics exist, matching recorded debt. Final comparison must include per-entry diagnostics, not only summary.

## Implementation slice

Owned error status and provider maxRetries contract written first, followed by safe code/delay bridge mapping, pre-output event handling and bounded wait policy, then real SDK/port tests. All 200 AI tests pass (174 baseline). Both APIs exercise 429, 503, rate_limit_exceeded, insufficient_quota, SDK zero/one/default request counts, and registry configuration. Port tests cover partial text/reasoning/tool/finish output, cancellation, exhaustion, above-ceiling refusal, far-future dates and generated timer cap. No sanitizer exclusions were added.

Structured check/lint/fmt pass over 104 TypeScript files. quality:gate and explicit AI scan pass with zero allowances. JSR audit and actual member publish dry-run pass. Combined docs pass; every individual entry diagnostic and exit matches baseline exactly (existing ai-doc-private-ref-baseline-2036). Five import-map negative controls each fail intended assertions, none has process/compile failure. Public export corpus refresh is generated from approved dirty sources with --allow-dirty; checking downstream freshness before commit. Source, docs and tests remain coherent. Separate source IMPL-EVAL pending before sign-off commit.

Carrier checks complete: generated MCP export corpus (4-line compressed carrier change); check:mcp-export-corpus and check:publish-assets exit 0. No CLI publish carrier change is needed. No dependency/lock changes. Baseline source-shape debt is unchanged (13 immediate children in src/ports); no new production file or public export name.

## Slice review / reconcile

Independent source IMPL-EVAL round1 PASS, no blockers; reviewer independently reran 51 focused tests, all green. Its nonblocking registry-input note is documented. New regression file and generated corpus are included in the sign-off commit. Review-thread gate passes: zero threads/unanswered. No new doctrine debt or dependency/lock changes. Reconcile: approved plan, source, README and complete negative-control evidence agree. Committing and pushing this single implementation slice, then marking ready for CI and obtaining immutable-head attestation. Only coordinator merges.
