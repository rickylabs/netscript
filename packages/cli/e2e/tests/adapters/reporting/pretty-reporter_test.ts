import { assertStringIncludes } from '@std/assert';
import { PrettyReporter } from '../../../src/adapters/reporting/pretty-reporter.ts';

Deno.test('pretty reporter surfaces a failed command reason and stderr', async () => {
  const output: string[] = [];
  const reporter = new PrettyReporter((text) => {
    output.push(text);
    return Promise.resolve();
  });
  await reporter.emit({
    type: 'gate-end',
    result: {
      id: 'database.init',
      title: 'Initialize generated database',
      critical: true,
      verdict: 'failed',
      durationMs: 486,
      attempts: [{ attempt: 1, verdict: 'failed', durationMs: 486, failureClass: 'assertion' }],
      retried: false,
      error: 'Command exited 1; expected 0.',
      evidence: [{
        kind: 'command',
        label: 'database.init',
        data: {
          command: ['netscript', 'db', 'init'],
          cwd: '/workspace',
          code: 1,
          timedOut: false,
          stdoutTail: 'Starting db init',
          stderrTail: 'The --apphost option specified a project that does not exist.',
        },
      }],
    },
  });

  const rendered = output.join('');
  assertStringIncludes(rendered, 'FAILED 486ms');
  assertStringIncludes(rendered, 'Command exited 1; expected 0.');
  assertStringIncludes(rendered, 'The --apphost option specified a project that does not exist.');
});

Deno.test('pretty reporter distinguishes a retried pass', async () => {
  const output: string[] = [];
  const reporter = new PrettyReporter((text) => {
    output.push(text);
    return Promise.resolve();
  });
  await reporter.emit({
    type: 'gate-end',
    result: {
      id: 'runtime.aspire-restore',
      title: 'Restore Aspire TypeScript SDK',
      critical: true,
      verdict: 'passed',
      durationMs: 944_000,
      attempts: [
        {
          attempt: 1,
          verdict: 'failed',
          durationMs: 41_000,
          failureClass: 'canceled',
          exitCode: 6,
        },
        { attempt: 2, verdict: 'passed', durationMs: 903_000, exitCode: 0 },
      ],
      retried: true,
      evidence: [],
    },
  });

  assertStringIncludes(
    output.join(''),
    'PASSED (attempt 2/2 after canceled attempt 1, 41s + 903s)',
  );
});

Deno.test('pretty reporter prints every attempt duration when retries fail', async () => {
  const output: string[] = [];
  const reporter = new PrettyReporter((text) => {
    output.push(text);
    return Promise.resolve();
  });
  await reporter.emit({
    type: 'gate-end',
    result: {
      id: 'runtime.aspire-restore',
      title: 'Restore Aspire TypeScript SDK',
      critical: true,
      verdict: 'failed',
      durationMs: 1_800_000,
      attempts: [
        {
          attempt: 1,
          verdict: 'failed',
          durationMs: 900_000,
          failureClass: 'infrastructure',
          exitCode: 1,
        },
        {
          attempt: 2,
          verdict: 'failed',
          durationMs: 900_000,
          failureClass: 'infrastructure',
          exitCode: 1,
        },
      ],
      retried: true,
      evidence: [],
      error: 'Command exited 1; expected 0.',
    },
  });

  assertStringIncludes(output.join(''), 'attempt durations: 900s + 900s');
  assertStringIncludes(output.join(''), 'failure class: infrastructure');
});
