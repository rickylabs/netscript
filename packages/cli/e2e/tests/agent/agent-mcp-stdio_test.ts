import { assert, assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

interface RpcResponse {
  readonly id: number;
  readonly result?: {
    readonly tools?: readonly { readonly name: string }[];
    readonly structuredContent?: Record<string, unknown>;
    readonly isError?: boolean;
    readonly serverInfo?: { readonly name: string };
  };
  readonly error?: unknown;
}

const cliEntrypoint = fromFileUrl(
  new URL('../../../bin/netscript.ts', import.meta.url),
);

Deno.test('agent mcp real CLI stdio smoke', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'netscript-agent-mcp-' });
  const docsRoot = join(projectRoot, 'docs', 'site');
  await Deno.mkdir(docsRoot, { recursive: true });
  await Deno.writeTextFile(
    join(docsRoot, 'workers.md'),
    `---\ntitle: Worker retries\ndescription: Configure bounded worker retry policies.\n---\n\n# Worker retries\n\nSet an explicit retry policy for each worker.\n`,
  );

  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      cliEntrypoint,
      'agent',
      'mcp',
      '--project-root',
      projectRoot,
      '--docs-root',
      docsRoot,
      '--endpoint',
      'http://127.0.0.1:1',
    ],
    cwd: projectRoot,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let completed = false;

  try {
    const requests = [
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'cli-e2e', version: '1' },
        },
      },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'doctor', arguments: {} } },
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'search_docs', arguments: { query: 'retry policy' } },
      },
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_app_status', arguments: {} },
      },
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'execute_command', arguments: { command: 'deploy' } },
      },
    ];
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(
        `${requests.map((request) => JSON.stringify(request)).join('\n')}\n`,
      ),
    );
    await writer.close();

    const output = await child.output();
    completed = true;
    assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
    const responses = new TextDecoder().decode(output.stdout).trim().split('\n').map((line) =>
      JSON.parse(line) as RpcResponse
    );
    assertEquals(responses.length, requests.length);
    for (const response of responses) assertEquals(response.error, undefined);

    assertEquals(responses[0].result?.serverInfo?.name, '@netscript/mcp');
    assertEquals(responses[1].result?.tools?.length, 13);

    const doctor = responses[2].result?.structuredContent;
    assert(doctor);
    assert(['warn', 'fail'].includes(String(doctor.status)));
    assert(Array.isArray(doctor.checks));

    const docs = responses[3].result?.structuredContent;
    assert(docs);
    assertEquals(docs.count, 1);
    assertEquals((docs.matches as readonly Record<string, unknown>[])[0]?.slug, 'workers');

    const status = responses[4].result?.structuredContent;
    assert(status);
    assert(['warn', 'fail'].includes(String(status.status)));
    assert(Array.isArray(status.domains));

    const denied = responses[5].result?.structuredContent;
    assert(denied);
    assertEquals(responses[5].result?.isError, true);
    assertEquals(denied.code, 'command_denied');
    assertEquals(denied.status, 'deny_deploy');
  } finally {
    if (!completed) child.kill('SIGKILL');
    await Deno.remove(projectRoot, { recursive: true });
  }
});
