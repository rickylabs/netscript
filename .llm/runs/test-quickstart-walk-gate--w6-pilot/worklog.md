# Worklog

## Design

- Public surface: built-in suite ID `quickstart.walk`; seven stable gate IDs under `quickstart.*`; workflow invocation through `deno task e2e:cli run quickstart.walk`.
- Domain vocabulary: `QUICKSTART`, `QUICKSTART_TITLE`, seven `GATE.QUICKSTART_*` constants, and a finite ordered documented-command manifest.
- Ports: existing `CommandExecutor`, `HttpClient`, reporters, clock, and platform ports. No new port.
- Constants: suite ID, title, seven gate IDs, Aspire step deadlines/classifications, normalized Quickstart commands.
- Commit slices: plan; semantic suite/docs; canary wiring; evaluation.
- Deferred: no local-source mode and no real published run before canary publication.
- Contributor path: update the Quickstart fenced commands and the ordered suite manifest together; the drift test points to the mismatched step.

## Evidence

Pending implementation.

