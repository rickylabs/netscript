import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { copy } from '@std/fs';
import { fromFileUrl, join } from '@std/path';
import { createPublicCommandTree } from '../../../src/public/features/root/public-command-tree.ts';

interface RpcResponse {
  readonly id: number;
  readonly result?: {
    readonly tools?: readonly { readonly name: string }[];
    readonly structuredContent?: Record<string, unknown>;
    readonly isError?: boolean;
    readonly serverInfo?: { readonly name: string };
    readonly instructions?: string;
  };
  readonly error?: unknown;
}

const cliEntrypoint = fromFileUrl(
  new URL('../../../bin/netscript.ts', import.meta.url),
);
const repositoryRoot = fromFileUrl(new URL('../../../../../', import.meta.url));

async function useLocalConfigWorkspace(projectRoot: string): Promise<void> {
  const localPackageRoot = join(projectRoot, 'packages', 'config');
  await copy(join(repositoryRoot, 'packages', 'config'), localPackageRoot);
  const configPath = join(projectRoot, 'deno.json');
  const config = JSON.parse(await Deno.readTextFile(configPath)) as {
    workspace: string[];
    imports: Record<string, string>;
  };
  config.workspace.push('./packages/config');
  config.imports = { '@netscript/config': 'workspace:*' };
  await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

Deno.test('agent mcp real CLI stdio smoke', async () => {
  const parent = await Deno.makeTempDir({ prefix: 'netscript-agent-mcp-' });
  const projectName = 'stdio-scaffold';
  const projectRoot = join(parent, projectName);
  const scaffold = createPublicCommandTree({
    cwd: () => parent,
    resolvePath: (path) => path === undefined ? parent : join(parent, path),
  });
  await scaffold.parse([
    'init',
    projectName,
    '--path',
    parent,
    '--app-name',
    'dashboard',
    '--db',
    'none',
    '--ci',
    '--yes',
    '--no-aspire',
    '--no-git',
  ]);
  await useLocalConfigWorkspace(projectRoot);
  const playwrightSkillRoot = join(projectRoot, '.claude', 'skills', 'playwright-cli');
  const playwrightSkill = join(playwrightSkillRoot, 'SKILL.md');
  await Deno.mkdir(playwrightSkillRoot, { recursive: true });
  await Deno.writeTextFile(playwrightSkill, '# Playwright CLI\n');
  const init = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-A',
      cliEntrypoint,
      'agent',
      'init',
      '--host',
      'claude',
      '--editor',
      'none',
      '--with-docs',
    ],
    cwd: projectRoot,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(init.code, 0, new TextDecoder().decode(init.stderr));
  const docsRoot = join(projectRoot, '.netscript', 'docs');
  const agents = await Deno.readTextFile(join(projectRoot, 'AGENTS.md'));
  assertStringIncludes(agents, 'call MCP `find_guidance` with the task');
  for (const skill of ['netscript', 'netscript-build']) {
    assertStringIncludes(
      await Deno.readTextFile(join(projectRoot, '.claude', 'skills', skill, 'SKILL.md')),
      'find_guidance',
    );
  }

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
        params: {
          name: 'find_guidance',
          arguments: { intent: 'build a real service-backed UI' },
        },
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
      {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'search_exports', arguments: { query: 'definePage' } },
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
    assertStringIncludes(
      responses[0].result?.instructions ?? '',
      'Before implementing an unfamiliar NetScript API or architecture',
    );
    const tools = responses[1].result?.tools ?? [];
    assertEquals(tools.length, 22);
    assert(tools.some((tool) => tool.name === 'find_guidance'));
    assert(tools.some((tool) => tool.name === 'record_drift'));

    const doctor = responses[2].result?.structuredContent;
    assert(doctor);
    assert(['warn', 'fail'].includes(String(doctor.status)));
    assert(Array.isArray(doctor.checks));

    const guidance = responses[3].result?.structuredContent;
    assert(guidance);
    const recommendations = guidance.recommendations as readonly Record<string, unknown>[];
    assertEquals(recommendations[0]?.slug, 'llms');
    assertEquals(recommendations[0]?.section, 'task-router');

    const status = responses[4].result?.structuredContent;
    assert(status);
    assert(['warn', 'fail'].includes(String(status.status)));
    assert(Array.isArray(status.domains));

    const denied = responses[5].result?.structuredContent;
    assert(denied);
    assertEquals(responses[5].result?.isError, true);
    assertEquals(denied.code, 'command_denied');
    assertEquals(denied.status, 'deny_deploy');

    const exports = responses[6].result?.structuredContent;
    assert(exports);
    assertEquals(responses[6].result?.isError, false);
    assert(Number(exports.total) > 0);
    assert(
      (exports.matches as readonly Record<string, unknown>[]).some((match) =>
        match.symbol === 'definePage'
      ),
    );
  } finally {
    if (!completed) child.kill('SIGKILL');
    await Deno.remove(parent, { recursive: true });
  }
});
