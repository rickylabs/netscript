The round-1 blocker is fixed, and I found no new blockers in the working tree against baseline `851d1ce`. This is the source-level sign-off only; the merge decision still waits for the final review of the exact pushed commit.

**The round-1 fix holds:**
- A 404 on a service-filtered spans or logs read now returns `telemetry_unknown_service`. The message covers the service or replica name, whether the service has sent telemetry, and whether the dashboard API is enabled. Counts stay null and there are no latency fields.
- A 404 on an unfiltered read, on resources, or on the token exchange still returns `telemetry_unavailable`, as do authentication and connection failures.
- When one parallel read fails, the others are cancelled and awaited, and the original error is kept. The HTTP connection is closed in `finally`.
- Trusting the dashboard's own service match applies only to dashboard reads. Injected query ports still filter by `service.name`, so replica spans are counted without loosening the injected path.

**The rest of the slice checks out:**
- **Binding:** one async `aspire ps` call per tool call, matched to the exact AppHost. An explicit endpoint or port that is invalid fails without falling back to discovery.
- **Strict reads:** responses are checked for status, size, JSON and full structure before the shared normalizer runs, and lost records are reported as unavailable. The status tool's `limit` is validated as an integer from 1 to 1000.
- **Partial and no-data:** truncation is detected from the counts or from hitting the cap. A capped sample with nothing in the window is never reported as no data.
- **Schemas and docs:** the provenance schema lists all five states and the nullable counts. The README and site reference describe the error codes and the partial-coverage rules.
- **Logs:** the shared `selectLogs` fix is in place and has tests.
- **Privacy:** error messages are fixed text, and known secret values are redacted from span labels and service revisions.

I did not rerun the gates. The 526/526 suite, the gate results, the five failing-on-purpose import-map controls and the CLI-versus-MCP trace comparison are as you report them. I couldn't check the recorded results directly because `gate-results.json` is not in the run directory; it needs to be there before the final review.

The live comparison against a real NetScript AppHost was not done, so that acceptance item has to be labelled UNPROVEN in READY.

**Non-blocking note:** `get_app_status` now caps its read at the `limit` input, default 100. A busy, healthy app will usually hit that cap, so it reports `partial` and status drops from pass to warn. That matches the docs. However, the attached message reuses the empty-window text ("does not cover this window… absence of samples…") even when samples were found. A separate message for a partial sample that does contain data would be more accurate.

PASS
