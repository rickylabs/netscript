# Aspire CLI fixtures

Aspire-shaped test data targets the pinned Aspire release (**17.0.0**).

## Aspire 17.0.0 describe fixture

- Capture date: 2026-11-27
- CLI/SDK version: `17.0.0+2d325b13709752ba6d9a943635c5e2940a2530c0`
- Command: `aspire describe --apphost <exact-apphost-path> --format Json --non-interactive --nologo`
- Inline fixture: `../service-endpoint-source-fixtures.ts` (`ASPIRE_DESCRIBE_17_0_0_FIXTURE`)

The `17.0.0` inline snapshot is bannerless (captured with `--nologo`) and records the live native
Deno AppHost shape (`resourceTypeDisplayName: "Deno"`, `resource.launchConfigurationType: "deno"`,
`OTEL_RESOURCE_ATTRIBUTES` carrying both `service.version` and `service.instance.id`). The separate
`ASPIRE_DESCRIBE_FIXTURE` exercises leading-banner noise tolerance and DCP-suffix fallback.

Worktree paths, PIDs, certificate paths, and sensitive environment values are deterministic or
`REDACTED`. Dashboard telemetry envelope provenance is documented separately in
`telemetry/README.md`.
