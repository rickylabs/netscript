import { assertEquals } from '@std/assert';
import { MODEL_IDS } from '../config/models.ts';
import { classifyCodexFailure, classifyCodexRolloutFailure } from './classify-codex-failure.ts';

const NOW = new Date(2026, 6, 11, 4, 0, 0);

function localIso(hour: number, minute: number, dayOffset = 0): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

Deno.test('classifies beta.6 quota exhaustion and its 12-hour reset time', () => {
  assertEquals(
    classifyCodexFailure(
      'You have hit your usage limit ... try again at 5:42 AM',
      NOW,
    ),
    { kind: 'quota_exhausted', resetAt: localIso(5, 42) },
  );
});

Deno.test('classifies quota exhaustion without a reset time', () => {
  assertEquals(classifyCodexFailure('You have hit your usage limit', NOW), {
    kind: 'quota_exhausted',
  });
});

Deno.test('parses a 24-hour reset time and rolls a passed time to tomorrow', () => {
  assertEquals(
    classifyCodexFailure('You have reached your usage limit; try again at 03:15', NOW),
    { kind: 'quota_exhausted', resetAt: localIso(3, 15, 1) },
  );
});

Deno.test('classifies model capacity independently from quota', () => {
  assertEquals(classifyCodexFailure(`${MODEL_IDS.codexSol} is at capacity`, NOW), {
    kind: 'model_capacity',
  });
});

Deno.test('preserves unclassified output', () => {
  assertEquals(classifyCodexFailure('transport closed unexpectedly', NOW), {
    kind: 'other',
    raw: 'transport closed unexpectedly',
  });
});

Deno.test('rollout classification ignores a quoted quota message in the user prompt', () => {
  const prompt = JSON.stringify({
    type: 'response_item',
    payload: { type: 'message', role: 'user', content: 'You have hit your usage limit' },
  });
  assertEquals(classifyCodexRolloutFailure(prompt, NOW), { kind: 'other', raw: '' });
});

Deno.test('rollout classification reads structured error records', () => {
  const error = JSON.stringify({
    type: 'event_msg',
    payload: { type: 'error', message: 'You have hit your usage limit; try again at 17:42' },
  });
  assertEquals(classifyCodexRolloutFailure(error, NOW), {
    kind: 'quota_exhausted',
    resetAt: localIso(17, 42),
  });
});
