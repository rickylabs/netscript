I found two blockers. Both are about whether the tools tell the truth when they report no data.

**Blocker 1: the shared normalizer drops every log, so app status would report false no-data.**
The plan reads logs for `get_app_status` through the shared `@netscript/telemetry/query` reader and counts which services sent telemetry from both spans and logs. But that reader can't handle the log format the dashboard returns:
- `queryLogs` calls `selectItems(payload, ['logs','items'])` (`packages/telemetry/src/adapters/aspire-query/aspire-telemetry-query.ts:110`).
- `selectItems` doesn't unpack `resourceLogs/scopeLogs/logRecords`. It returns the whole wrapper as a single item. `normalizeLog` then finds no timestamp and discards it (`aspire-telemetry-normalize.ts:284`).
- Only spans are unpacked, with their service identity kept (`selectSpans`, `:410`). Nothing in either package handles `resourceLogs`.

So a successful log read would always come back empty. App status would show zero logs and zero log-sending services, even with real logs in the window.

Required fix:
- Name the change in the plan's slice 2 file list. Add a log selector to `packages/telemetry`, which is already an allowed write area, built like `selectSpans`: unpack the `resourceLogs` wrapper and keep each record's resource attributes.
- Add a test that feeds the CLI's real JSON output for logs and checks the log count and the services found.
- Add a negative-control test: a wrapper with missing or wrong-shaped content must come back as "unavailable", never as an empty success.

Related: the existing reader catches every error and returns nothing (`#request` at `:171`). The plan's checks for invalid JSON and a missing wrapper must therefore run in the MCP adapter before the output reaches that reader. The plan should say this explicitly.

**Blocker 2: a capped sample can't prove there is no data.**
The dashboard can't filter by time, so the plan takes at most 1,000 spans and applies the time window locally. If the dashboard returns exactly 1,000 spans and none of them fall in the window, the window may simply not be covered by that sample. The plan would still label it `no_data` with count 0, which is the same untruthful no-data result the issue asks to fix.

Required fix:
- Allow `no_data` only when the sample wasn't capped (fewer than 1,000 results), or when the sample's oldest and newest timestamps cover the whole requested window.
- Otherwise, report a distinct "truncated / partial coverage" result, and include the timestamp range of the sample in the provenance.
- Add a fake-dashboard test where the sample is capped and every span falls outside the window, checking that it is not reported as `no_data`.

**Everything else in scope is adequately planned:**
- Explicit binding to the project's AppHost or a configured dashboard URL, with no fallback to a default dashboard.
- Using the supported dashboard API the same way the CLI does, through the existing cancellable Aspire command seam.
- Native metrics stated as viewable only in the dashboard.
- Privacy: fixed error messages, an allowlist for command output, and a test that the full response contains no credentials.
- Fake-dashboard proof, plus tests for command failure, cancellation and invalid JSON.
- The chosen gates.

I checked the Aspire CLI locally (13.5.3): `aspire otel logs` accepts `--apphost`, `--dashboard-url` (login URLs included), `--format Json` and `--limit`, which matches the plan.

FAIL_PLAN
