import type { ThreadWriterState } from '../runtime/sender-ownership.ts';

export const CODEX_THREAD_READ_REQUEST_ID = 'netscript-thread-read' as const;
const CODEX_THREAD_READ_INITIALIZE_ID = 'netscript-thread-read-initialize' as const;

interface JsonRpcMessage {
  readonly id?: string | number;
  readonly method?: string;
  readonly params?: Record<string, unknown>;
  readonly result?: Record<string, unknown>;
  readonly error?: Record<string, unknown>;
}

export interface CodexThreadReadResult {
  readonly state: ThreadWriterState;
  readonly sessionId: string;
}

export interface CodexThreadReadOptions {
  readonly executable?: string;
  readonly codexHome?: string;
  readonly timeoutMs?: number;
}

/** Builds the read-only app-server request for one exact Codex thread. */
export function threadReadRequest(threadId: string): Readonly<{
  id: typeof CODEX_THREAD_READ_REQUEST_ID;
  method: 'thread/read';
  params: Readonly<{ threadId: string; includeTurns: false }>;
}> {
  return {
    id: CODEX_THREAD_READ_REQUEST_ID,
    method: 'thread/read',
    params: { threadId, includeTurns: false },
  };
}

/** Normalizes Codex's runtime states without treating system errors as absence. */
export function normalizeCodexThreadRuntimeState(
  state: 'active' | 'idle' | 'notLoaded' | 'systemError',
): Exclude<ThreadWriterState, 'absent'> {
  if (state === 'notLoaded') return 'not_loaded';
  if (state === 'systemError') return 'unknown';
  return state;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** Parses only the matching thread/read response and keeps malformed evidence unknown. */
export function parseCodexThreadRead(
  message: Readonly<Record<string, unknown>>,
  sessionId: string,
): CodexThreadReadResult | null {
  if (message.id !== CODEX_THREAD_READ_REQUEST_ID) return null;
  const error = record(message.error);
  if (error) {
    const text = typeof error.message === 'string' ? error.message : '';
    return /not found/i.test(text) && text.includes(sessionId)
      ? { state: 'absent', sessionId }
      : { state: 'unknown', sessionId };
  }
  const thread = record(record(message.result)?.thread);
  if (!thread || thread.id !== sessionId) return null;
  const status = record(thread.status);
  const state = status?.type;
  if (state !== 'active' && state !== 'idle' && state !== 'notLoaded' && state !== 'systemError') {
    return { state: 'unknown', sessionId };
  }
  return { state: normalizeCodexThreadRuntimeState(state), sessionId };
}

function initializeRequest(): JsonRpcMessage {
  return {
    id: CODEX_THREAD_READ_INITIALIZE_ID,
    method: 'initialize',
    params: {
      clientInfo: {
        name: 'netscript-agentic-thread-reader',
        title: 'NetScript Agentic Thread Reader',
        version: '1',
      },
      capabilities: { experimentalApi: true },
    },
  };
}

async function write(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  message: JsonRpcMessage,
): Promise<void> {
  await writer.write(new TextEncoder().encode(`${JSON.stringify(message)}\n`));
}

async function readWithDeadline(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  remainingMs: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('thread/read timed out')), remainingMs);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function stopAndReap(child: Deno.ChildProcess): Promise<void> {
  const status = child.status;
  try {
    child.kill('SIGTERM');
  } catch {
    // The child may have exited after its response and before cleanup.
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const terminated = await Promise.race([
    status.then(() => true),
    new Promise<false>((resolve) => {
      timeout = setTimeout(() => resolve(false), 1_000);
    }),
  ]);
  clearTimeout(timeout);
  if (!terminated) {
    try {
      child.kill('SIGKILL');
    } catch {
      // A concurrent normal exit is already a successful reap condition.
    }
    await status;
  }
}

/** Reads one thread state through a bounded app-server child and always reaps it. */
export async function readCodexThreadState(
  sessionId: string,
  options: CodexThreadReadOptions = {},
): Promise<CodexThreadReadResult> {
  const child = new Deno.Command(options.executable ?? 'codex', {
    args: ['app-server'],
    env: options.codexHome ? { CODEX_HOME: options.codexHome } : undefined,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'null',
  }).spawn();
  const writer = child.stdin.getWriter();
  const reader = child.stdout.getReader();
  const deadline = Date.now() + (options.timeoutMs ?? 5_000);
  let buffer = '';
  let initialized = false;
  try {
    await write(writer, initializeRequest());
    while (Date.now() < deadline) {
      const chunk = await readWithDeadline(reader, Math.max(1, deadline - Date.now()));
      if (chunk.done) break;
      buffer += new TextDecoder().decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let message: Record<string, unknown>;
        try {
          message = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (message.id === CODEX_THREAD_READ_INITIALIZE_ID && !initialized) {
          initialized = true;
          await write(writer, { method: 'initialized' });
          await write(writer, threadReadRequest(sessionId));
          continue;
        }
        const parsed = parseCodexThreadRead(message, sessionId);
        if (parsed) return parsed;
      }
    }
    return { state: 'unknown', sessionId };
  } catch {
    return { state: 'unknown', sessionId };
  } finally {
    await writer.close().catch(() => undefined);
    await reader.cancel().catch(() => undefined);
    await stopAndReap(child);
  }
}
