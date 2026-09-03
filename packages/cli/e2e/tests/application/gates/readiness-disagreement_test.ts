import { assertEquals, assertThrows } from '@std/assert';
import {
  assertReadinessDisagreement,
  observeReadiness,
  POSTGRES_READY_LOG_MARKER,
} from '../../../src/application/gates/scaffold/runtime/readiness-disagreement.ts';
import type { ListenerHealthReport } from '../../../src/application/gates/scaffold/runtime/verify-listener-readiness.ts';

// A real Postgres startup tail. The marker line is emitted once, after the server binds the socket
// it will serve — which is precisely why it can precede reachability at the *published* endpoint.
const READY_LOG = [
  '2026-09-02 12:00:01.114 UTC [1] LOG:  starting PostgreSQL 17.2 on x86_64-pc-linux-gnu',
  '2026-09-02 12:00:01.140 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432',
  '2026-09-02 12:00:01.298 UTC [29] LOG:  database system was shut down at 2026-09-02 11:59:58 UTC',
  `2026-09-02 12:00:01.402 UTC [1] LOG:  ${POSTGRES_READY_LOG_MARKER}`,
].join('\n');

const STARTING_LOG = [
  '2026-09-02 12:00:01.114 UTC [1] LOG:  starting PostgreSQL 17.2 on x86_64-pc-linux-gnu',
  '2026-09-02 12:00:01.140 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432',
].join('\n');

function report(status: string, description?: string): ListenerHealthReport {
  return {
    resourceName: 'postgres',
    healthCheckKey: 'postgres_listener',
    status,
    ...(description === undefined ? {} : { description }),
  };
}

Deno.test('gate 2 state: ready log with an unreachable listener is a disagreement, with the reason kept', () => {
  const observation = observeReadiness(
    report('Unhealthy', 'postgres listener ECONNREFUSED on 127.0.0.1:54329'),
    READY_LOG,
  );
  assertEquals(observation.agreement, 'disagreement');
  assertEquals(observation.logAnnouncesReady, true);
  assertEquals(observation.listenerHealthy, false);
  // The receipt must say *why* the probe disagreed, not merely that it did.
  assertEquals(observation.listenerFailure, 'postgres listener ECONNREFUSED on 127.0.0.1:54329');
  assertReadinessDisagreement(observation);
});

Deno.test('an unhealthy listener with no ready log is ordinary startup, not the gate-2 state', () => {
  const observation = observeReadiness(report('Unhealthy', 'ETIMEDOUT'), STARTING_LOG);
  assertEquals(observation.agreement, 'agreed-not-ready');
  // This is the misread gate 2 explicitly warns against: it demonstrates a failing probe, not a
  // false negative, and must not be accepted as evidence.
  assertThrows(
    () => assertReadinessDisagreement(observation),
    Error,
    'the container log never announced readiness',
  );
});

Deno.test('both signals agreeing is not a disagreement in either direction', () => {
  const ready = observeReadiness(report('Healthy'), READY_LOG);
  assertEquals(ready.agreement, 'agreed-ready');
  assertThrows(() => assertReadinessDisagreement(ready), Error, 'not reproduced');

  const ahead = observeReadiness(report('Healthy'), STARTING_LOG);
  assertEquals(ahead.agreement, 'listener-ahead-of-log');
});

Deno.test('marker matching is case-insensitive and engine-parameterised', () => {
  const shouted = READY_LOG.toUpperCase();
  assertEquals(observeReadiness(report('Unhealthy'), shouted).agreement, 'disagreement');
  // A different engine announces readiness differently; the marker is a parameter, not a constant.
  const mysqlLog = '2026-09-02T12:00:01Z 0 [System] [MY-010931] ready for connections. Port: 3306';
  assertEquals(
    observeReadiness(report('Unhealthy'), mysqlLog, 'ready for connections').agreement,
    'disagreement',
  );
});
