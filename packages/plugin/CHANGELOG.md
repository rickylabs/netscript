# Changelog

## Unreleased

- Export shared plugin runtime health declarations, observations, resource verdicts, and aggregation
  through `@netscript/plugin/health`. Healthy APIs with unhealthy or missing declared children
  report `degraded`.
