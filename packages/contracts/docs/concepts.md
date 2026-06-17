# Concepts

`@netscript/contracts` is a vocabulary package.

It owns stable names and shapes that many packages must share:

- route contract setup;
- common error payload data;
- pagination request and response shapes;
- helper factories for common Zod-backed schemas;
- result types for expected fallible operations.

It does not own service execution, persistence, telemetry, queues, or plugin lifecycle behavior.

Consumers should import from the root for common contract vocabulary and from named subexports for
CRUD, query, or transform helpers.

Workspace-only aliases such as `@shared/utils` are retired and must not appear in generated public
or maintainer import maps.
