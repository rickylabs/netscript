Historical research probe only. Final implementation retains API 1.9.1 and bounds instrumentation to 0.223.0 because existing SDK peers exclude 1.10. See consumer-peer-control.ts and worklog.md for final evidence.

# Consumer compatibility / 2026-10-30

A temp consumer import map with API 1.10.0, oRPC OTel 1.16.1 and instrumentation 0.300.0 successfully imports logs, ORPCInstrumentation, and the in-tree @netscript/telemetry/orpc TracingPlugin. Exit 0 with no peer warning. Pass the root catalog plus materialized npm mappings because referenced workspace package.json files use catalog dependencies; a minimal map without catalog fails on zod before reaching telemetry.

This is intentionally a lockless consumer control, separate from frozen CI fixtures. API ~1.10.0 is preferred over ^1.10.0 because instrumentation 0.300 requires >=1.10 <1.11.
