# Plan

## Profile

- Archetype 2 — Integration: provider calls cross an external-system boundary.
- No scope overlay.
- Doctrine verdict: unlisted/new package surface; apply doctrine immediately.
- Debt: none created or deepened.

## Locked decisions

1. Add explicit wrapper factories; do not modify adapters or runtime defaults.
2. Keep policy bounded by `maxAttempts`, including the initial attempt.
3. Recognize typed `AiRateLimitError` plus response-like errors carrying HTTP
   status 429 and headers; normalize exhausted rate limits to `AiRateLimitError`.
4. Parse `Retry-After` delta-seconds and HTTP-date. A server delay takes
   precedence over computed jitter, bounded by the configured maximum delay.
5. Use full jitter in `[0, capped exponential delay]` with injectable random and
   sleep effects.
6. Retry chat only before the first yielded event.
7. Extract only the generic abort-aware delay from MCP; retain MCP policy names
   and behavior unchanged.

## Gates

- Focused unit tests for retry-after, jitter bounds, abort, exhaustion, and
  pass-through/default behavior.
- Scoped wrapper check, lint, and format for `packages/ai`.
- Full export-map doc lint.
- Publish dry-run because the root/ports exports change.

## Risks

- Provider error shapes vary: accept an injectable `isRateLimitError` classifier
  while supporting the common typed/status/header shape.
- Streaming replay duplicates output: prohibit retry after first yield.
- Abort races with timers: use one shared abort-aware delay primitive.

## Deferred scope

- Retrying non-rate-limit transient failures.
- Adapter-specific error rewrites.
- Retrying partially-consumed chat streams.

