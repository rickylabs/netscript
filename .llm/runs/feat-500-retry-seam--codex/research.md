# Research

- Issue #500 acceptance requires opt-in bounded retries for `ChatClientPort` and
  `EmbeddingProviderPort`, `Retry-After`, jittered exponential backoff,
  abort-awareness, typed `AiRateLimitError`, and unchanged no-retry defaults.
- The ports already accept an optional `AbortSignal`; wrappers can preserve their
  shapes without adapter changes.
- MCP owns deterministic exponential delay and an abortable timer in
  `src/mcp/application/backoff.ts`. The timer is reusable package behavior; the
  MCP-specific policy remains local.
- Chat is an `AsyncIterable`. Retrying after yielding any event could duplicate
  partial output, so retry is safe only when an attempt fails before its first
  event.
- No relevant `packages/ai` entry exists in the architecture debt registry.
- Doctrine verdict 10 predates `@netscript/ai`; new code follows Archetype 2,
  contract-first types, application-layer composition, and injected effects.

