import { assertEquals, assertMatch, assertThrows } from '@std/assert';
import { parseSince, renderFollowEvent } from './codex-follow.ts';

Deno.test('codex follow parses finite since durations', () => {
  assertEquals(parseSince('5m'), 300_000);
  assertEquals(parseSince('30s'), 30_000);
  assertEquals(parseSince('1h'), 3_600_000);
  assertThrows(() => parseSince('five minutes'), Error, '--since must be a duration');
});

Deno.test('codex follow pretty and JSON formats retain event classification', () => {
  const event = {
    timestamp: '2026-08-05T12:09:03.000Z',
    kind: 'file-write' as const,
    summary: 'wrote live.ts',
    files: ['/repo/live.ts'],
  };
  assertMatch(renderFollowEvent(event, 'pretty'), /^12:09:03 WRITE wrote live\.ts$/);
  assertEquals(JSON.parse(renderFollowEvent(event, 'json')).kind, 'file-write');
});

Deno.test('codex follow streams an appended terminal event and exits without polling sleeps', async () => {
  const root = await Deno.makeTempDir();
  const rollout = `${root}/rollout-test.jsonl`;
  const started = JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'event_msg',
    payload: { type: 'task_started' },
  });
  await Deno.writeTextFile(rollout, `${started}\n`);
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-lock',
      '--allow-read',
      '--allow-env',
      new URL('./codex-follow.ts', import.meta.url).pathname,
      '--rollout',
      rollout,
      '--since',
      '1h',
      '--format',
      'json',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let output = '';
  while (!output.includes('\n')) {
    const chunk = await reader.read();
    if (chunk.done) break;
    output += decoder.decode(chunk.value, { stream: true });
  }
  const complete = JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'event_msg',
    payload: { type: 'task_complete' },
  });
  await Deno.writeTextFile(rollout, `${complete}\n`, { append: true });
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    output += decoder.decode(chunk.value, { stream: true });
  }
  const status = await child.status;
  const stderr = await new Response(child.stderr).text();
  reader.releaseLock();
  await Deno.remove(root, { recursive: true });

  assertEquals(status.code, 0, stderr);
  assertEquals(output.trim().split('\n').map((line) => JSON.parse(line).kind), [
    'started',
    'complete',
  ]);
});
