import { assert, assertEquals, assertRejects } from '@std/assert';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  type HybridClaudeProcess,
  type HybridLauncherDependencies,
  hybridMcpConfig,
  launchHybridClaude,
  nativeClaudeEnvironment,
  parseHybridBridgeEvidence,
  parseHybridLaunchOptions,
} from './hybrid-launcher.ts';

Deno.test('hybrid launcher parses only absolute cwd and bounded name', () => {
  assertEquals(parseHybridLaunchOptions(['--cwd', '/repo', '--name', 'loopback']), {
    cwd: '/repo',
    name: 'loopback',
  });
  assertRejects(async () => parseHybridLaunchOptions(['--cwd', 'relative']), Error, 'absolute');
  assertRejects(async () => parseHybridLaunchOptions(['--model', 'other']), Error, 'unknown');
});

Deno.test('native Claude environment strips every provider credential override', () => {
  assertEquals(
    nativeClaudeEnvironment({
      HOME: '/home/test',
      PATH: '/bin',
      ANTHROPIC_BASE_URL: 'https://proxy.invalid',
      ANTHROPIC_API_KEY: 'anthropic-secret',
      ANTHROPIC_AUTH_TOKEN: 'auth-secret',
      CLAUDE_CODE_OAUTH_TOKEN: 'native-oauth',
      OPENROUTER_API_KEY: 'router-secret',
    }),
    { HOME: '/home/test', PATH: '/bin', CLAUDE_CODE_OAUTH_TOKEN: 'native-oauth' },
  );
});

Deno.test('MCP config is stdio-only, credential-free, and minimally permissioned', () => {
  const source = hybridMcpConfig(
    '/repo/.llm/tools/agentic/claude/hybrid-launcher.ts',
    '/repo',
    '/trusted/deno',
    `/home/test/${OPENCODE_TOOL.openRouterEnvRelativePath}`,
  );
  assert(!source.includes('secret'));
  assert(!source.includes('ANTHROPIC'));
  const config = JSON.parse(source);
  const server = config.mcpServers['netscript-hybrid'];
  assertEquals(Object.keys(config.mcpServers), ['netscript-hybrid']);
  assertEquals(server.command, '/trusted/deno');
  assert(server.args.includes('--allow-run=setsid'));
  assert(
    server.args.includes(`--allow-read=/home/test/${OPENCODE_TOOL.openRouterEnvRelativePath}`),
  );
  assert(!server.args.includes('-A'));
  assert(!server.args.includes('--allow-net'));
  assert(!server.args.includes('--allow-read'));
  assert(!server.args.includes('--allow-sys'));
});

Deno.test('bridge evidence requires matching pid, cwd, name, and bridge id', () => {
  const valid = JSON.stringify({
    pid: 42,
    cwd: '/repo',
    name: 'hybrid',
    sessionId: 'conversation',
    bridgeSessionId: 'session_remote',
  });
  assertEquals(
    parseHybridBridgeEvidence(valid, { pid: 42, cwd: '/repo', name: 'hybrid' })?.bridgeSessionId,
    'session_remote',
  );
  assertEquals(parseHybridBridgeEvidence(valid, { pid: 43, cwd: '/repo' }), undefined);
  assertEquals(
    parseHybridBridgeEvidence(valid.replace('session_remote', ''), { pid: 42, cwd: '/repo' }),
    undefined,
  );
});

function fakeDependencies(options: { attached: boolean; exits?: boolean }): {
  dependencies: HybridLauncherDependencies;
  calls: {
    args?: readonly string[];
    env?: Record<string, string>;
    removed: string[];
    killed: Deno.Signal[];
    modes: number[];
  };
} {
  const calls: {
    args?: readonly string[];
    env?: Record<string, string>;
    removed: string[];
    killed: Deno.Signal[];
    modes: number[];
  } = { removed: [], killed: [], modes: [] };
  const process: HybridClaudeProcess = {
    pid: 42,
    status: options.exits === false ? new Promise(() => {}) : Promise.resolve({ code: 0 }),
    kill: (signal) => calls.killed.push(signal),
  };
  return {
    calls,
    dependencies: {
      env: {
        HOME: '/home/test',
        PATH: '/bin',
        ANTHROPIC_BASE_URL: 'https://forbidden.invalid',
        OPENROUTER_API_KEY: 'protected',
      },
      launcherPath: '/repo/.llm/tools/agentic/claude/hybrid-launcher.ts',
      denoExecutable: '/trusted/deno',
      makeTempDir: () => Promise.resolve('/tmp/hybrid-owned'),
      assertDirectory: () => Promise.resolve(),
      writeTextFile: () => Promise.resolve(),
      chmod: (_path, mode) => {
        calls.modes.push(mode);
        return Promise.resolve();
      },
      remove: (path) => {
        calls.removed.push(path);
        return Promise.resolve();
      },
      readTextFile: () =>
        options.attached
          ? Promise.resolve(JSON.stringify({
            pid: 42,
            cwd: '/repo',
            name: 'hybrid',
            sessionId: 'conversation',
            bridgeSessionId: 'session_remote',
          }))
          : Promise.reject(new Deno.errors.NotFound()),
      spawn: (_command, args, _cwd, env) => {
        calls.args = args;
        calls.env = env;
        return process;
      },
      sleep: () => Promise.resolve(),
      addSignalListener: () => {},
      removeSignalListener: () => {},
    },
  };
}

Deno.test('launcher proves bridge attachment and always removes mode-0600 config', async () => {
  const { dependencies, calls } = fakeDependencies({ attached: true });
  const result = await launchHybridClaude({ cwd: '/repo', name: 'hybrid' }, dependencies);
  assertEquals(result.evidence.bridgeSessionId, 'session_remote');
  assertEquals(calls.modes, [0o700, 0o600]);
  assertEquals(calls.removed, ['/tmp/hybrid-owned']);
  assert(calls.args?.includes('--remote-control'));
  assert(calls.args?.includes('--dangerously-skip-permissions'));
  assert(!calls.args?.includes('--strict-mcp-config'));
  assertEquals(calls.env?.ANTHROPIC_BASE_URL, undefined);
  assertEquals(calls.env?.OPENROUTER_API_KEY, undefined);
});

Deno.test('launcher fails closed and cleans up without bridge evidence', async () => {
  const { dependencies, calls } = fakeDependencies({ attached: false, exits: false });
  await assertRejects(
    () => launchHybridClaude({ cwd: '/repo', name: 'hybrid' }, dependencies),
    Error,
    'attachment',
  );
  assertEquals(calls.killed, ['SIGTERM', 'SIGKILL']);
  assertEquals(calls.removed, ['/tmp/hybrid-owned']);
});

Deno.test('launcher rejects a non-directory cwd before creating config or spawning Claude', async () => {
  const { dependencies, calls } = fakeDependencies({ attached: true });
  let madeTemp = false;
  let spawned = false;
  await assertRejects(
    () =>
      launchHybridClaude({ cwd: '/missing' }, {
        ...dependencies,
        assertDirectory: () => Promise.reject(new Error('--cwd must identify a directory')),
        makeTempDir: () => {
          madeTemp = true;
          return Promise.resolve('/tmp/unexpected');
        },
        spawn: (...args) => {
          spawned = true;
          return dependencies.spawn(...args);
        },
      }),
    Error,
    'identify a directory',
  );
  assertEquals(madeTemp, false);
  assertEquals(spawned, false);
  assertEquals(calls.removed, []);
});

Deno.test('launcher rejects missing HOME before filesystem or process effects', async () => {
  const { dependencies } = fakeDependencies({ attached: true });
  let checkedDirectory = false;
  let madeTemp = false;
  await assertRejects(
    () =>
      launchHybridClaude({ cwd: '/repo' }, {
        ...dependencies,
        env: { PATH: '/bin' },
        assertDirectory: () => {
          checkedDirectory = true;
          return Promise.resolve();
        },
        makeTempDir: () => {
          madeTemp = true;
          return Promise.resolve('/tmp/unexpected');
        },
      }),
    Error,
    'HOME is required',
  );
  assertEquals(checkedDirectory, false);
  assertEquals(madeTemp, false);
});
