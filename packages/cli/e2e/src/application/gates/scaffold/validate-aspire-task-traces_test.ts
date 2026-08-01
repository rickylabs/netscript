import { assertEquals, assertThrows } from '@std/assert';
import { parseNonEmptyTraceArray, resourceInstanceName } from './validate-aspire-task-traces.ts';

Deno.test('parseNonEmptyTraceArray accepts task banners before trace JSON', () => {
  const traces = parseNonEmptyTraceArray('Scanning for running AppHosts...\n[{"traceId":"abc"}]');
  assertEquals(traces, [{ traceId: 'abc' }]);
});

Deno.test('parseNonEmptyTraceArray rejects empty task output', () => {
  assertThrows(
    () => parseNonEmptyTraceArray('Scanning for running AppHosts...\n[]'),
    Error,
    'no non-empty JSON trace array',
  );
});

Deno.test('resourceInstanceName resolves the suffixed DCP resource name', () => {
  assertEquals(
    resourceInstanceName(
      'Scanning for running AppHosts...\n{"resources":[{"name":"workers-abcd","displayName":"workers"}]}',
      'workers',
    ),
    'workers-abcd',
  );
});
