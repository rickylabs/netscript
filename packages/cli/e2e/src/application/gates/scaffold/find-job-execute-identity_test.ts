import { assertEquals } from '@std/assert';
import type { TelemetrySpan, TelemetryTrace } from '@netscript/telemetry/query';
import { findJobExecuteIdentity } from './aspire-dashboard-telemetry.ts';

// The runtime suite fires the generic webhook twice (`behavior.triggers-webhook`, then
// `behavior.otel.webhook`), so two `flow-b-callback` executions coexist in the dashboard.
const older = execution('trace-older', 'corr-older');
const underTest = execution('trace-under-test', 'corr-under-test');

Deno.test('findJobExecuteIdentity prefers the execution carrying the fixture correlation', () => {
  assertEquals(findJobExecuteIdentity([older, underTest], 'corr-under-test'), {
    correlationId: 'corr-under-test',
    traceId: 'trace-under-test',
  });
});

Deno.test('findJobExecuteIdentity keeps waiting when the fixture execution is not visible yet', () => {
  assertEquals(findJobExecuteIdentity([older], 'corr-under-test'), undefined);
});

Deno.test('findJobExecuteIdentity falls back to first match without a fixture', () => {
  assertEquals(findJobExecuteIdentity([older, underTest]), {
    correlationId: 'corr-older',
    traceId: 'trace-older',
  });
});

function execution(traceId: string, correlationId: string): TelemetryTrace {
  const span: TelemetrySpan = {
    traceId,
    spanId: `${traceId}-span`,
    name: 'job.execute',
    kind: 'internal',
    startTimeUnixMs: 0,
    statusCode: 1,
    attributes: {
      'netscript.job.id': 'flow-b-callback',
      'netscript.correlation.id': correlationId,
    },
    events: [],
    links: [],
  };
  return { traceId, spans: [span] };
}
