# Aspire teardown fixtures

These files are version-suffixed snapshots consumed by teardown probe tests. Keep older versions as
compatibility cases.

## Aspire 13.5.3

- Capture date: 2026-08-29
- CLI/SDK version: 13.5.3
- Command: `aspire ps --format Json --non-interactive --nologo`
- Source receipt:
  `origin/test/aspire-13-5-s2-runtime-verification:.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v5-aspire-ps-final.json`

The JSON was copied from that receipt before redaction. To preserve the established 13.4.6 fixture
conventions and deterministic assertions, worktree paths, PIDs, dashboard port, and the new
`logFilePath` value are replaced with the existing stable fixture values or `REDACTED`. The 13.5.3
shape difference remains explicit: `logFilePath` is present and `sdkVersion` is `13.5.3`.

The Docker inspect fixture remains named `docker-inspect-13.4.6.json`; S2's V5 shape comparison did
not identify a Docker envelope change, and this slice does not fabricate a new Docker capture.

## Orphaned process tree

`process-tree-13.5.3-orphaned.json` is synthetic, not a live capture. Its PIDs, worktree, and
process facts are shaped from S2 V6's launcher-orphan lifecycle receipt and #1429's observed
`aspire-managed` PPID-1 helpers. The three rows isolate the evidence modes the classifier must
support: DCP environment label, exact `--apphost` argv, and contained backchannel socket path.

## Phase-B live process tree

`process-tree-13.5.3-phase-b-live.json` copies the relevant process rows from receipts archived at
commit `d8187e5a8656de8f9443f4e33f0a91ece56a7dd2`. PIDs, start-time ticks, AppHost paths,
managed-server `--contentRoot` argv, and post-SIGKILL PPIDs are preserved exactly; the
already-redacted log path remains redacted.

The fixture separately labels its DCP-label/socket/cwd entries as `derivedContainmentVectors`. Those
values exercise the Phase-A evidence contract using the exact leased and foreign roots; they are not
represented as fields observed by the live `/proc` capture.
