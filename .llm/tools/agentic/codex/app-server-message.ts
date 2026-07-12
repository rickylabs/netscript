/** Minimal v2 JSONL client used when launching one Codex app-server turn. */

export interface AppServerRoute {
  readonly model: string;
  readonly effort: string;
  readonly cwd: string;
}

export interface AppServerThreadIdentity {
  readonly threadId: string;
  readonly rollout: string | null;
  readonly model: string;
  readonly provider: string;
  readonly effort: string;
  readonly cwd: string;
}

interface JsonRpcMessage {
  readonly id?: string | number;
  readonly method?: string;
  readonly params?: Record<string, unknown>;
  readonly result?: Record<string, unknown>;
}

export const APP_SERVER_REQUEST_IDS = {
  initialize: 'netscript-initialize',
  threadStart: 'netscript-thread-start',
  turnStart: 'netscript-turn-start',
} as const;

/** Builds the v2 thread request whose response is the authoritative launch identity. */
export function threadStartRequest(route: AppServerRoute): JsonRpcMessage {
  return {
    id: APP_SERVER_REQUEST_IDS.threadStart,
    method: 'thread/start',
    params: {
      model: route.model,
      cwd: route.cwd,
      // Resolve effort before thread/start returns its authoritative identity.
      // A turn-only override made launch evidence report the stale default.
      config: { model_reasoning_effort: route.effort },
    },
  };
}

/** Builds a turn request with an explicit per-message effort. */
export function turnStartRequest(
  threadId: string,
  message: string,
  effort: string,
): JsonRpcMessage {
  return {
    id: APP_SERVER_REQUEST_IDS.turnStart,
    method: 'turn/start',
    params: {
      threadId,
      input: [{ type: 'text', text: message, textElements: [] }],
      effort,
    },
  };
}

/** Extracts the applied route from a successful v2 thread/start response. */
export function parseThreadStart(message: JsonRpcMessage): AppServerThreadIdentity | null {
  if (message.id !== APP_SERVER_REQUEST_IDS.threadStart) return null;
  const result = message.result;
  const thread = result?.thread as Record<string, unknown> | undefined;
  if (
    !thread || typeof thread.id !== 'string' || typeof result?.model !== 'string' ||
    typeof result.modelProvider !== 'string' || typeof result.reasoningEffort !== 'string' ||
    typeof result.cwd !== 'string'
  ) return null;
  return {
    threadId: thread.id,
    rollout: typeof thread.path === 'string' ? thread.path : null,
    model: result.model,
    provider: result.modelProvider,
    effort: result.reasoningEffort,
    cwd: result.cwd,
  };
}

function initializeRequest(): JsonRpcMessage {
  return {
    id: APP_SERVER_REQUEST_IDS.initialize,
    method: 'initialize',
    params: {
      clientInfo: {
        name: 'netscript-agentic-launcher',
        title: 'NetScript Agentic Launcher',
        version: '1',
      },
      capabilities: { experimentalApi: true },
    },
  };
}

/** Builds app-server argv without the unsupported top-level `--profile` flag. */
export function appServerArguments(route: AppServerRoute): string[] {
  return [
    '-c',
    `model_reasoning_effort=${JSON.stringify(route.effort)}`,
    'app-server',
  ];
}

async function writeMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  message: JsonRpcMessage,
): Promise<void> {
  await writer.write(new TextEncoder().encode(`${JSON.stringify(message)}\n`));
}

/** Runs one message through the official Codex v2 app-server protocol. */
export async function sendAppServerMessage(
  route: AppServerRoute,
  message: string,
): Promise<number> {
  const child = new Deno.Command('codex', {
    args: appServerArguments(route),
    cwd: route.cwd,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'inherit',
  }).spawn();
  const writer = child.stdin.getWriter();
  await writeMessage(writer, initializeRequest());

  const decoder = new TextDecoder();
  const reader = child.stdout.getReader();
  let buffer = '';
  let identity: AppServerThreadIdentity | null = null;
  let turnStarted = false;
  let completed = false;

  while (!completed) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      await Deno.stdout.write(new TextEncoder().encode(`${line}\n`));
      let event: JsonRpcMessage;
      try {
        event = JSON.parse(line) as JsonRpcMessage;
      } catch {
        continue;
      }
      if (event.id === APP_SERVER_REQUEST_IDS.initialize) {
        await writeMessage(writer, { method: 'initialized' });
        await writeMessage(writer, threadStartRequest(route));
        continue;
      }
      const startedThread = parseThreadStart(event);
      if (startedThread && !turnStarted) {
        identity = startedThread;
        console.log(
          `thread/start response: model_provider: "${identity.provider}" model: "${identity.model}" ` +
            `reasoning_effort: Some(${identity.effort}) CWD=${identity.cwd} ` +
            `${identity.rollout ?? ''}`,
        );
        await writeMessage(writer, turnStartRequest(identity.threadId, message, route.effort));
        turnStarted = true;
        continue;
      }
      if (event.method === 'turn/completed') completed = true;
    }
  }

  await writer.close().catch(() => undefined);
  if (!completed) child.kill('SIGTERM');
  const status = await child.status;
  console.log(`[codex app-server exited: exit status: ${status.code}]`);
  return identity && completed && status.success ? 0 : 1;
}
