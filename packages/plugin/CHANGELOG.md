# Changelog

## Unreleased

- Keep dead children degraded with unprobed APIs, report child-only failure as unhealthy, and export
  the shared cross-plugin health roll-up.

- Export shared plugin runtime health declarations, observations, resource verdicts, and aggregation
  through `@netscript/plugin/health`. Healthy APIs with unhealthy or missing declared children
  report `degraded`.
