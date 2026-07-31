# Research

## Findings

- `FetchTelemetryProbe` marked every received HTTP response reachable, including 404 and 500.
- The CLI generator writes `aspire/apphost.mts`; `AspireDoctorFamily` searched only `.ts` and `.cs` markers.
- `runAgentMcp` already injects `PublicCliCommandCatalog(createPublicCommandRegistry())`. The filed command-catalog cause is stale.
- Workers commands belong to `@netscript/plugin-workers/cli`; the core CLI exposes plugin dispatch verbs rather than mounting plugin-owned command trees.

## Scope correction

Fix the two real diagnostic false results and guard that the CLI composition uses its live public registry. Do not hardcode first-party plugin names into the host catalog.

