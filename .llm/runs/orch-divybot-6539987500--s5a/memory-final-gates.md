# 2026-10-31 — Final carrier and environment traps

After moving init execution to run-init-command.ts and adding URL acceptance,
regenerate .llm/tools/validation/fixtures/aspire-surface-manifest.tsv through
aspire-surface-manifest.ts. The generator classifies all tracked Aspire mentions,
including helpers and tests; no version pin change is needed. Check parity after
regeneration. Its final diff is two added owned source/test rows and the archival lesson row.

check:assets-barrel compares regenerated output against HEAD, so commit source
and carrier changes before running that freshness verdict. MCP corpus check also
requires a clean package/plugin read set. docs:accuracy and root check/lint/fmt
must still run in addition to explicit figma:ci; root excludes tools.

Optional Chromium UI smoke could not launch on this worker: libnspr4.so is
missing. Keep that and actual Figma host acceptance UNPROVEN. Browser bundle
build, main-sandbox execution, fixture inverse and Plugin API mock tests pass.
Full Docker/Aspire runtime is also UNPROVEN because Docker daemon is absent.
Never turn preflight success or mocked tests into a native-host claim.
