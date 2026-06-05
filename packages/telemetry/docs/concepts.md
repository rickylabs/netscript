# Concepts

- `InstrumentationRegistry`: lifecycle registry for instrumentation hooks.
- `createMessageHeaders`: inject W3C trace headers into queue messages.
- `resolveParentContextFromHeaders`: recover an OpenTelemetry parent context.
- `TracedQueue`: queue wrapper that creates publish and consume spans.
- `inspectTelemetry`: JSON-stable package diagnostic.
