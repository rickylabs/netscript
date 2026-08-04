# #1225 owner seven-point protocol

## 1. Fresh default scaffold

Created `.llm/tmp/1225-protocol/saga-1225-live` from the local maintainer CLI with the default
application surface and Postgres, then installed the local sagas and streams plugins, generated the
registry, migrated/generated the database, and ran its generated TypeScript AppHost.

## 2. Populated health reports

Aspire described all three relevant resources as `Running` + `Healthy` with named HTTP reports:

- `sagas_http_/health_200_check: Healthy`
- `sagas-api_http_/health_200_check: Healthy`
- `streams_http_/health_200_check: Healthy`

The API's inspected `/health` response was HTTP 200 with `status: healthy`.

## 3. Full lifecycle and compensation

Four inspected publish responses were HTTP 200 for `user.started`, `user.advanced`,
`user.completed`, and `user.rollback`. The durable API projection showed:

- `terminal-1225`: `completed`, version/messageCount 3, steps
  `[started, advanced, completed]`.
- `compensate-green-1225`: `compensating`, version/messageCount 1; the corresponding
  `saga.handle` span reports `netscript.outcome=compensated`.

## 4. Live stream and correlated Aspire telemetry

The inspected durable stream contained three distinct upserts for the same terminal key, versions
1 → 2 → 3 with `running`, `running`, then `completed`, and one compensation-path upsert. Each event
carried a transition traceparent. Aspire showed matching `saga.handle` spans for the terminal
correlation and the compensation correlation. For the post-restart transition, trace
`7220d1a99f38ec6abb8e7ade1bcf1601` joined API publish → queue enqueue/dequeue → `saga.handle` →
`stream.publish` → HTTP POST to the streams service; the stream request returned 204.

`aspire otel traces`, `aspire otel spans`, and `aspire otel logs` were all inspected through the
run's dashboard. The attached Aspire export retains resource state, console logs, structured logs,
and traces.

## 5. RED first

Before implementation, the compile fixture failed with TS2305 because
`SagaStreamInstanceProjection` did not exist. After implementation, its three transition upserts
passed, including compensation lifecycle states. The focused plugin suite finished 50 passed,
0 failed, 1 environment-gated Redis test ignored.

## 6. Restart durability

The saga processor was restarted through `aspire resource sagas restart`; its PID changed and its
named HTTP health report returned Healthy. The API still returned `terminal-1225` at version 3 and
`compensate-green-1225` at version 1 after restart. A new post-restart transition produced a
correlated `stream.publish` span and a 204 streams POST.

## 7. Artifact-first verdict and hygiene

Claims above come from response bodies, durable stream payloads, populated Aspire describe reports,
and OTEL records—not exit codes. `aspire-export.zip` is the retained machine artifact. The run-owned
AppHost is torn down after export; foreign containers reported by the leak checker remain untouched.

