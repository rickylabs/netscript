# Changelog

## Unreleased

- Keep legacy project-doctor failures visible even with a service filter. A declared runtime with a
  stopped or unavailable AppHost intentionally reports `fail`, rather than `warn`, while keeping
  telemetry.

- Discover generated plugin API/child ownership from reconciled references with optional
  installation overrides. Keep malformed health-capable child declarations visible as warning
  checks, including in status polling. Standalone runtime polling remains neutral.

- Preserve telemetry when runtime inspection fails, expose failed inspection findings, and keep
  no-plugin and standalone telemetry verdicts unchanged. Use the shared cross-plugin roll-up.

- Include the host plugin doctor's shared runtime verdict in MCP doctor checks and application
  health reports. Preserve degraded plugins and named child states independently of telemetry
  traffic.
- Forward the plugin-owned health report types used by `DoctorCheck.runtimeHealth`.
