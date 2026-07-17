import type { McpServer } from '../application/runner/mcp-server.ts';

/** Run newline-delimited UTF-8 JSON-RPC over the supplied streams. */
export async function runNewlineStdio(
  server: McpServer,
  input: ReadableStream<Uint8Array>,
  output: WritableStream<Uint8Array>,
): Promise<void> {
  const reader = input.getReader();
  const writer = output.getWriter();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = done ? '' : lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let response;
        try {
          response = await server.handle(JSON.parse(line));
        } catch (error) {
          response = {
            jsonrpc: '2.0' as const,
            id: null,
            error: {
              code: -32700,
              message: error instanceof Error ? error.message : 'Parse error',
            },
          };
        }
        if (response) await writer.write(new TextEncoder().encode(`${JSON.stringify(response)}\n`));
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}
