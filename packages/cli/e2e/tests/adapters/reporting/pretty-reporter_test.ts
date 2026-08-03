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
