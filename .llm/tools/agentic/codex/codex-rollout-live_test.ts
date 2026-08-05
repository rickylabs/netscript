import { assertEquals, assertMatch } from '@std/assert';
import {
  codexLiveEvents,
  deriveCodexLiveSnapshot,
  parseCodexSessionIdentity,
  resolveCodexRollout,
} from './codex-rollout-live.ts';

const id = '019fcd0e-126a-7ed0-9464-936575286cf3';
const path = `/sessions/rollout-2026-08-04T15-54-39-${id}.jsonl`;
const now = new Date('2026-08-05T12:10:00.000Z');

function line(timestamp: string, type: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ timestamp, type: 'event_msg', payload: { type, ...extra } });
}

Deno.test('live state distinguishes working, idle, and stalled with a fake clock', () => {
  const working = [
    line('2026-08-05T12:09:30.000Z', 'task_started'),
    line('2026-08-05T12:09:45.000Z', 'agent_reasoning', { text: 'Checking the failing gate' }),
  ].join('\n');
  assertEquals(deriveCodexLiveSnapshot(working, path, now).state, 'working');

  const idle = `${working}\n${line('2026-08-05T12:09:50.000Z', 'task_complete')}`;
  assertEquals(deriveCodexLiveSnapshot(idle, path, now).state, 'idle');

  const stalled = deriveCodexLiveSnapshot(working, path, now, 10_000);
  assertEquals(stalled.state, 'stalled');
  assertEquals(stalled.stateLabel, 'stalled-for-15s');
});

Deno.test('structured terminal failure distinguishes refused from dead', () => {
  const refused = [
    line('2026-08-05T12:09:00.000Z', 'task_started'),
    line('2026-08-05T12:09:01.000Z', 'turn_aborted', { reason: 'Weekly quota exhausted' }),
  ].join('\n');
  assertEquals(deriveCodexLiveSnapshot(refused, path, now).state, 'refused');

  const dead = [
    line('2026-08-05T12:09:00.000Z', 'task_started'),
    line('2026-08-05T12:09:02.000Z', 'agent_reasoning', { text: 'Implementing the parser' }),
    line('2026-08-05T12:09:03.000Z', 'error', { message: 'Weekly quota exhausted' }),
  ].join('\n');
  assertEquals(deriveCodexLiveSnapshot(dead, path, now).state, 'dead');
});

Deno.test('quoted quota and refusal prose cannot fabricate a terminal state', () => {
  const rollout = [
    line('2026-08-05T12:09:00.000Z', 'task_started'),
    JSON.stringify({
      timestamp: '2026-08-05T12:09:10.000Z',
      type: 'event_msg',
      payload: { type: 'user_message', message: 'the lane refused: weekly quota exhausted' },
    }),
    line('2026-08-05T12:09:20.000Z', 'agent_reasoning', { text: 'Continuing safely' }),
  ].join('\n');
  assertEquals(deriveCodexLiveSnapshot(rollout, path, now).state, 'working');
});

Deno.test('a refusal message before productive work is refused only when the turn completes', () => {
  const rollout = [
    line('2026-08-05T12:09:00.000Z', 'task_started'),
    line('2026-08-05T12:09:01.000Z', 'agent_message', {
      message: 'I am unable to proceed with this request.',
    }),
    line('2026-08-05T12:09:02.000Z', 'task_complete'),
  ].join('\n');
  assertEquals(deriveCodexLiveSnapshot(rollout, path, now).state, 'refused');
});

Deno.test('readable live events include actions and file writes but omit bookkeeping', () => {
  const rollout = [
    line('2026-08-05T12:09:00.000Z', 'token_count'),
    line('2026-08-05T12:09:01.000Z', 'agent_reasoning', { text: 'Inspecting status' }),
    JSON.stringify({
      timestamp: '2026-08-05T12:09:02.000Z',
      type: 'response_item',
      payload: { type: 'function_call', name: 'exec_command', arguments: '{"cmd":"git status"}' },
    }),
    line('2026-08-05T12:09:03.000Z', 'patch_apply_end', {
      changes: { '/repo/live.ts': { type: 'add' } },
    }),
  ].join('\n');
  const events = codexLiveEvents(rollout);
  assertEquals(events.map((event) => event.kind), ['reasoning', 'command-start', 'file-write']);
  assertMatch(events[1].summary, /exec_command/);
  assertEquals(events[2].files, ['/repo/live.ts']);
});

Deno.test('session identity uses rollout metadata and filename fallback', () => {
  const rollout = [
    JSON.stringify({ type: 'session_meta', payload: { id, cwd: '/repo/one' } }),
    JSON.stringify({
      type: 'turn_context',
      payload: { model: 'gpt-5.6', effort: 'high', cwd: '/repo/two' },
    }),
  ].join('\n');
  assertEquals(parseCodexSessionIdentity(rollout, path), {
    threadId: id,
    model: 'gpt-5.6',
    effort: 'high',
    cwd: '/repo/two',
  });
});

Deno.test('rollout resolver selects the newest exact thread match', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/old`, { recursive: true });
    await Deno.mkdir(`${root}/new`, { recursive: true });
    const old = `${root}/old/rollout-2026-08-01-${id}.jsonl`;
    const newest = `${root}/new/rollout-2026-08-02-${id}.jsonl`;
    await Deno.writeTextFile(old, 'old');
    await Deno.writeTextFile(newest, 'new');
    await Deno.utime(old, new Date(0), new Date(0));
    await Deno.utime(newest, new Date(1_000), new Date(1_000));
    assertEquals(await resolveCodexRollout(root, id), newest);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
