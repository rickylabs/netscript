# Research

Main baseline 46b22e63608eb4ba067145445b523536d6e48aa9 includes merged #2521. #2411 is unclaimed; #2269 already dispatched. MCP find_guidance was unrelated and exact search_docs found no retry guidance. Public config inspected through deno doc before focused source.

Pinned upstream @tanstack/ai 0.68.0 RunErrorEvent carries code and retryAfterMs; chat() moves retryAfterMs to metadata.tanstack. @tanstack/ai-openai 0.29.1 delegates compatible configuration to OpenAI ClientOptions, including maxRetries; its pinned openai-base 0.13.1 extracts HTTP Retry-After in both Chat Completions and Responses. Local package source and types prove these seams; no dependency upgrade is necessary.

Owned translateChunk currently drops metadata and retains only string code as cause. withRetryingChatClient retries throws only, so error events escape. maxDelayMs also clips explicit provider Retry-After; this violates server minimums for busy responses. Config reader drops SDK retry configuration in both direct and registry construction.

Archetype 2 integration, with existing retry behavior within application/ and owned errors in contracts/. No new ports or runtime architecture needed. Existing ai-doc-private-ref-baseline-2036 debt must not grow; full-export doc lint will establish actual state. JSR risk is additive optional number fields only, explicitly typed; base graph must stay TanStack-free. Paid inference, dependencies, embeddings redesign and scaffold/runtime wiring are outside scope.
