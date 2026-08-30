# Aspire dashboard telemetry fixtures

The 13.4.6 and 13.5.3 files in this folder are real dashboard telemetry envelopes. The 13.4.6
capture remains an active backward-compatibility case and must not be deleted when newer captures
land.

## Current capture

- Aspire version: 13.5.3
- Capture date: 2026-08-30
- Files: `aspire-13.5.3-resources.json`, `aspire-13.5.3-spans.json`, and their TypeScript fixture
- Sequence: under the serialized phase-B lease, trigger the scaffolded `health-check` worker job,
  then capture the dashboard resources and spans endpoints named in `aspire-13.5.3-fixture.ts`.
- Capture scope: the brief-scoped scratch ran through the supervisor-owned loopback relay (D-74)
  without `database.codegen` and without the `streams` plugin required by the workers runtime. The
  envelope therefore contains the trigger's producer span but no consumer/`job.execute` span, 12 web
  `/health` responses with status 500, and no listed worker run (`list_runs` count 0;
  `get_last_job_result` reports `found: false`).
- Interpretation: those degraded semantics are an environment/scope condition, not Aspire 13.5.3
  behavior. Completed consumer-span coverage remains in the retained 13.4.6 fixture case and the
  hosted `scaffold.runtime` suite, whose full plugin topology includes the streams dependency.

## Retained compatibility capture

- Aspire version: 13.4.6
- Capture date: 2026-07-17
- Files: `aspire-13.4.6-resources.json`, `aspire-13.4.6-spans.json`, and their TypeScript fixture
- Sequence: trigger the scaffolded `health-check` worker job, then capture the dashboard resources
  and spans endpoints named in `aspire-13.4.6-fixture.ts`.

## Aspire 13.5.3 capture contract

Phase A had no runtime lease. S2 captured `aspire ps`, `aspire describe`, doctor, and MCP/runtime
projections, but those were not substitutes for the dashboard API envelopes. The real phase-B
capture followed this contract:

After the supervisor grants the runtime lease and supplies the capture command:

1. Start the exact 13.5.3 AppHost under that lease and wait for the required resources.
2. Trigger the scaffolded `health-check` worker job.
3. Capture these exact HTTP requests from the leased dashboard URL:

   ```text
   GET <dashboardUrl>/api/telemetry/resources
   GET <dashboardUrl>/api/telemetry/spans
   ```

4. Save the raw response envelopes as `aspire-13.5.3-resources.json` and `aspire-13.5.3-spans.json`,
   add `aspire-13.5.3-fixture.ts`, and add the 13.5.3 case beside the retained 13.4.6 case in
   `../../telemetry-live-fixture_test.ts`.
5. Promote the parity expectation for that test from `pending-lease` to `required`.

Record the capture date, CLI version 13.5.3, exact AppHost identity, dashboard URL redaction, and
lease evidence in the phase-B commit trail. Never commit credentials, tokens, or sensitive
environment values.
