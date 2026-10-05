# Worklog

## 2026-10-05 — reproduce and fix

Input: construct `AnthropicModelProvider({ apiKey: 'test-key', models: ['claude-future-test'] })`. Observed on baseline: `supports` is false and construction throws before any request. Expected: configured ID resolves/constructs while unconfigured IDs reject. The new regression failed twice by assertion on the unchanged source (not type errors); retained in `regression-before.json`. Source change then passes both assertions. Expanded suite: 10 passed/0 failed, exit 0, `regression-after.json`.

Root cause: baseline `packages/ai/src/adapters/anthropic.adapter.ts:201` searches only global catalog IDs, and `packages/ai/anthropic.ts:29` drops additive config in the registered factory. Instance catalog and public factories now use explicit IDs. No SDK/global registry mutation.

Native compatibility: exact Opus 5.5/Fable 5.1 IDs retain mandatory thinking; Sonnet 5.5 `off` uses between_tools. Effective merged request/call options are validated, covering the previously unchecked providerOptions path. Mocked real SDK transport preserves selected model, endpoint, per-turn keys, reasoning/text, tools/results, usage, abort and errors.

The tool regression failed with six requests for two owned calls because TanStack defaults to three model iterations and generates placeholder client-tool results. Explicit `maxIterations(1)` restores the documented single-turn port (baseline bridge header and `packages/ai/src/ports/chat-client.ts`). The new test now checks exactly two requests with real caller-supplied results.

GLM 5.3 Flash/provider_default on guarded OpenCode Go replied ROUTE_OK to the bounded preflight, exit 0. Actual independent implementation evaluation still pending. The launcher validates live expense and exact matrix route before inference; no handcrafted provider bypass.

The mock usage frame includes cumulative input/output token fields, matching the selected adapter’s normalization. Streaming compatibility has not been tested by paid live inference. Existing 0.18.3 adapter emits usage from message_delta; input counts supplied only in message_start remain a dependency follow-up, not silently certified here.
