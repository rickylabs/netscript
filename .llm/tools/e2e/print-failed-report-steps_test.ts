import { assert, assertStringIncludes, assertThrows } from '@std/assert';
import {
  formatFailedReportAnnotation,
  formatFailedReportErrorCommand,
  formatFailedReportSteps,
  formatFailedReportStepSummary,
} from './print-failed-report-steps.ts';

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
  assertStringIncludes(output, 'DECISIVE ERROR:');
  assertStringIncludes(output, 'trace candidates exhausted');
  assertStringIncludes(output, 'stdout: candidate=workers code=0 bytes=3');
  assertStringIncludes(output, 'stderr: warning');
});

Deno.test('formatFailedReportSteps leads with decisive Prisma errors and filters download noise', () => {
  const report = failedDatabaseReport();
  const output = formatFailedReportSteps(report);

  assertStringIncludes(output, 'FAILED GATE: database.init');
  assertStringIncludes(output, '[prisma-init-postgres] Error code: P1012');
  assertStringIncludes(
    output,
    '[prisma-init-postgres] error: The model "User" cannot be defined because a model with that name already exists.',
  );
  assert(!output.includes('Download https://registry.npmjs.org/@prisma%2fdebug'));
  assert(output.indexOf('DECISIVE ERROR:') < output.indexOf('FILTERED TAILS'));
});

Deno.test('GitHub diagnostic formats carry the failed gate and decisive error', () => {
  const report = failedDatabaseReport();
  const annotation = formatFailedReportAnnotation(report);
  const command = formatFailedReportErrorCommand(report);
  const summary = formatFailedReportStepSummary(report);

  assertStringIncludes(annotation, 'database.init');
  assertStringIncludes(annotation, 'P1012');
  assertStringIncludes(annotation, 'The model "User" cannot be defined');
  assertStringIncludes(command, '::error title=Production CLI E2E failed::database.init');
  assertStringIncludes(summary, '## Production CLI E2E failure');
  assertStringIncludes(summary, 'database.init');
  assertStringIncludes(summary, 'P1012');
});

Deno.test('formatFailedReportSteps rejects a report without steps', () => {
  assertThrows(() => formatFailedReportSteps({}), Error, 'did not contain steps[]');
});

function failedDatabaseReport(): unknown {
  return {
    steps: [{
      id: 'database.init',
      verdict: 'failed',
      error: 'Command exited 1; expected 0.',
      evidence: [{
        label: 'database.init',
        data: {
          stdoutTail: [
            '[prisma-init-postgres] Download https://registry.npmjs.org/@prisma%2fdebug',
            '[prisma-init-postgres] Loaded Prisma config from prisma.config.ts.',
            '[prisma-init-postgres] Error: Prisma schema validation - (validate wasm)',
            '[prisma-init-postgres] Error code: P1012',
            '[prisma-init-postgres] error: The model "User" cannot be defined because a model with that name already exists.',
          ].join('\n'),
          stderrTail:
            'db init failed with exit code 1.\nError: Database operation failed with exit code 1',
        },
      }],
    }],
  };
}
