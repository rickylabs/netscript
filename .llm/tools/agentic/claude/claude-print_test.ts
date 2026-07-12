import { assertEquals } from '@std/assert';
import { claudePrintArguments } from './claude-print.ts';

Deno.test('Claude print wrapper preserves route identity and same-session resume', () => {
  assertEquals(
    claudePrintArguments({
      model: 'caller-model',
      effort: 'xhigh',
      prompt: '/unused',
      resume: 'session-id',
    }, 'do work'),
    [
      '-p',
      '--model',
      'caller-model',
      '--effort',
      'xhigh',
      '--permission-mode',
      'bypassPermissions',
      '--output-format',
      'stream-json',
      '--verbose',
      '--resume',
      'session-id',
      'do work',
    ],
  );
});
