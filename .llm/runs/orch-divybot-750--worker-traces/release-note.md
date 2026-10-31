# 0.0.9 release note handoff — telemetry

Worker jobs and trigger deliveries no longer inherit a shared worker's lifetime trace when their
message has no valid trace context. Incoming `extractContext` and its
`getParentContextFromHeaders` alias now return a span-free root context for missing or malformed
carriers; `resolveParentContextFromHeaders` follows the same rule. Valid traceparent, sampled flags
and the full tracestate list are preserved.

Callers intentionally nesting local work should use the active context (`getActiveContext`,
`withSpan`'s default parent, or `contextWithSpan`) instead of `extractContext({})`.

This also isolates worker stream publications without a stored parent and malformed saga-parent
carriers. It does not detach nested job/trigger handler spans from their own delivery trace.
Source issue #2393; PR #2399. This is a release-note handoff, not a claim of publication.
