# Flow-B stream/span empirical join audit

## Verdict

The generated workers service completed a fresh `flow-b-callback` execution, but no execution
record was published to `/workers/executions`. The stream plateaued at the same three startup `job`
snapshots before, during, and after the trigger. This is a product gap outside #1395's
SSE-envelope/consumer-gate scope, not a third selector problem.

## Pre-trigger complete stream shape

The stream was up to date at opaque offset `0000000000000000_0000000000000926` with exactly these
three records:

```json
[
  {
    "type": "job",
    "key": "flow-b-callback",
    "value": {
      "id": "flow-b-callback",
      "name": "Flow B Callback",
      "topic": "default",
      "enabled": true
    },
    "headers": {
      "operation": "upsert",
      "correlationId": "flow-b-callback",
      "traceparent": "00-732fa9bf1f3022ec52e2fbf61530118d-039ebac255132bf9-01",
      "offset": "0000000000000000_0000000000000926"
    }
  },
  {
    "type": "job",
    "key": "health-check",
    "value": {
      "id": "health-check",
      "name": "Health Check",
      "topic": "default",
      "enabled": true
    },
    "headers": {
      "operation": "upsert",
      "correlationId": "health-check",
      "traceparent": "00-11ca629d867ce2d2332a09313e24adc9-8afc4b769f777cb5-01",
      "offset": "0000000000000000_0000000000000926"
    }
  },
  {
    "type": "job",
    "key": "workers-plugin-health-check",
    "value": {
      "id": "workers-plugin-health-check",
      "name": "Workers Health Check",
      "topic": "default",
      "enabled": true,
      "schedule": "*/5 * * * *",
      "description": "Periodic health check of the workers system"
    },
    "headers": {
      "operation": "upsert",
      "correlationId": "workers-plugin-health-check",
      "traceparent": "00-6722197ab8b4dc36aaa571ee7a6c9990-1714a5dfc8b5c602-01",
      "offset": "0000000000000000_0000000000000926"
    }
  }
]
```

The following control was emitted:

```json
{
  "streamNextOffset": "0000000000000000_0000000000000926",
  "streamCursor": "2890128",
  "upToDate": true
}
```

## Fresh trigger and completed execution

Webhook response:

```json
{
  "accepted": true,
  "status": 202,
  "acceptedAt": "2026-08-09T00:16:22.672Z",
  "eventId": "trg_evt_ea436f98-c6b3-4c14-8138-14610897da80",
  "triggerId": "inbound/generic"
}
```

Workers execution API record:

```json
{
  "id": "f27ee619-5c8f-426c-ab34-e78b3da5c877",
  "concept": "job",
  "jobId": "flow-b-callback",
  "topic": "default",
  "status": "completed",
  "triggeredBy": "event",
  "triggeredAt": "2026-08-09T00:16:22.699Z",
  "startedAt": "2026-08-09T00:16:22.706Z",
  "completedAt": "2026-08-09T00:16:22.749Z",
  "duration": 43,
  "error": null,
  "result": {
    "jobId": "flow-b-callback",
    "payload": {
      "verbose": false
    }
  },
  "attempt": 0,
  "maxAttempts": 3,
  "executionId": "f27ee619-5c8f-426c-ab34-e78b3da5c877"
}
```

## Complete selected `job.execute` span identity and attributes

- Trace id: `02512162b8ecc8b0c75d4fc532656080`
- Span id: `98f63759e649fccb`
- Parent span id: `6c12214590b00097`
- Kind: `1`
- Status: `{ "message": "", "code": 1 }`
- Links: `null`

```json
{
  "netscript.job.id": "flow-b-callback",
  "job.id": "flow-b-callback",
  "netscript.job.name": "Flow B Callback",
  "job.name": "Flow B Callback",
  "netscript.job.entrypoint": "./flow-b-callback.ts",
  "job.entrypoint": "./flow-b-callback.ts",
  "netscript.job.timeout_ms": "300000",
  "job.timeout_ms": "300000",
  "netscript.job.max_retries": "3",
  "job.max_retries": "3",
  "netscript.job.timezone": "UTC",
  "job.timezone": "UTC",
  "execution.id": "f27ee619-5c8f-426c-ab34-e78b3da5c877",
  "job.status": "completed",
  "netscript.outcome": "completed",
  "job.trigger": "event",
  "netscript.correlation.id": "trg_evt_ea436f98-c6b3-4c14-8138-14610897da80",
  "job.duration_ms": "49",
  "job.exit_code": "0"
}
```

## Before/after growth observation

A live subscription was opened from committed offset
`0000000000000000_0000000000000926` before the webhook and held for 25 seconds. It emitted an
initial up-to-date control and no data before timing out. The post-trigger full snapshot still had
exactly the same three `job` records and the same committed offset. Its cursor advanced from
`2890128` to `2890130`, which is control/liveness progress, not a published change.

## Join analysis

The only values present on both sides are definition-level job identity:

- stream `key` / `value.id` / header `correlationId` = `flow-b-callback`;
- span `job.id` / `netscript.job.id` = `flow-b-callback`;
- stream `value.name` = span `job.name` = `Flow B Callback`.

Those fields join the span to a startup job-definition snapshot, not to execution
`f27ee619-5c8f-426c-ab34-e78b3da5c877`. No stream record contains the execution id,
`trg_evt_ea436f98-c6b3-4c14-8138-14610897da80`, or trace id
`02512162b8ecc8b0c75d4fc532656080`. None of the three snapshot `traceparent` trace ids equals the
execution trace id.

Therefore an ordering selector cannot recover a missing execution record, and selecting the
definition snapshot by job id would falsely link startup publication telemetry to the execution.
No selector or product change was implemented in #1395 after this finding.
