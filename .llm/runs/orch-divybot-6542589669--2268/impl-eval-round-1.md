I found one blocker in the implementation. Everything else I checked holds up, so the verdict is FAIL_FIX.

**Blocker: a service the dashboard doesn't recognise is reported as a connection or authentication failure.**

When a service filter is given, `aspire-telemetry-snapshot.ts` sends `resource=<service>` on the spans and logs reads. I checked Aspire 13.5.3's source:
- `TelemetryApiService` returns null when a resource name matches zero dashboard resources, or more than one. The second case happens when a service runs as several replicas.
- `DashboardEndpointsBuilder` turns that null into **HTTP 404** ("Resource not found").

`readDashboardJson` treats any non-OK response as a failure, so this ends up as `telemetry_unavailable`. The message then tells the user to check AppHost binding, dashboard API authentication and certificates.

The main tool affected is `analyze_service_performance`, which always needs a service name. Common cases include a service that hasn't sent any telemetry yet, a mistyped name, or a service running as several replicas. In all of them, the tool blames the connection when the real answer is "no data for that service". That breaks the issue's requirement for truthful no-data and failure reporting.

The fake dashboard (`tests/telemetry-dashboard-fixtures.ts`) already returns 404 for any resource other than `api`. No test asserts what the tools do in that case.

**Required fix:**
- After a successful token exchange, treat a 404 on a service-filtered spans or logs read as its own result, for example `telemetry_unknown_service`.
- Give it a fixed message: the service name doesn't match exactly one telemetry resource, so check the name or the replica name, or make sure the service is sending telemetry.
- Leave the counts null and include no latency fields.
- Do not reuse the authentication and certificate message for this case.
- Add a fake-dashboard test for an unknown service on all three tools.
- Add a negative control showing a 404 on an unfiltered read is still reported as unavailable.

**What I checked that passes:**
- **Binding:** one async `aspire ps` call per tool call through the existing command edge, matched to the exact AppHost path. An invalid explicit endpoint or port fails without falling back to discovery, and discovery reruns on every call.
- **Supported API:** I checked the pinned Aspire source. The endpoints, the `resource` and `limit` parameters, the `validateToken` exchange, the `x-api-key` header, the plain-list resources response and the `totalCount`/`returnedCount` fields all match.
- **Strict reads:** responses are checked for status, redirects, size (4 MiB cap), JSON and the full response structure before the shared normalizer runs. A record-count mismatch after normalizing is reported as unavailable. The shared reader's habit of turning errors into empty results can't mask anything on this path.
- **Partial and no-data:** truncation is detected from the counts or from hitting the cap. A truncated sample with nothing in the window gives `telemetry_partial`, and a complete empty read gives `telemetry_no_data`. Neither includes latency numbers. A sample with no completed spans gets its own error, and app status turns a "pass" into "warn" when the sample is partial.
- **Time window:** spans and logs outside the window, on either side, are filtered out locally.
- **Logs:** `selectLogs` unpacks the dashboard's nested log records, keeps their resource attributes and extracts the text body. The shared `queryLogs` now uses it.
- **Cancellation and cleanup:** one 10-second deadline covers discovery, authentication and all reads. The Aspire command now closes stdin and force-kills a child that ignores the normal stop signal. The HTTP connection is closed in `finally`.
- **Serving revision:** reported as the MCP package version and documented as not being a deployment commit. Service revisions come only from an emitted `service.version`.
- **Compatibility:** injected query ports still work, are labelled `injected_query` and never claim partial coverage. Production code uses the strict snapshot port.
- **Privacy:** error messages are fixed text. Known secret values are redacted from span labels and service revisions, and tests check all three tool responses contain no login token, API key or config value.
- **Metrics:** native metrics are marked as viewable only in the dashboard.

FAIL_FIX
