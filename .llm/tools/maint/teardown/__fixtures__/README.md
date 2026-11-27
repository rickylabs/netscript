# Aspire teardown fixtures

These files are version-suffixed snapshots targeting the pinned Aspire release (**17.0.0**) and
consumed by teardown probe tests.

## Aspire 17.0.0

- Capture date: 2026-11-27
- CLI/SDK version: `17.0.0+2d325b13709752ba6d9a943635c5e2940a2530c0`
- Command: `aspire ps --format Json --non-interactive --nologo`

`aspire-ps-17.0.0.json` matches the live Aspire `17.0.0` `aspire ps --format Json` envelope
(`appHostPath`, `appHostPid`, `status`, `sdkVersion: "17.0.0"`, `cliPid`, `dashboardUrl`,
`logFilePath`) with deterministic paths/PIDs and redacted log file paths.

`docker-inspect-17.0.0.json` exercises DCP container label ownership extraction.

## Orphaned process tree

`process-tree-17.0.0-orphaned.json` isolates the three evidence modes the orphan classifier must
support for PPID-1 Aspire descendants: DCP environment label, exact `--apphost` argv, and contained
backchannel socket path.

## Phase-B live process tree

`process-tree-17.0.0-phase-b-live.json` models leased vs. foreign AppHost containment across
`aspire-managed server`, native Deno AppHost execution (`leased-run-apphost-deno`), DCP apiserver /
controllers, and dashboard processes, with explicit `derivedContainmentVectors` covering argv, cwd,
socket, and DCP-label ownership checks.
