# Aspire CLI fixtures

Aspire-shaped test data is versioned so adapter compatibility remains explicit. Never replace an
older case when a newer CLI is captured.

## Aspire 13.5.3 describe fixture

- Capture date: 2026-08-29
- CLI/SDK version: 13.5.3
- Command: `aspire describe --apphost <exact-apphost-path> --format Json --non-interactive --nologo`
- Source receipt:
  `origin/test/aspire-13-5-s2-runtime-verification:.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v5-aspire-describe-final.json`
- Inline fixture: `../service-endpoint-source-fixtures.ts`

S2 captured the describe JSON without a banner because the command used `--nologo`. The independent
13.5.3 inline snapshot therefore remains bannerless; the retained 13.4.6 banner case continues to
exercise legacy noise tolerance and DCP-suffix fallback separately.

The inline snapshot selects the receipt's `users` resource and retains its top-level
`{ resources: [...] }` shape, URL entry, string-valued environment, resource metadata, health
report, and commands. It intentionally omits the receipt keys `creationTimestamp`, `startTimestamp`,
`source`, `exitCode`, and `stopTimestamp`. Nested properties and environment are trimmed to
representative adapter inputs; the worktree path, process ID, certificate path, and sensitive
environment values are deterministic or `REDACTED`.

Dashboard telemetry envelope provenance is documented separately in `telemetry/README.md`; a CLI
describe receipt is not a substitute for those dashboard API captures.
