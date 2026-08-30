S6 (#1718, draft PR #1743) establishes the concrete Aspire 13.5 registration hook for generated
health signals: register a stable named callback with `builder.addHealthCheck(key, callback)`, then
attach that key to the resource with `.withHealthCheck(key)`. The callback is evaluated at the
AppHost runtime edge, and `aspire describe --format Json` exposes the named result under the
resource's `healthReports` object.

For #1366, that is the hook a generated background-child contract can attach to once the child state
vocabulary and transport are defined. S6 applies it only to backing-service listener readiness; it
does not consume `declareHealthChecks()`, define plugin-child states, or satisfy any of #1366's
acceptance boxes. In particular, API-healthy/child-dead and crash-loop reporting remain owned here.

Implementation evidence is in draft PR #1743 (`92de34d9b` registers the describe-derived E2E gate;
live receipts remain pending the S6 Phase-B runtime lease).

