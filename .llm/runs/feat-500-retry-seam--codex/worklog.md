# Worklog

## Design

- Public surface: `AiRateLimitError`, `AiRetryPolicy`,
  `withRetryingChatClient`, and `withRetryingEmbeddingProvider` from the root and
  ports entrypoints.
- Domain vocabulary: bounded attempt count, exponential delay bounds,
  `Retry-After` metadata, and rate-limit classification.
- Ports/effects: existing chat and embedding ports; injected `sleep` and
  `random` test seams on the policy.
- Constants: exported default policy is intentionally avoided so default runtime
  behavior remains no-retry; internal fallback values are implementation detail.
- Commit slice: one cohesive seam slice (contract, shared backoff primitive,
  wrappers, exports, tests, evidence, run artifacts), proven by the requested
  focused and package gates.
- Deferred: non-429 retries and partial-stream replay.
- Contributor path: read `src/application/provider-retry.ts`, supply a wrapped
  port plus policy, and extend classification through the named policy hook.

## Plan gate

PLAN-EVAL owner-waived by the slice brief (carried drift D1). Plan recorded here
before implementation.

## Implementation

- Added `AiRateLimitError` with `retryAfterMs`, attempt count, and cause.
- Added opt-in chat/embedding decorators with bounded 429 retries, full-jitter
  exponential backoff, `Retry-After` parsing, injected classifier/random/sleep,
  and abort checks before and between attempts.
- Chat retry stops after the first yielded event to prevent duplicate partial
  output.
- Extracted MCP's abort-aware timer into shared application code; MCP delay and
  attempt semantics are unchanged.
- Root and ports entrypoints expose the new seam; no runtime or adapter default
  was changed.

## Gate evidence

| Gate | Result |
| --- | --- |
| Focused retry tests | PASS — 6 passed, 0 failed |
| `packages/ai` full tests | PASS — 95 passed, 0 failed |
| Scoped check wrapper | PASS — 80 files, 0 findings |
| Scoped lint wrapper | PASS — 80 files, 0 findings |
| Scoped format wrapper | PASS — 80 files, 0 findings |
| Full export-map doc lint | PASS — 12 entrypoints, 0 errors |
| Package publish dry-run | PASS — dry run complete; three pre-existing MCP dynamic-import warnings |
| Diff whitespace check | PASS |

## Reconcile

- Issue #500 remains open and its acceptance contract matches this slice.
- No PR was opened, per the brief. No issue taxonomy or milestone mutation was
  authorized for this implementation lane.
- No implementation drift or architecture debt was found. IMPL-EVAL and the
  Tier-A slice review remain orchestrator-owned external gates; this lane does
  not self-certify them.
