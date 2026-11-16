# Drift

rtk/rg absent; direct commands run as node. Pinned Deno2.9.7 via mise. Current maint:leak-check/maint:teardown and check:review-threads task names replace older agentic aliases. Public artifacts omit actual operator paths, hostnames/ports and session identities.

- Runtime research found a pinned native checkpoint alignment failure before any generator change. Original checkpoint probe failure is excluded as proof of the reported missing-AOF finding. Added an AOF-only restart oracle to isolate data loss. Durable launch policy now includes FileStream plus storage-tier, following the confirmed upstream configuration workaround for4K-sector storage, with both directories sharing the configured data path. This is native provider configuration within the existing contract; no version bump or unsupported scheduler.
