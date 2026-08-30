# Aspire CLI fixtures

Aspire-shaped test data is versioned so adapter compatibility remains explicit. Never replace an
older case when a newer CLI is captured.

## Aspire 13.5.3 describe fixture

- Capture date: 2026-08-29
- CLI/SDK version: 13.5.3
- Command:
  `aspire describe --apphost <exact-apphost-path> --format Json --non-interactive --nologo`
- Source receipt:
  `origin/test/aspire-13-5-s2-runtime-verification:.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v5-aspire-describe-final.json`
- Inline fixture: `../service-endpoint-source-fixtures.ts`

The inline test snapshot retains the receipt's top-level `{ resources: [...] }` shape, URL entries,
string-valued environment, resource metadata, health reports, and commands. Worktree paths, PIDs,
ports, instance suffixes, and sensitive environment values are deterministic or `REDACTED`.

Dashboard telemetry envelope provenance is documented separately in `telemetry/README.md`; a CLI
describe receipt is not a substitute for those dashboard API captures.
