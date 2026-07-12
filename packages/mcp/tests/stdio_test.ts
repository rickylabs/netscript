import { assertEquals } from '@std/assert';

Deno.test('stdio initialize, list, and unreachable doctor round trip', async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-env', '--allow-net', 'cli.ts'],
    cwd: new URL('..', import.meta.url),
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
    env: { NETSCRIPT_TELEMETRY_ENDPOINT: 'http://127.0.0.1:1' },
  });
  const child = command.spawn();
  const writer = child.stdin.getWriter();
  const requests = [
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'test', version: '1' },
      },
    },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'doctor', arguments: {} } },
  ];
  await writer.write(
    new TextEncoder().encode(`${requests.map((value) => JSON.stringify(value)).join('\n')}\n`),
  );
  await writer.close();
  const output = await child.output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  const responses = new TextDecoder().decode(output.stdout).trim().split('\n').map((line) =>
    JSON.parse(line)
  );
  assertEquals(responses[0].result.serverInfo.name, '@netscript/mcp');
  assertEquals(responses[1].result.tools.length, 13);
  assertEquals(responses[2].result.structuredContent.status, 'warn');
});
