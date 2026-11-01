# Resource ownership report — 2026-11-01

Read-only maint:leak-check completed before the preview started. Aspire and process inspection succeeded; Docker container/volume/network inspection was unavailable because this host has no running Docker daemon.

The reporter found 24 unproven foreign/tool process entries, including a separate deployment AppHost. No foreign or unknown-owner resource was stopped or changed. Raw host-specific output remains in the private project evidence directory.

This run's preview roots are `.llm/tmp/scaffold-2570-phase2/utility` and `.llm/tmp/scaffold-2570-phase2/showcase`. The first AppHost is stopped; the second is active for owned seeded plugin validation. Teardown must use exact owned AppHost paths and the repository's ownership checks.
