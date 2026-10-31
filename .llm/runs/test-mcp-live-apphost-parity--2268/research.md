# Research

Tracker 2474 and current issue 2268 leave one unproven behavior: a physical
scaffolded AppHost must expose the same actual RPC trace identities to MCP and the
native Aspire CLI. Merged PR 2521 implemented binding/error/privacy behavior, but
only fake-dashboard parity was executed. No open PR covers the live proof.
Other live tracker cells have workers or require explicit owner decisions.

NetScript MCP find_guidance then search_docs were consulted first. Existing
AspireTelemetrySnapshot performs exact project discovery through native aspire ps,
authenticates the supported dashboard API and returns raw trace/span identities;
createMcpCliServer exercises the actual three tool envelopes. Existing CLI e2e
telemetry helpers and executeAspireCliCommand avoid inventing a transport.
The prior compare-cli-fixture.ts is explicitly fake and cannot satisfy this leaf.

Aspire 13.5.3 and .NET 10.0.400 are installed. The dotnet shim lacks an active
version; a task-scoped PATH/DOTNET_ROOT can select the installed SDK without
changing global configuration. Read-only aspire ps was captured privately;
foreign AppHosts must remain untouched. Doctor reports no failed prerequisites.
A real no-database generated scaffold can run only its example RPC service; disable
its optional frontend/cache resources in fixture configuration to avoid containers.
Do not run the local full scaffold.runtime suite.

Proposed public evidence excludes endpoints, operational paths, configuration and
credentials. Keep raw discovery/CLI output private; expose only expected/observed
trace identities, counts, tool verdicts, versions and a content digest. Require
positive known RPC trace identities so two empty results cannot pass.
