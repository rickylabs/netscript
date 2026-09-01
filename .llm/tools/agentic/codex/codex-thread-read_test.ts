import { assert, assertEquals } from '@std/assert';

interface ThreadReadRequest {
  readonly id: string;
  readonly method: 'thread/read';
  readonly params: Readonly<{ threadId: string; includeTurns: false }>;
}

interface CodexThreadReadModule {
  readonly CODEX_THREAD_READ_REQUEST_ID: string;
  threadReadRequest(threadId: string): ThreadReadRequest;
  normalizeCodexThreadRuntimeState(
    state: 'active' | 'idle' | 'notLoaded' | 'systemError',
  ): 'active' | 'idle' | 'not_loaded' | 'unknown';
  parseCodexThreadRead(
    message: Readonly<Record<string, unknown>>,
    sessionId: string,
  ):
    | Readonly<{
      state: 'active' | 'idle' | 'not_loaded' | 'absent' | 'unknown';
      sessionId: string;
    }>
    | null;
}

const sessionId = '019f4b72-2ea4-7050-917e-6d6918371265';

async function loadThreadReadModule(): Promise<CodexThreadReadModule> {
  const moduleUrl = new URL('./codex-thread-read.ts', import.meta.url);
  return await import(moduleUrl.href) as CodexThreadReadModule;
}

function assertNoProductionSenderPath(path: string): void {
  const configuredHome = Deno.env.get('HOME');
  assert(configuredHome, 'HOME must be present so the production sender root can be forbidden');
  const production = `${configuredHome}/.config/netscript-agentic/runtime/senders`;
  assert(!path.startsWith(production), `thread-read test path must not use sender root: ${path}`);
}

Deno.test('thread/read request is read-only and normalization preserves systemError as unknown', async () => {
  const sessionRoot = '/tmp/netscript-thread-read/sessions';
  assertNoProductionSenderPath(sessionRoot);
  const module = await loadThreadReadModule();

  assertEquals(module.threadReadRequest(sessionId), {
    id: module.CODEX_THREAD_READ_REQUEST_ID,
    method: 'thread/read',
    params: { threadId: sessionId, includeTurns: false },
  });
  assertEquals(module.normalizeCodexThreadRuntimeState('active'), 'active');
  assertEquals(module.normalizeCodexThreadRuntimeState('idle'), 'idle');
  assertEquals(module.normalizeCodexThreadRuntimeState('notLoaded'), 'not_loaded');
  assertEquals(module.normalizeCodexThreadRuntimeState('systemError'), 'unknown');
});

Deno.test('thread/read parser distinguishes a bound not-loaded thread from JSON-RPC absence', async () => {
  const sessionRoot = '/tmp/netscript-thread-read/parser-sessions';
  assertNoProductionSenderPath(sessionRoot);
  const module = await loadThreadReadModule();

  assertEquals(
    module.parseCodexThreadRead({
      id: module.CODEX_THREAD_READ_REQUEST_ID,
      result: { thread: { id: sessionId, status: { type: 'notLoaded' } } },
    }, sessionId),
    { state: 'not_loaded', sessionId },
  );
  assertEquals(
    module.parseCodexThreadRead({
      id: module.CODEX_THREAD_READ_REQUEST_ID,
      error: { code: -32602, message: `thread ${sessionId} not found` },
    }, sessionId),
    { state: 'absent', sessionId },
  );
  assertEquals(
    module.parseCodexThreadRead({
      id: module.CODEX_THREAD_READ_REQUEST_ID,
      result: { thread: { id: 'foreign-thread', status: { type: 'idle' } } },
    }, sessionId),
    null,
  );
});
