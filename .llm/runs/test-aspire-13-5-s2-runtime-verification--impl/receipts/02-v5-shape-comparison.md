# V5 Aspire JSON shape comparison

Captured with `aspire ps --format Json --non-interactive --nologo` and
`aspire describe --apphost <exact> --format Json --non-interactive --nologo` during start 2; both
exited 0 on 2026-08-29.

## `aspire ps`

The 13.5.3 record retains all 13.4.6 teardown-fixture fields: `appHostPath`, `appHostPid`, `status`,
`sdkVersion`, `cliPid`, and `dashboardUrl`. It adds `logFilePath`. The live `sdkVersion` is `13.5.3`
and status remains lower-case `running`.

## `aspire describe`

The top-level shape remains `{ resources: [...] }`, matching
`packages/mcp/tests/service-endpoint-source-fixtures.ts`. Each live resource has these keys:
`commands`, `creationTimestamp`, `dashboardUrl`, `displayName`, `environment`, `exitCode`,
`healthReports`, `healthStatus`, `name`, `properties`, `relationships`, `resourceType`, `source`,
`startTimestamp`, `state`, `stopTimestamp`, `urls`, and `volumes`. URL entries remain
`{ name, url }`. Environment values remain strings in CLI JSON; committed snapshots redact sensitive
values.

Raw snapshots: `02-v5-aspire-ps-final.json` and `02-v5-aspire-describe-final.json`.
