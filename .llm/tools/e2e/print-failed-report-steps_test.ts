import { assertStringIncludes, assertThrows } from '@std/assert';
import { formatFailedReportSteps } from './print-failed-report-steps.ts';

Deno.test('formatFailedReportSteps prints error and captured command streams', () => {
  const output = formatFailedReportSteps({
    steps: [{
      id: 'behavior.otel.task-traces',
      verdict: 'failed',
      error: 'trace candidates exhausted',
      evidence: [{
        label: 'behavior.otel.task-traces',
        data: { stdoutTail: 'candidate=workers code=0 bytes=3', stderrTail: 'warning' },
      }],
    }],
  });
  assertStringIncludes(output, 'FAILED GATE: behavior.otel.task-traces');
  assertStringIncludes(output, 'error: trace candidates exhausted');
  assertStringIncludes(output, 'stdout: candidate=workers code=0 bytes=3');
  assertStringIncludes(output, 'stderr: warning');
});

Deno.test('formatFailedReportSteps rejects a report without steps', () => {
  assertThrows(() => formatFailedReportSteps({}), Error, 'did not contain steps[]');
});
