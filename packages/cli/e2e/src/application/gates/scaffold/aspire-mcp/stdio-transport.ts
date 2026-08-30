import type { AspireMcpEntryPoint, AspireMcpExit, AspireMcpTransport } from './contract.ts';

/** Spawn the generated Aspire MCP entry point as an NDJSON JSON-RPC transport. */
export function createStdioAspireMcpTransport(
  entryPoint: AspireMcpEntryPoint,
): AspireMcpTransport {
  return new StdioAspireMcpTransport(entryPoint);
}

class StdioAspireMcpTransport implements AspireMcpTransport {
  readonly #child: Deno.ChildProcess;
  readonly #writer: WritableStreamDefaultWriter<Uint8Array>;
  readonly #reader: ReadableStreamDefaultReader<string>;
  readonly #transcript: unknown[] = [];
  readonly #status: Promise<Deno.CommandStatus>;
  #buffer = '';
  #requestId = 0;
  #closed = false;

  constructor(entryPoint: AspireMcpEntryPoint) {
    this.#child = new Deno.Command(entryPoint.command, {
      args: [...entryPoint.args],
      cwd: entryPoint.cwd,
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    this.#writer = this.#child.stdin.getWriter();
    this.#reader = this.#child.stdout.pipeThrough(new TextDecoderStream()).getReader();
    this.#status = this.#child.status;
    void new Response(this.#child.stderr).text();
  }

  async initialize(): Promise<{ readonly name: string; readonly version: string }> {
    const result = object(
      await this.#request('initialize', {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'netscript-cli-e2e', version: '1' },
      }),
      'initialize result',
    );
    const serverInfo = object(Reflect.get(result, 'serverInfo'), 'serverInfo');
    const name = stringField(serverInfo, 'name');
    const version = stringField(serverInfo, 'version');
    await this.#send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    return { name, version };
  }

  async listTools(): Promise<readonly string[]> {
    const result = object(await this.#request('tools/list', {}), 'tools/list result');
    const tools = Reflect.get(result, 'tools');
    if (!Array.isArray(tools)) throw new Error('tools/list omitted tools[]');
    return tools.map((tool) => stringField(object(tool, 'tool'), 'name'));
  }

  async callTool(
    name: string,
    args: Readonly<Record<string, unknown>> = {},
  ): Promise<unknown> {
    const result = object(
      await this.#request('tools/call', { name, arguments: args }),
      `${name} result`,
    );
    const isError = Reflect.get(result, 'isError') === true;
    const text = contentText(result);
    if (name === 'list_apphosts') return parseAppHosts(text);
    if (name === 'doctor') return parseJsonValue(text, '{');
    if (name === 'list_resources') return parseJsonAfter(text, '# RESOURCE DATA', '[');
    if (name === 'list_console_logs') {
      return {
        lines: isError ? [] : text.split(/\r?\n/).filter((line) => line.trim().length > 0),
        isError,
        notFound: /not found|could not find|unknown resource/i.test(text),
      };
    }
    if (name === 'list_structured_logs') return { items: [], isError };
    return { text, isError };
  }

  async close(): Promise<AspireMcpExit> {
    if (this.#closed) return await statusExit(this.#status, true);
    this.#closed = true;
    await this.#writer.close().catch(() => undefined);
    const graceful = await settle(this.#status, 10_000);
    if (graceful) return statusExitValue(graceful, true);
    signal(this.#child, 'SIGTERM');
    const terminated = await settle(this.#status, 5_000);
    if (terminated) return statusExitValue(terminated, false);
    signal(this.#child, 'SIGKILL');
    return statusExitValue(await this.#status, false);
  }

  transcript(): readonly unknown[] {
    return [...this.#transcript];
  }

  async #request(method: string, params: Readonly<Record<string, unknown>>): Promise<unknown> {
    this.#requestId += 1;
    const id = this.#requestId;
    await this.#send({ jsonrpc: '2.0', id, method, params });
    while (true) {
      const message = await this.#nextMessage();
      if (Reflect.get(message, 'id') !== id) continue;
      const error = Reflect.get(message, 'error');
      if (error !== undefined) throw new Error(`${method} failed: ${JSON.stringify(error)}`);
      return Reflect.get(message, 'result');
    }
  }

  async #send(message: Readonly<Record<string, unknown>>): Promise<void> {
    this.#transcript.push({ direction: 'request', message });
    await this.#writer.write(new TextEncoder().encode(`${JSON.stringify(message)}\n`));
  }

  async #nextMessage(): Promise<Record<string, unknown>> {
    while (true) {
      const newline = this.#buffer.indexOf('\n');
      if (newline >= 0) {
        const line = this.#buffer.slice(0, newline).trim();
        this.#buffer = this.#buffer.slice(newline + 1);
        if (!line) continue;
        const message = object(JSON.parse(line), 'JSON-RPC message');
        this.#transcript.push({ direction: 'response', message });
        return message;
      }
      const result = await this.#reader.read();
      if (result.done) throw new Error('Aspire MCP stdout closed before a response arrived');
      this.#buffer += result.value;
    }
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

function stringField(source: Record<string, unknown>, key: string): string {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string') throw new Error(`Expected string ${key}`);
  return value;
}

function contentText(result: Record<string, unknown>): string {
  const content = Reflect.get(result, 'content');
  if (!Array.isArray(content)) throw new Error('MCP tool result omitted content[]');
  return content.map((entry) => {
    const item = object(entry, 'content entry');
    return Reflect.get(item, 'type') === 'text' && typeof Reflect.get(item, 'text') === 'string'
      ? String(Reflect.get(item, 'text'))
      : '';
  }).filter(Boolean).join('\n');
}

function parseAppHosts(text: string): { inScope: unknown; outOfScope: unknown } {
  const inScope = parseJsonAfter(text, 'App hosts within scope', '[');
  const outOfScope = parseJsonAfter(text, 'App hosts outside scope', '[');
  return { inScope, outOfScope };
}

function parseJsonAfter(text: string, marker: string, opening: '{' | '['): unknown {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) throw new Error(`MCP result omitted marker: ${marker}`);
  return parseJsonValue(text.slice(markerIndex + marker.length), opening);
}

function parseJsonValue(text: string, opening: '{' | '['): unknown {
  const start = text.indexOf(opening);
  if (start < 0) throw new Error('MCP result omitted JSON evidence');
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === opening) depth += 1;
    else if (character === closing) {
      depth -= 1;
      if (depth === 0) return JSON.parse(text.slice(start, index + 1));
    }
  }
  throw new Error('MCP JSON evidence is incomplete');
}

async function settle(
  status: Promise<Deno.CommandStatus>,
  timeoutMs: number,
): Promise<Deno.CommandStatus | undefined> {
  return await Promise.race([
    status,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeoutMs)),
  ]);
}

function signal(child: Deno.ChildProcess, value: Deno.Signal): void {
  try {
    child.kill(value);
  } catch {
    // The process exited between the timeout and signal.
  }
}

async function statusExit(
  status: Promise<Deno.CommandStatus>,
  graceful: boolean,
): Promise<AspireMcpExit> {
  return statusExitValue(await status, graceful);
}

function statusExitValue(status: Deno.CommandStatus, graceful: boolean): AspireMcpExit {
  return { code: status.code, signal: status.signal, graceful };
}
