# Aspire dashboard telemetry fixtures

The `17.0.0` files in this folder are Aspire Dashboard telemetry API envelopes consumed by
`../../telemetry-live-fixture_test.ts`.

## Current capture

- Aspire version: `17.0.0`
- Capture date: 2026-11-27
- Files: `aspire-17.0.0-resources.json`, `aspire-17.0.0-spans.json`, and `aspire-17.0.0-fixture.ts`
- Endpoints:
  ```text
  GET <dashboardUrl>/api/telemetry/resources
  GET <dashboardUrl>/api/telemetry/spans
  ```
- Coverage: full worker producer + consumer (`queue.enqueue` → `queue.dequeue` → `job.execute`),
  `list_runs`, `get_run` schema validation, `get_last_job_result`, and Aspire `17.0.0` OTLP resource
  attributes (`service.name`, `service.version`, `service.instance.id`).

Never commit credentials, tokens, or sensitive environment values in telemetry fixtures.
