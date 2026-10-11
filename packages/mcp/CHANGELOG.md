# Changelog

## Unreleased

- Preserve telemetry when runtime inspection fails, expose failed inspection findings, and keep
  no-plugin and standalone telemetry verdicts unchanged. Use the shared cross-plugin roll-up.

- Include the host plugin doctor's shared runtime verdict in MCP doctor checks and application
  health reports. Preserve degraded plugins and named child states independently of telemetry
  traffic.
- Forward the plugin-owned health report types used by `DoctorCheck.runtimeHealth`.
