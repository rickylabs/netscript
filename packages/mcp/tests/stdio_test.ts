import { assert, assertEquals } from '@std/assert';
import { MCP_PACKAGE_VERSION } from '../src/publish-assets.generated.ts';

Deno.test('stdio initialize, list, and unreachable doctor round trip', async () => {
  const projectRoot = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${projectRoot}/deno.json`, '{"workspace":[]}\n');
    const cliPath = new URL('../cli.ts', import.meta.url).pathname;
    const command = new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-env', '--allow-net', '--allow-read', '--allow-write', cliPath],
      cwd: projectRoot,
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
    assertEquals(responses[0].result.serverInfo.version, MCP_PACKAGE_VERSION);
    assertEquals(responses[1].result.tools.length, 21);
    assert(typeof responses[0].result.instructions === 'string');
    for (
      const name of [
        'doctor',
        'find_export',
        'get_app_status',
        'get_recent_errors',
        'record_drift',
      ]
    ) {
      assert(responses[0].result.instructions.includes(name));
    }
    assertEquals(responses[2].result.structuredContent.status, 'warn');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
