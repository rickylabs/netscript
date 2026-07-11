import {
  APP_SERVER_REQUEST_IDS,
  parseThreadStart,
  threadStartRequest,
  turnStartRequest,
} from './app-server-message.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test('turnStartRequest applies requested effort to the child turn', () => {
  const request = turnStartRequest('thread-1', 'work', 'medium');
  assert(request.params?.effort === 'medium', 'per-turn effort should be explicit');
});

Deno.test('thread start route is parsed from the authoritative response', () => {
  const request = threadStartRequest({ model: 'gpt-test', effort: 'medium', cwd: '/work' });
  assert(request.params?.model === 'gpt-test', 'thread model should be explicit');
  const identity = parseThreadStart({
    id: APP_SERVER_REQUEST_IDS.threadStart,
    result: {
      thread: { id: 'thread-1', path: '/sessions/rollout-thread-1.jsonl' },
      model: 'gpt-test',
      modelProvider: 'openai',
      reasoningEffort: 'medium',
      cwd: '/work',
    },
  });
  assert(identity?.effort === 'medium', 'applied effort should come from thread/start');
});
