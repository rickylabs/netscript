import { assertEquals } from '@std/assert';
import { claudePrintArguments } from './claude-print.ts';

Deno.test('Claude print wrapper preserves route identity and same-session resume', () => {
  assertEquals(
    claudePrintArguments(
      {
        model: 'caller-model',
        effort: 'xhigh',
        prompt: '/unused',
        resume: 'session-id',
        enforceOpenEvaluatorModels: false,
      },
      'do work',
      'session-id',
    ),
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

Deno.test('Claude print wrapper assigns launch identity before the evaluator can make requests', () => {
  assertEquals(
    claudePrintArguments(
      {
        model: 'caller-model',
        effort: 'high',
        prompt: '/unused',
        enforceOpenEvaluatorModels: true,
      },
      'evaluate',
      'new-session-id',
    ).slice(-3),
    ['--session-id', 'new-session-id', 'evaluate'],
  );
});

Deno.test('ordinary Claude print launches retain implicit fresh-session behavior', () => {
  const args = claudePrintArguments(
    {
      model: 'caller-model',
      effort: 'high',
      prompt: '/unused',
      enforceOpenEvaluatorModels: false,
    },
    'design',
    'unused-session-id',
  );
  assertEquals(args.includes('--session-id'), false);
  assertEquals(args.at(-1), 'design');
});
