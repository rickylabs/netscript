# Runtime auth repair evaluation

Verdict: PASS. Feature round 4, same separate read-only Claude Opus 5.5 session, high effort.

The evaluator inspected the bounded template, generated carrier, probe and regression diff.
Only the workers projection selects optional unmarked credentials. All other BFF callers retain
required defaults; explicit required contract metadata still rejects anonymous calls before
transport. Real generated-BFF RPC tests prove anonymous public success, credential forwarding,
required defaults and explicit metadata. Backend policy remains unchanged.

The browser negative mutation asserts its target exists and removes only the guarded client's
contribution while preserving the auth session read. Its semantic failure assertion remains.
The real browser suite subsequently passed all three cases, including both negative controls.

Probe diagnostics only repeat the final failure reason after logs. No assertion or readiness
condition changed. Generated carriers match the templates; no dependency or lockfile changes.

Full Docker runtime proof remains unproven. Keep the close-gate proof item unchecked until both
tiers pass the actual overview assertion. This review does not substitute for that runtime proof.
