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
