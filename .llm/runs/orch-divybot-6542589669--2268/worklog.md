# Worklog

## Design checkpoint

1. Public surface: existing three tools, project-root binding, diagnostic/provenance output, documented span-derived analysis and Metrics-view limitation.
2. Vocabulary: binding (selected AppHost or explicit dashboard); window (inclusive requested lower/upper timestamps); sample (selected span); no_data (successful empty window); unavailable (query/discovery failure); servingRevision (MCP package version, never a fabricated source SHA); service revision (observed service.version).
3. Ports: consumed TelemetrySnapshotPort; existing cancellable Aspire command seam; injected clock; existing project doctor.
4. Constants: default 15-minute window, maximum 1000 samples, finite command deadline, fixed diagnostic codes/messages, source and native metrics capability.
5. Commit slices: bootstrap; contract/adapter/flows/regression proof; documentation/final verification. Per-slice gates/files are locked in plan.md.
6. Deferred scope: native metric queries, other tool adapters, subscriptions and scaffold changes as detailed in plan.md.
7. Contributor path: packages/mcp/src/ports/telemetry-snapshot-port.ts.

Owner routing override, verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only." Separate Anthropic evaluation preserves session/family independence. Baseline rechecked against main; no covering PR found. No orchid-triage comment exists at intake.

Bootstrap reconcile: only declared run artifacts added; assignment file remains excluded. PLAN-EVAL pending; no source implementation started.
