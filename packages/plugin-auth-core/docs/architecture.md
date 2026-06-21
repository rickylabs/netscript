# Auth Core Architecture

`@netscript/plugin-auth-core` is a contract-only package for the Track-5 auth plugin program. It
owns the domain vocabulary, backend port, oRPC v1 contract shape, stream schema, config schema,
provider/backend preset contracts, and small testing fixtures.

The package deliberately has no HTTP handlers, oRPC router implementation, CLI, database schema, or
provider SDK adapter. Those belong to later backend and plugin slices.
