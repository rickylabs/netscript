/**
 * @module tools/validation/check-aspire-host-ports_test
 *
 * The scanner must reject the exact source shapes that shipped #952 and accept
 * the shapes that replaced them.
 */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { dirname, fromFileUrl, join } from 'jsr:@std/path@^1';
import { DEFAULT_ROOTS, scanContent, scanHostPorts } from './check-aspire-host-ports.ts';

const APPHOST = 'packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts';

Deno.test('host-port checks ignore retained run and transient files but not framework source', () => {
  const source = 'withHttpEndpoint({ port: 3000 })';
  for (
    const path of ['.llm/runs/old/apphost.ts', '.llm/tmp/apphost.ts', '.agents/generated/copy.ts']
  ) {
    assertEquals(scanContent(path, source).findings, []);
  }
  assertEquals(scanContent(APPHOST, source).findings.length, 1);
});

Deno.test('explicit generated-project validation still catches pins under a scratch parent', async () => {
  const root = await Deno.makeTempDir();
  try {
    const project = join(root, '.llm', 'tmp', 'generated-project');
    await Deno.mkdir(join(project, 'aspire'), { recursive: true });
    await Deno.writeTextFile(join(project, 'aspire', 'appsettings.json'), '{"HostPort":3000}');
    await Deno.mkdir(join(project, '.llm', 'runs', 'history'), { recursive: true });
    await Deno.writeTextFile(
      join(project, '.llm', 'runs', 'history', 'apphost.ts'),
      'withHttpEndpoint({ port: 3000 })',
    );
    assertEquals((await scanHostPorts([project])).scannedFiles, 0);
    const result = await scanHostPorts([project], true);
    assertEquals(result.scannedFiles, 1);
    assertEquals(result.findings.length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
const APPSETTINGS = 'packages/cli/src/kernel/templates/aspire/generate-appsettings.ts';
const GENERATOR =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts';
const CONTRIBUTION = 'plugins/workers/src/aspire/workers-contribution.ts';
const INFRASTRUCTURE =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';

Deno.test('rejects the generated line that shipped #952', () => {
  const { findings } = scanContent(
    GENERATOR,
    "lines.push(`      .withHttpEndpoint({ port: 3000, env: 'PORT' });`);",
  );
  assertEquals(findings.length, 1);
  assert(findings[0].message.includes('HostPort'));
});

Deno.test('accepts a config-driven pin, which a resource opts into', () => {
  const { findings } = scanContent(
    GENERATOR,
    'lines.push(`      .${renderHttpEndpointCall(entry)};`);',
  );
  assertEquals(findings, []);
});

Deno.test('rejects a multiline generated literal host-port call', () => {
  const { findings } = scanContent(
    GENERATOR,
    [
      'lines.push(`      .withHttpEndpoint({',
      "        port: 3000, env: 'PORT'",
      '      });`);',
    ].join('\n'),
  );
  assertEquals(findings.length, 1);
  assertEquals(findings[0].line, 1);
});

Deno.test('accepts the un-pinned shape', () => {
  const { findings } = scanContent(GENERATOR, "const options = `{ env: 'PORT' }`;");
  assertEquals(findings, []);
});

Deno.test('rejects every unconditional entry-port write that shipped #952', () => {
  // The four pre-fix lines, verbatim. None is a numeric literal — a rule that
  // matched only literals would look straight past the shape that shipped.
  const shipped = [
    [APPHOST, '        Port: appProxyPort,'],
    [APPHOST, '      Port: options.servicePort,'],
    [APPSETTINGS, '      Port: options.service.port,'],
    [APPSETTINGS, '        Port: appPort,'],
  ] as const;

  for (const [path, line] of shipped) {
    const { findings } = scanContent(path, line);
    assertEquals(findings.length, 1, `expected a finding for: ${line}`);
    assert(findings[0].message.includes('Aspire allocates'));
  }
});

Deno.test('accepts the conditional opt-in that replaced them', () => {
  const service = scanContent(
    APPHOST,
    '      ...(options.serviceHostPort ? { HostPort: options.serviceHostPort } : {}),',
  );
  const app = scanContent(APPSETTINGS, '        ...(appPort ? { HostPort: appPort } : {}),');
  assertEquals(service.findings, []);
  assertEquals(app.findings, []);
});

Deno.test('only checks entry ports in the files that compose appsettings entries', () => {
  const elsewhere = scanContent(
    'packages/cli/src/kernel/constants/port-ranges.ts',
    '  Port: 3000,',
  );
  assertEquals(elsewhere.findings, []);
});

Deno.test('honours an explicit justification marker', () => {
  const { findings, allowances } = scanContent(
    APPHOST,
    '        Port: 5432, // aspire-host-port-ok: fixed by an external contract',
  );
  assertEquals(findings, []);
  assertEquals(allowances.length, 1);
  assertEquals(allowances[0].reason, 'fixed by an external contract');
});

Deno.test('treats an empty justification as a failure', () => {
  const { findings, allowances } = scanContent(
    APPHOST,
    '        Port: 5432, // aspire-host-port-ok:',
  );
  assertEquals(allowances, []);
  assertEquals(findings.length, 1);
  assert(findings[0].message.includes('empty reason'));
});

Deno.test('rejects a pinned host port in a generated appsettings file', () => {
  const result = scanContent(
    'fixture/aspire/appsettings.json',
    '{\n  "Resources": { "api": { "HostPort": 8091 } }\n}\n',
  );
  assertEquals(result.findings.length, 1);
});

Deno.test('does not descend into generated runtime state', async () => {
  const root = await Deno.makeTempDir();
  try {
    const stateDir = join(root, '.data', 'postgres');
    await Deno.mkdir(stateDir, { recursive: true });
    await Deno.writeTextFile(
      join(stateDir, 'appsettings.json'),
      '{"Resources":{"db":{"HostPort":5432}}}',
    );

    const result = await scanHostPorts([root]);
    assertEquals(result.scannedFiles, 0);
    assertEquals(result.findings, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('rejects contribution fallback ports and loopback URL literals', () => {
  const fallback = scanContent(
    CONTRIBUTION,
    'const port = ctx.port(WORKERS_API_RESOURCE, WORKERS_API_DEFAULT_PORT);',
  );
  const url = scanContent(
    CONTRIBUTION,
    'url: `http://localhost:${WORKERS_API_DEFAULT_PORT}/health`,',
  );
  assertEquals(fallback.findings.length, 1);
  assertEquals(url.findings.length, 1);
});

Deno.test('rejects a multiline contribution fallback port with the call line', () => {
  const result = scanContent(
    CONTRIBUTION,
    ['const port = ctx.port(resource,', '  defaultPort', ');'].join('\n'),
  );
  assertEquals(result.findings.length, 1);
  assertEquals(result.findings[0].line, 1);
});

Deno.test('accepts a single-argument contribution port call', () => {
  const result = scanContent(CONTRIBUTION, 'const port = ctx.port(resource);');
  assertEquals(result.findings, []);
});

Deno.test('accepts allocated contribution ports and resource references', () => {
  const allocated = scanContent(
    CONTRIBUTION,
    'const port = ctx.port(WORKERS_API_RESOURCE);',
  );
  const reference = scanContent(
    CONTRIBUTION,
    "WORKERS_API_URL: { kind: 'resource', resource: WORKERS_API_RESOURCE, key: 'url' },",
  );
  assertEquals(allocated.findings, []);
  assertEquals(reference.findings, []);
});

Deno.test('rejects generated infrastructure host-port literals', () => {
  const result = scanContent(INFRASTRUCTURE, "lines.push('    port: 5432,')");
  assertEquals(result.findings.length, 1);
});

Deno.test('accepts explicit-only infrastructure host-port interpolation', () => {
  const result = scanContent(INFRASTRUCTURE, 'lines.push(`    port: ${entry.Port},`)');
  assertEquals(result.findings, []);
});

const GATE = fromFileUrl(new URL('./check-aspire-host-ports.ts', import.meta.url));
const REPO_CONFIG = fromFileUrl(new URL('../../../deno.json', import.meta.url));
const STREAMS_FACTORY_PLUGINS = ['auth', 'sagas', 'triggers', 'workers'] as const;
/** The line a stale-base branch re-introduced into all four factories (#1893). */
const STREAMS_FACTORY_FALLBACK = "  const baseUrl = options.baseUrl ?? 'http://localhost:4437';";

Deno.test('S5 runtime literal policy holds on the shipped tree, with only reasoned allowances', async () => {
  // The S5 policy is the gate's own LINE_RULES; this asserts it over the same
  // roots `check:aspire-host-ports` scans instead of restating it as a grep.
  const result = await scanHostPorts(DEFAULT_ROOTS);
  assertEquals(result.findings, []);
  assertEquals(result.allowances.map((allowance) => allowance.path).sort(), [
    'plugins/auth/services/src/backend-registry.ts',
    'plugins/auth/src/constants.ts',
    'plugins/sagas/src/constants.ts',
    'plugins/triggers/src/constants.ts',
  ]);
});

Deno.test('rejects the loopback service-URL fallback in every plugin streams factory', () => {
  for (const plugin of STREAMS_FACTORY_PLUGINS) {
    const { findings } = scanContent(
      `plugins/${plugin}/streams/factory.ts`,
      STREAMS_FACTORY_FALLBACK,
    );
    assertEquals(findings.length, 1, `expected a finding for plugins/${plugin}/streams/factory.ts`);
    assert(findings[0].message.includes('loopback service port'));
  }
});

Deno.test('accepts the discovery-driven streams factory URL', () => {
  const { findings } = scanContent(
    'plugins/auth/streams/factory.ts',
    "      url: buildStreamUrl('/auth/sessions', options.baseUrl),",
  );
  assertEquals(findings, []);
});

Deno.test('rejects a retired service port in CLI source and E2E probes', () => {
  for (
    const path of ['packages/cli/src/kernel/probe.ts', 'packages/cli/e2e/src/probe.ts']
  ) {
    const { findings } = scanContent(path, "const url = 'http://127.0.0.1:8091/health';");
    assertEquals(findings.length, 1, `expected a finding for ${path}`);
  }
});

Deno.test('keeps the loopback-URL rule scoped to plugin runtime source', () => {
  const { findings } = scanContent(
    'packages/cli/src/kernel/help.ts',
    "const example = 'http://localhost:3000';",
  );
  assertEquals(findings, []);
});

async function runGateOnStreamsFactory(line: string): Promise<{ code: number; stdout: string }> {
  const root = await Deno.makeTempDir();
  try {
    const factory = join(root, 'plugins', 'auth', 'streams', 'factory.ts');
    await Deno.mkdir(dirname(factory), { recursive: true });
    await Deno.writeTextFile(
      factory,
      `export function create(options: { baseUrl?: string }) {\n${line}\n}\n`,
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--allow-read', '--config', REPO_CONFIG, GATE, 'plugins', '--pretty'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return { code: output.code, stdout: new TextDecoder().decode(output.stdout) };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('the gate exits non-zero when a streams factory re-introduces the fallback', async () => {
  const red = await runGateOnStreamsFactory(STREAMS_FACTORY_FALLBACK);
  assertEquals(red.code, 1);
  assert(red.stdout.includes('plugins/auth/streams/factory.ts:2'));

  // Negative control: the same tree without the literal passes.
  const green = await runGateOnStreamsFactory('  const baseUrl = options.baseUrl;');
  assertEquals(green.code, 0, green.stdout);
});

Deno.test('rejects Garnet executable literal argv ports in generator and emitted helpers', () => {
  const paths = [INFRASTRUCTURE, 'fixture/aspire/.helpers/register-infrastructure.mts'];
  const argv = [
    "['tool', 'run', 'garnet-server', '--port', '6379']",
    "['tool', 'run', 'garnet-server', '--port', '${CACHE_DEFAULT_PORT}']",
    "['tool', 'run', 'garnet-server', '--port',\n '6379']",
  ];
  for (const path of paths) {
    for (const text of argv) {
      const result = scanContent(path, text);
      assertEquals(result.findings.length, 1, text);
      assert(result.findings[0].message.includes('TargetPort'));
    }
  }
});

Deno.test('accepts allocated Garnet executable arguments and container-internal ports', () => {
  const result = scanContent(
    INFRASTRUCTURE,
    [
      "['tool', 'run', 'garnet-server']",
      "await args.add('--port');",
      'await args.add(endpoint.property(EndpointProperty.TargetPort));',
      "withEndpoint({ name: 'tcp', targetPort: 6379, scheme: 'tcp' })",
    ].join('\n'),
  );
  assertEquals(result.findings, []);
});
