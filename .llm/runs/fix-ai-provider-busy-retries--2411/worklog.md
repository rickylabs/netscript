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
