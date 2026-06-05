# Architecture

`@netscript/telemetry` is an Arch-2 integration package. Active alpha modules cover config, core
spans, context propagation, queue/SSE instrumentation, oRPC plugins, diagnostics, and
instrumentation registry lifecycle hooks.

Plugin-specific runtime modules are owned by their packages. Saga telemetry contracts live in
`@netscript/plugin-sagas-core/telemetry`.
