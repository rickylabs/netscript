# Architecture

`@netscript/plugin-streams` is the Tier 2 plugin package for Durable Streams.
It owns the service process, CLI entrypoint, Aspire contribution, E2E gates,
and scaffolding metadata.

The schema and producer contract lives in `@netscript/plugin-streams-core`.
Consumers should import the core package when they need stream primitives.
