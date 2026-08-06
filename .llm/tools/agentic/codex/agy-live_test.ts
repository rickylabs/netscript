import { assertEquals } from '@std/assert';
import { deriveAgySnapshot, parseAgyConversationIndex } from './agy-live.ts';

const now = new Date('2026-08-05T12:10:00.000Z');

function record(value: Record<string, unknown>): string {
  return JSON.stringify(value);
}

Deno.test('agy state comes from transcript status and recency, never process state', () => {
  const running = record({
    type: 'RUN_COMMAND',
    status: 'RUNNING',
    created_at: '2026-08-05T12:09:55.000Z',
    step_index: 4,
    content: 'deno task check',
  });
  assertEquals(deriveAgySnapshot(running, 'conv', '/repo', '/transcript', now).state, 'working');
  const stalled = deriveAgySnapshot(running, 'conv', '/repo', '/transcript', now, 1_000);
  assertEquals(stalled.state, 'stalled');
  assertEquals(stalled.stateLabel, 'stalled-for-5s');
  assertEquals(deriveAgySnapshot('', 'conv', '/repo', '/transcript', now).state, 'refused');
});

Deno.test('agy snapshot surfaces dispatch issue, non-zero exit, current step, and file evidence', () => {
  const transcript = [
    record({
      type: 'USER_INPUT',
      status: 'DONE',
      created_at: '2026-08-05T12:00:00.000Z',
      step_index: 0,
      content: 'Implement #1115',
    }),
    record({
      type: 'RUN_COMMAND',
      status: 'DONE',
      created_at: '2026-08-05T12:01:00.000Z',
      step_index: 2,
      content: 'deno test',
      exit_code: 1,
    }),
    record({
      type: 'CODE_ACTION',
      status: 'DONE',
      created_at: '2026-08-05T12:02:00.000Z',
      step_index: 3,
      content: 'updated /repo/live.ts ',
    }),
  ].join('\n');
  const result = deriveAgySnapshot(transcript, 'conv', '/repo', '/transcript', now);
  assertEquals(result.state, 'idle');
  assertEquals(result.issue, '#1115');
  assertEquals(result.lastNonZeroExit, { code: 1, step: 2 });
  assertEquals(result.lastFileWritten, '/repo/live.ts');
});

Deno.test('agy worktree index resolves conversation ids', () => {
  assertEquals(
    parseAgyConversationIndex('{"/repo/one":"conv-1","/repo/two":"conv-2"}').get('/repo/two'),
    'conv-2',
  );
});
